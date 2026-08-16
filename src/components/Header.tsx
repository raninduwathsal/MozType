import React from 'react';
import {
  Keyboard,
  Trophy,
  User,
  Settings,
  Flame,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  currentSession: UserSession | null;
  onOpenSessionModal: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onResetTest: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  onOpenSessionModal,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenSettings,
  onResetTest
}) => {
  return (
    <header className="app-header">
      <div className="brand-container" onClick={onResetTest}>
        <div className="brand-icon">
          <Flame size={22} />
        </div>
        <div className="brand-title">
          <span>moz</span>
          <span className="accent">type</span>
          <span className="brand-version">v1.0</span>
        </div>
      </div>

      <div className="header-actions">
        {/* Session Status Pill */}
        {currentSession && currentSession.active ? (
          <div className="session-pill" onClick={onOpenSessionModal} title="Click to manage active session">
            <span className="session-indicator" />
            <span className="session-name">{currentSession.username}</span>
            {currentSession.bestWpm > 0 && (
              <span className="session-wpm">{Math.round(currentSession.bestWpm)} wpm</span>
            )}
          </div>
        ) : (
          <button
            className="header-btn highlight"
            onClick={onOpenSessionModal}
            title="Start a new ranked session"
          >
            <PlusCircle size={17} />
            <span>New Session</span>
          </button>
        )}

        {/* Navigation Buttons */}
        <button
          className="header-btn"
          onClick={onResetTest}
          title="Typing Test"
        >
          <Keyboard size={18} />
          <span>Test</span>
        </button>

        <button
          className="header-btn"
          onClick={onOpenLeaderboard}
          title="Leaderboards"
        >
          <Trophy size={18} />
          <span>Leaderboard</span>
        </button>

        <button
          className="header-btn"
          onClick={onOpenProfile}
          title="Profile & Stats"
        >
          <User size={18} />
          <span>Profile</span>
        </button>

        <button
          className="header-btn"
          onClick={onOpenSettings}
          title="Settings & Themes"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
};
