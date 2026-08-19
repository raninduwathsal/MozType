import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { TypingArea } from './components/TypingArea';
import { ResultsModal } from './components/ResultsModal';
import { SessionModal } from './components/SessionModal';
import { LeaderboardPage } from './components/LeaderboardPage';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { CustomTextModal } from './components/CustomTextModal';
import { CommandPalette } from './components/CommandPalette';
import { CapsLockWarning } from './components/CapsLockWarning';

import {
  TestMode,
  TimeDuration,
  WordCount,
  QuoteLength,
  TestModifiers,
  TestResult,
  UserSession,
  UserSettings
} from './types';

import { StorageDAL, DEFAULT_SETTINGS } from './utils/storage';
import { MozTypeApi } from './utils/api';
import { applyTheme } from './utils/theme-manager';
import { SoundEngine } from './core/sound-engine';
import { AntiCheatValidator } from './core/anti-cheat';
import { Terminal, Shield, Sparkles, Command } from 'lucide-react';

export const App: React.FC = () => {
  // Routing ('/' for typing test, '/leaderboard' for fullscreen leaderboard page)
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/leaderboard' || path.startsWith('/leaderboard')) {
        return '/leaderboard';
      }
    }
    return '/';
  });

  const navigateTo = useCallback((route: string) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', route);
    }
  }, []);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/leaderboard' || path.startsWith('/leaderboard')) {
        setCurrentRoute('/leaderboard');
      } else {
        setCurrentRoute('/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Settings & Theme
  const [settings, setSettings] = useState<UserSettings>(() => StorageDAL.getSettings());

  // Session
  const [currentSession, setCurrentSession] = useState<UserSession | null>(() => StorageDAL.getCurrentSession());

  // Test Configuration
  const [mode, setMode] = useState<TestMode>('time');
  const [timeDuration, setTimeDuration] = useState<TimeDuration>(15);
  const [wordCount, setWordCount] = useState<WordCount>(50);
  const [quoteLength, setQuoteLength] = useState<QuoteLength>('medium');
  const [modifiers, setModifiers] = useState<TestModifiers>({
    punctuation: false,
    numbers: false,
    blindMode: false,
    lazyMode: false,
    reverseOrder: false
  });
  const [customText, setCustomText] = useState<string>(
    "The quick brown fox jumps over the lazy dog. Programming is the art of algorithm design and precision."
  );

  // Test Lifecycle & Active Result
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testKey, setTestKey] = useState(0); // for forcing test reset
  const [isCapsLock, setIsCapsLock] = useState(false);

  // Modals
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Initialize Theme and Sound
  useEffect(() => {
    applyTheme(settings.theme);
    SoundEngine.setSoundType(settings.soundType);
    SoundEngine.setVolume(settings.soundVolume);
  }, [settings]);

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    StorageDAL.saveSettings(updated);
  };

  // Start Session
  const handleStartSession = (username: string) => {
    const session = StorageDAL.startSession(username);
    setCurrentSession(session);
    handleResetTest();
  };

  // Finalize Session (locks username and submits high score to MongoDB Atlas)
  const handleFinalizeSession = () => {
    if (currentSession && currentSession.active) {
      // Sync with live MongoDB Atlas
      MozTypeApi.finalizeSession({
        username: currentSession.username,
        bestWpm: currentSession.bestWpm,
        mode,
        modeDetail: mode === 'time' ? timeDuration : mode === 'words' ? wordCount : quoteLength
      });
    }

    const { finalizedSession } = StorageDAL.finalizeSession();
    setCurrentSession(null);
  };

  // Reset Test
  const handleResetTest = useCallback(() => {
    setTestResult(null);
    setTestKey(prev => prev + 1);
  }, []);

  // Handle Test Completion
  const handleFinishTest = useCallback((rawResult: TestResult) => {
    // 1. Check Anti-cheat & PB eligibility
    const { eligible } = AntiCheatValidator.isLeaderboardEligible(rawResult, []);

    // 2. Check if this is a personal best
    let isPb = false;
    if (eligible) {
      isPb = StorageDAL.checkAndUpdatePb(rawResult);
    }
    rawResult.isPb = isPb;

    // 3. Save to local history
    StorageDAL.saveTestResult(rawResult);

    // 4. Update session score if active
    if (currentSession && currentSession.active) {
      const updatedSession = StorageDAL.updateSessionScore(rawResult);
      if (updatedSession) {
        setCurrentSession({ ...updatedSession });
      }

      // Automatically sync provisional/pending score to live MongoDB Atlas leaderboard
      if (rawResult.wpm > 0) {
        MozTypeApi.submitPendingScore({
          username: currentSession.username,
          wpm: rawResult.wpm,
          rawWpm: rawResult.rawWpm,
          accuracy: rawResult.accuracy,
          consistency: rawResult.consistency,
          mode: rawResult.mode,
          modeDetail: rawResult.modeDetail
        });
      }
    }

    // 5. Asynchronously persist result to live MongoDB Atlas
    MozTypeApi.submitResult(rawResult);

    setTestResult(rawResult);
  }, [currentSession, mode, timeDuration, wordCount, quoteLength]);

  // Global Keyboard Shortcuts (Esc / Ctrl+K for command palette)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        if (
          sessionModalOpen ||
          profileOpen ||
          settingsOpen ||
          customModalOpen ||
          commandPaletteOpen
        ) {
          setSessionModalOpen(false);
          setProfileOpen(false);
          setSettingsOpen(false);
          setCustomModalOpen(false);
          setCommandPaletteOpen(false);
        } else {
          setCommandPaletteOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    sessionModalOpen,
    profileOpen,
    settingsOpen,
    customModalOpen,
    commandPaletteOpen
  ]);

  return (
    <div className="moztype-app">
      {/* Route Switcher: /leaderboard vs / */}
      {currentRoute === '/leaderboard' ? (
        <LeaderboardPage
          currentSession={currentSession}
          onNavigateToTest={() => navigateTo('/')}
          onOpenSessionModal={() => setSessionModalOpen(true)}
        />
      ) : (
        <>
          {/* Top Navigation & Session Header */}
          <Header
            currentSession={currentSession}
            onOpenSessionModal={() => setSessionModalOpen(true)}
            onOpenLeaderboard={() => navigateTo('/leaderboard')}
            onOpenProfile={() => setProfileOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onResetTest={handleResetTest}
          />

          {/* Main Mode & Modifiers Bar (visible during test) */}
          {!testResult && (
            <ModeSelector
              mode={mode}
              timeDuration={timeDuration}
              wordCount={wordCount}
              quoteLength={quoteLength}
              modifiers={modifiers}
              onSelectMode={newMode => {
                setMode(newMode);
                handleResetTest();
              }}
              onSelectTimeDuration={newDuration => {
                setTimeDuration(newDuration);
                handleResetTest();
              }}
              onSelectWordCount={newCount => {
                setWordCount(newCount);
                handleResetTest();
              }}
              onSelectQuoteLength={newLength => {
                setQuoteLength(newLength);
                handleResetTest();
              }}
              onTogglePunctuation={() => {
                setModifiers(m => ({ ...m, punctuation: !m.punctuation }));
                handleResetTest();
              }}
              onToggleNumbers={() => {
                setModifiers(m => ({ ...m, numbers: !m.numbers }));
                handleResetTest();
              }}
              onOpenCustomModal={() => setCustomModalOpen(true)}
            />
          )}

          {/* Main Interactive Stage */}
          {testResult ? (
            <ResultsModal
              result={testResult}
              onRestart={handleResetTest}
              onNextTest={handleResetTest}
            />
          ) : (
            <TypingArea
              key={testKey}
              mode={mode}
              timeDuration={timeDuration}
              wordCount={wordCount}
              quoteLength={quoteLength}
              modifiers={modifiers}
              customText={customText}
              settings={settings}
              username={currentSession?.username || 'Guest'}
              onFinishTest={handleFinishTest}
              onCapsLockChange={setIsCapsLock}
            />
          )}
        </>
      )}

      {/* Caps Lock Alert Banner */}
      {settings.capsLockWarning && <CapsLockWarning show={isCapsLock} />}

      {/* Modals & Overlays */}
      {sessionModalOpen && (
        <SessionModal
          currentSession={currentSession}
          onStartSession={handleStartSession}
          onFinalizeSession={handleFinalizeSession}
          onClose={() => setSessionModalOpen(false)}
        />
      )}

      {profileOpen && (
        <ProfileModal
          currentSession={currentSession}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {customModalOpen && (
        <CustomTextModal
          initialText={customText}
          onSave={text => {
            setCustomText(text);
            handleResetTest();
          }}
          onClose={() => setCustomModalOpen(false)}
        />
      )}

      {commandPaletteOpen && (
        <CommandPalette
          onClose={() => setCommandPaletteOpen(false)}
          onSelectTheme={t => handleUpdateSettings({ theme: t })}
          onSelectMode={m => { setMode(m); handleResetTest(); navigateTo('/'); }}
          onSelectTimeDuration={d => { setTimeDuration(d); handleResetTest(); navigateTo('/'); }}
          onSelectWordCount={w => { setWordCount(w); handleResetTest(); navigateTo('/'); }}
          onSelectSound={s => handleUpdateSettings({ soundType: s })}
          onOpenLeaderboard={() => navigateTo('/leaderboard')}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenSessionModal={() => setSessionModalOpen(true)}
          onRestartTest={() => { handleResetTest(); navigateTo('/'); }}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-links">
          <button
            className="footer-link"
            style={{ background: 'transparent', border: 'none', font: 'inherit' }}
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Command size={14} />
            <span>command line <span className="kbd-badge" style={{ marginLeft: '4px' }}>esc</span></span>
          </button>
          <div className="footer-link">
            <Shield size={14} />
            <span>anti-cheat verified</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-sub)' }}>
          <span>MozType Clean-Room Engine</span>
        </div>
      </footer>
    </div>
  );
};
