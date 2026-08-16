import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  TestMode,
  TimeDuration,
  WordCount,
  QuoteLength,
  TestModifiers,
  TestResult,
  KeypressEvent,
  TickStep,
  UserSettings
} from '../types';
import { WordsGenerator } from '../core/words-generator';
import { TestTimer } from '../core/test-timer';
import { StatsCalculator } from '../core/stats-calculator';
import { SoundEngine } from '../core/sound-engine';
import { RotateCcw } from 'lucide-react';

interface TypingAreaProps {
  mode: TestMode;
  timeDuration: TimeDuration;
  wordCount: WordCount;
  quoteLength: QuoteLength;
  modifiers: TestModifiers;
  customText: string;
  settings: UserSettings;
  username: string;
  onFinishTest: (result: TestResult) => void;
  onCapsLockChange: (isCaps: boolean) => void;
}

export const TypingArea: React.FC<TypingAreaProps> = ({
  mode,
  timeDuration,
  wordCount,
  quoteLength,
  modifiers,
  customText,
  settings,
  username,
  onFinishTest,
  onCapsLockChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsWrapperRef = useRef<HTMLDivElement>(null);
  const wordsListRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live stat DOM references for 0-latency updates without React re-renders
  const timerDisplayRef = useRef<HTMLDivElement>(null);
  const liveWpmDisplayRef = useRef<HTMLDivElement>(null);
  const liveWpmValRef = useRef<HTMLSpanElement>(null);

  const [isFocused, setIsFocused] = useState(true);

  // Engine internal state refs (never causes component re-renders during typing)
  const wordsRef = useRef<string[]>([]);
  const testActiveRef = useRef(false);
  const testFinishedRef = useRef(false);
  const currentWordIndexRef = useRef(0);
  const currentLetterIndexRef = useRef(0);
  const wordsGeneratorRef = useRef<WordsGenerator>(new WordsGenerator(modifiers));
  const timerRef = useRef<TestTimer | null>(null);
  const eventsLogRef = useRef<KeypressEvent[]>([]);
  const tickHistoryRef = useRef<TickStep[]>([]);

  // Finish test handler
  const finishTest = useCallback((durationSeconds?: number) => {
    if (testFinishedRef.current) return;
    testFinishedRef.current = true;
    testActiveRef.current = false;

    if (timerRef.current) {
      timerRef.current.stop();
    }

    const elapsed = timerRef.current ? timerRef.current.getElapsedSeconds() : 1;
    const finalDuration = durationSeconds && durationSeconds > 0 ? durationSeconds : Math.max(1, elapsed);
    const quoteMeta = wordsGeneratorRef.current.getQuoteMetadata();
    const modeDetail = mode === 'time' ? timeDuration : mode === 'words' ? wordCount : quoteLength;

    const result = StatsCalculator.buildTestResult({
      mode,
      modeDetail,
      modifiers,
      durationSeconds: finalDuration,
      events: eventsLogRef.current,
      tickHistory: tickHistoryRef.current,
      username,
      quoteMeta
    });

    onFinishTest(result);
  }, [mode, timeDuration, wordCount, quoteLength, modifiers, username, onFinishTest]);

  // Caret positioning & Smooth Line Scrolling
  const updateCaretPosition = useCallback(() => {
    if (!wordsListRef.current || !caretRef.current || !wordsWrapperRef.current) return;

    const wordIdx = currentWordIndexRef.current;
    const letterIdx = currentLetterIndexRef.current;

    const wordElements = wordsListRef.current.querySelectorAll('.word');
    if (wordIdx >= wordElements.length) return;

    const activeWordEl = wordElements[wordIdx] as HTMLElement;
    if (!activeWordEl) return;

    const letterElements = activeWordEl.querySelectorAll('.letter');
    let targetLeft = 0;
    let targetTop = activeWordEl.offsetTop;

    if (letterIdx < letterElements.length) {
      const activeLetterEl = letterElements[letterIdx] as HTMLElement;
      targetLeft = activeWordEl.offsetLeft + activeLetterEl.offsetLeft;
      targetTop = activeWordEl.offsetTop + activeLetterEl.offsetTop;
    } else {
      // Caret at the end of word
      if (letterElements.length > 0) {
        const lastLetter = letterElements[letterElements.length - 1] as HTMLElement;
        targetLeft = activeWordEl.offsetLeft + lastLetter.offsetLeft + lastLetter.offsetWidth;
        targetTop = activeWordEl.offsetTop + lastLetter.offsetTop;
      } else {
        targetLeft = activeWordEl.offsetLeft;
        targetTop = activeWordEl.offsetTop;
      }
    }

    // Caret position
    caretRef.current.style.transform = `translate(${targetLeft}px, ${targetTop}px)`;

    // Smooth Line Scrolling: Keep horizontal line 2 in view
    const lineHeight = 48;
    if (targetTop > lineHeight) {
      const scrollY = targetTop - lineHeight;
      wordsWrapperRef.current.style.transform = `translateY(-${scrollY}px)`;
    } else {
      wordsWrapperRef.current.style.transform = 'translateY(0px)';
    }
  }, []);

  // Direct DOM rendering of words into wordsListRef
  const renderWordsToDOM = useCallback((wordsList: string[]) => {
    if (!wordsListRef.current) return;

    wordsListRef.current.innerHTML = '';
    const fragment = document.createDocumentFragment();

    wordsList.forEach((word) => {
      const wordEl = document.createElement('div');
      wordEl.className = 'word';

      for (let i = 0; i < word.length; i++) {
        const letterEl = document.createElement('span');
        letterEl.className = 'letter';
        letterEl.textContent = word[i];
        wordEl.appendChild(letterEl);
      }
      fragment.appendChild(wordEl);
    });

    wordsListRef.current.appendChild(fragment);

    if (caretRef.current) {
      caretRef.current.classList.remove('is-typing');
      caretRef.current.style.transform = 'translate(0px, 0px)';
    }

    if (wordsWrapperRef.current) {
      wordsWrapperRef.current.style.transform = 'translateY(0px)';
    }

    updateCaretPosition();
  }, [updateCaretPosition]);

  // Dynamically append new words to DOM without destroying existing DOM nodes
  const appendWordsToDOM = useCallback((newWords: string[]) => {
    if (!wordsListRef.current) return;
    const fragment = document.createDocumentFragment();

    newWords.forEach((word) => {
      const wordEl = document.createElement('div');
      wordEl.className = 'word';

      for (let i = 0; i < word.length; i++) {
        const letterEl = document.createElement('span');
        letterEl.className = 'letter';
        letterEl.textContent = word[i];
        wordEl.appendChild(letterEl);
      }
      fragment.appendChild(wordEl);
    });

    wordsListRef.current.appendChild(fragment);
  }, []);

  // Initialize/Reset Test
  const initTest = useCallback(() => {
    testActiveRef.current = false;
    testFinishedRef.current = false;
    currentWordIndexRef.current = 0;
    currentLetterIndexRef.current = 0;
    eventsLogRef.current = [];
    tickHistoryRef.current = [];

    if (timerRef.current) {
      timerRef.current.stop();
    }

    wordsGeneratorRef.current.setModifiers(modifiers);
    let initialWords: string[] = [];

    if (mode === 'time') {
      initialWords = wordsGeneratorRef.current.generateWords(150);
      if (timerDisplayRef.current) {
        timerDisplayRef.current.textContent = `${timeDuration}`;
      }
    } else if (mode === 'words') {
      initialWords = wordsGeneratorRef.current.generateWords(wordCount);
      if (timerDisplayRef.current) {
        timerDisplayRef.current.textContent = `${wordCount} words left`;
      }
    } else if (mode === 'quote') {
      initialWords = wordsGeneratorRef.current.generateQuote(quoteLength);
      if (timerDisplayRef.current) {
        timerDisplayRef.current.textContent = `${initialWords.length} words left`;
      }
    } else if (mode === 'zen') {
      initialWords = wordsGeneratorRef.current.generateZen();
      if (timerDisplayRef.current) {
        timerDisplayRef.current.textContent = 'Zen Mode';
      }
    } else if (mode === 'custom') {
      initialWords = wordsGeneratorRef.current.generateCustom(customText);
      if (timerDisplayRef.current) {
        timerDisplayRef.current.textContent = `${initialWords.length} words left`;
      }
    }

    wordsRef.current = initialWords;
    renderWordsToDOM(initialWords);

    if (liveWpmDisplayRef.current) {
      liveWpmDisplayRef.current.style.display = 'none';
    }

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
      updateCaretPosition();
    }, 20);
  }, [mode, timeDuration, wordCount, quoteLength, modifiers, customText, renderWordsToDOM, updateCaretPosition]);

  // Setup precision timer
  useEffect(() => {
    const isCountdown = mode === 'time';
    const duration = mode === 'time' ? timeDuration : 99999;

    timerRef.current = new TestTimer(
      duration,
      isCountdown,
      (currentSec, elapsedMs) => {
        // Direct DOM update for live timer
        if (mode === 'time') {
          if (timerDisplayRef.current) {
            timerDisplayRef.current.textContent = `${currentSec}`;
          }
        }

        // Calculate live WPM
        const correctChars = eventsLogRef.current.filter(e => e.isCorrect).length;
        const allChars = eventsLogRef.current.length;
        const elapsedSec = elapsedMs / 1000;
        const currentWpm = StatsCalculator.calculateWpm(correctChars, elapsedSec);
        const currentRaw = StatsCalculator.calculateRawWpm(allChars, elapsedSec);
        
        // Per-second delta errors calculation (not cumulative)
        const totalErrors = eventsLogRef.current.filter(e => !e.isCorrect && !e.isBackspace).length;
        const lastCumulative = tickHistoryRef.current.length > 0
          ? tickHistoryRef.current[tickHistoryRef.current.length - 1].cumulativeErrors || 0
          : 0;
        const deltaErrors = Math.max(0, totalErrors - lastCumulative);

        // Direct DOM update for live WPM pill
        if (settings.showLiveWpm && liveWpmDisplayRef.current && liveWpmValRef.current) {
          liveWpmDisplayRef.current.style.display = 'flex';
          liveWpmValRef.current.textContent = `${Math.round(currentWpm)}`;
        }

        tickHistoryRef.current.push({
          second: Math.round(elapsedSec),
          timestamp: performance.now(),
          wpm: currentWpm,
          rawWpm: currentRaw,
          errors: deltaErrors,
          cumulativeErrors: totalErrors,
          correctChars,
          allChars
        });
      },
      (totalDurationMs) => {
        finishTest(mode === 'time' ? timeDuration : totalDurationMs / 1000);
      }
    );

    return () => {
      timerRef.current?.stop();
    };
  }, [mode, timeDuration, settings.showLiveWpm, finishTest]);

  // Run init on mount or config change
  useEffect(() => {
    initTest();
  }, [initTest]);

  // Keydown Handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onCapsLockChange(e.getModifierState('CapsLock'));

    // Quick restart (Tab)
    if (e.key === 'Tab') {
      e.preventDefault();
      initTest();
      return;
    }

    if (testFinishedRef.current) return;

    // Start timer on first valid keypress
    if (!testActiveRef.current && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      testActiveRef.current = true;
      timerRef.current?.start();
      if (caretRef.current) {
        caretRef.current.classList.add('is-typing');
      }
    }

    const wordIdx = currentWordIndexRef.current;
    const letterIdx = currentLetterIndexRef.current;
    const wordsList = wordsRef.current;

    if (!wordsListRef.current || wordsList.length === 0 || wordIdx >= wordsList.length) {
      return;
    }

    const wordElements = wordsListRef.current.querySelectorAll('.word');
    if (wordIdx >= wordElements.length) return;

    const currentWordEl = wordElements[wordIdx] as HTMLElement;
    const currentWordText = wordsList[wordIdx] || '';
    const letterElements = currentWordEl.querySelectorAll('.letter');

    // 1. Backspace Key
    if (e.key === 'Backspace') {
      e.preventDefault();

      if (e.ctrlKey || e.altKey) {
        // Delete entire current word or previous word
        if (letterIdx > 0) {
          while (currentLetterIndexRef.current > 0) {
            const idx = currentLetterIndexRef.current - 1;
            if (idx >= currentWordText.length) {
              const extras = currentWordEl.querySelectorAll('.letter.extra');
              if (extras.length > 0) extras[extras.length - 1].remove();
            } else if (idx < letterElements.length) {
              letterElements[idx].className = 'letter';
            }
            currentLetterIndexRef.current--;
          }
          currentWordEl.classList.remove('error-word');
        } else if (wordIdx > 0) {
          const prevWordIdx = wordIdx - 1;
          const prevWordEl = wordElements[prevWordIdx] as HTMLElement;
          const prevLetters = prevWordEl.querySelectorAll('.letter');
          const prevExtras = prevWordEl.querySelectorAll('.letter.extra');
          prevExtras.forEach(ex => ex.remove());
          prevLetters.forEach(letEl => { letEl.className = 'letter'; });
          prevWordEl.classList.remove('error-word');
          currentWordIndexRef.current = prevWordIdx;
          currentLetterIndexRef.current = 0;
        }
        updateCaretPosition();
        SoundEngine.playKeypress();
        return;
      }

      if (letterIdx > 0) {
        // Backspace within current word
        const prevIdx = letterIdx - 1;
        if (prevIdx >= currentWordText.length) {
          const extras = currentWordEl.querySelectorAll('.letter.extra');
          if (extras.length > 0) {
            extras[extras.length - 1].remove();
          }
        } else if (prevIdx < letterElements.length) {
          letterElements[prevIdx].className = 'letter';
        }
        currentLetterIndexRef.current = prevIdx;

        const hasErrors = currentWordEl.querySelector('.letter.incorrect, .letter.extra');
        if (!hasErrors) {
          currentWordEl.classList.remove('error-word');
        }

        eventsLogRef.current.push({
          key: 'Backspace',
          timestamp: performance.now(),
          expected: '',
          isCorrect: true,
          isBackspace: true,
          wordIndex: wordIdx,
          letterIndex: prevIdx
        });

        SoundEngine.playKeypress();
        updateCaretPosition();
      } else if (wordIdx > 0) {
        // Backspace back to the PREVIOUS word
        const prevWordIdx = wordIdx - 1;
        const prevWordEl = wordElements[prevWordIdx] as HTMLElement;
        const prevWordText = wordsList[prevWordIdx] || '';
        const prevLetters = prevWordEl.querySelectorAll('.letter');
        const prevExtras = prevWordEl.querySelectorAll('.letter.extra');

        // Un-mark any missed letters on the previous word
        prevLetters.forEach(letEl => {
          if (letEl.classList.contains('missed')) {
            letEl.classList.remove('missed');
          }
        });

        currentWordIndexRef.current = prevWordIdx;
        currentLetterIndexRef.current = prevWordText.length + prevExtras.length;

        // Clean error class if no errors remain
        const hasErrors = prevWordEl.querySelector('.letter.incorrect, .letter.extra');
        if (!hasErrors) {
          prevWordEl.classList.remove('error-word');
        }

        eventsLogRef.current.push({
          key: 'Backspace',
          timestamp: performance.now(),
          expected: '',
          isCorrect: true,
          isBackspace: true,
          wordIndex: prevWordIdx,
          letterIndex: currentLetterIndexRef.current
        });

        SoundEngine.playKeypress();
        updateCaretPosition();
      }
      return;
    }

    // 2. Spacebar Key (Word Transition)
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (!testActiveRef.current) return;

      // Mark un-typed letters as missed
      if (letterIdx < currentWordText.length) {
        for (let i = letterIdx; i < letterElements.length; i++) {
          letterElements[i].classList.add('missed');
        }
        currentWordEl.classList.add('error-word');
        SoundEngine.playError();
      } else {
        SoundEngine.playKeypress(true);
      }

      // Dynamic word buffer stream loading (Time & Zen mode)
      if (mode === 'time' || mode === 'zen') {
        if (wordIdx >= wordsList.length - 35) {
          const newBatch = wordsGeneratorRef.current.addMoreWords(45);
          wordsRef.current = [...wordsRef.current, ...newBatch];
          appendWordsToDOM(newBatch);
        }
      }

      // Check if test completed in Words/Quote/Custom mode
      if (wordIdx + 1 >= wordsList.length && (mode === 'words' || mode === 'quote' || mode === 'custom')) {
        finishTest();
        return;
      }

      // Advance to next word
      currentWordIndexRef.current += 1;
      currentLetterIndexRef.current = 0;

      // Update words remaining display directly
      if (timerDisplayRef.current && (mode === 'words' || mode === 'quote' || mode === 'custom')) {
        const remaining = Math.max(0, wordsList.length - currentWordIndexRef.current);
        timerDisplayRef.current.textContent = `${remaining} words left`;
      }

      updateCaretPosition();
      return;
    }

    // 3. Zen Mode Finish Shortcut (Shift + Enter)
    if (mode === 'zen' && e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      finishTest();
      return;
    }

    // 4. Regular Printable Characters
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const typedChar = e.key;

      if (letterIdx < currentWordText.length) {
        const expectedChar = currentWordText[letterIdx];
        const isCorrect = typedChar === expectedChar;
        const letterEl = letterElements[letterIdx];

        if (letterEl) {
          letterEl.className = `letter ${isCorrect ? 'correct' : 'incorrect'}`;
        }

        if (!isCorrect) {
          currentWordEl.classList.add('error-word');
          SoundEngine.playError();
        } else {
          SoundEngine.playKeypress();
        }

        eventsLogRef.current.push({
          key: typedChar,
          timestamp: performance.now(),
          expected: expectedChar,
          isCorrect,
          wordIndex: wordIdx,
          letterIndex: letterIdx
        });

        currentLetterIndexRef.current += 1;
      } else {
        // Extra characters
        if (letterIdx < currentWordText.length + 15) {
          const extraEl = document.createElement('span');
          extraEl.className = 'letter extra';
          extraEl.textContent = typedChar;
          currentWordEl.appendChild(extraEl);
          currentWordEl.classList.add('error-word');

          SoundEngine.playError();

          eventsLogRef.current.push({
            key: typedChar,
            timestamp: performance.now(),
            expected: '',
            isCorrect: false,
            isExtra: true,
            wordIndex: wordIdx,
            letterIndex: letterIdx
          });

          currentLetterIndexRef.current += 1;
        }
      }

      // Check test completion on final character for Words/Quote/Custom mode
      if (
        (mode === 'words' || mode === 'quote' || mode === 'custom') &&
        wordIdx === wordsList.length - 1 &&
        currentLetterIndexRef.current >= currentWordText.length
      ) {
        finishTest();
        return;
      }

      updateCaretPosition();
    }
  };

  return (
    <div
      className={`typing-container ${!isFocused ? 'blurred' : ''}`}
      ref={containerRef}
      onClick={() => {
        inputRef.current?.focus();
        setIsFocused(true);
      }}
    >
      {/* Hidden input for keyboard capture */}
      <input
        ref={inputRef}
        type="text"
        className="hidden-input"
        autoFocus
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Focus Overlay */}
      {!isFocused && (
        <div className="blur-overlay">
          <span>Click here or press any key to focus</span>
        </div>
      )}

      {/* Live Stats Header */}
      <div className="live-stats-bar">
        <div className="live-timer" ref={timerDisplayRef}>
          {mode === 'time' ? `${timeDuration}` : mode === 'zen' ? 'Zen Mode' : `${wordCount} words left`}
        </div>

        <div className="live-wpm-pill" ref={liveWpmDisplayRef} style={{ display: 'none' }}>
          <span>wpm:</span>
          <span className="val" ref={liveWpmValRef}>0</span>
        </div>
      </div>

      {/* Visual Words Container */}
      <div className="words-container" style={{ fontFamily: settings.fontFamily }}>
        <div className="words-wrapper" ref={wordsWrapperRef}>
          <div
            ref={caretRef}
            className={`caret style-${settings.caretStyle}`}
          />
          <div ref={wordsListRef} style={{ display: 'contents' }} />
        </div>
      </div>

      {/* Bottom Restart Bar */}
      <div className="restart-bar">
        <button className="restart-btn" onClick={initTest} title="Restart test (Tab)">
          <RotateCcw size={18} />
        </button>
        <div className="quick-hint">
          <span className="kbd-badge">Tab</span>
          <span>restart test</span>
        </div>
      </div>
    </div>
  );
};
