import React from 'react';
import {
  Clock,
  Type,
  Quote as QuoteIcon,
  Sparkles,
  Sliders,
  Hash,
  AtSign
} from 'lucide-react';
import {
  TestMode,
  TimeDuration,
  WordCount,
  QuoteLength,
  TestModifiers
} from '../types';

interface ModeSelectorProps {
  mode: TestMode;
  timeDuration: TimeDuration;
  wordCount: WordCount;
  quoteLength: QuoteLength;
  modifiers: TestModifiers;
  onSelectMode: (mode: TestMode) => void;
  onSelectTimeDuration: (duration: TimeDuration) => void;
  onSelectWordCount: (count: WordCount) => void;
  onSelectQuoteLength: (length: QuoteLength) => void;
  onTogglePunctuation: () => void;
  onToggleNumbers: () => void;
  onOpenCustomModal: () => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  timeDuration,
  wordCount,
  quoteLength,
  modifiers,
  onSelectMode,
  onSelectTimeDuration,
  onSelectWordCount,
  onSelectQuoteLength,
  onTogglePunctuation,
  onToggleNumbers,
  onOpenCustomModal,
  disabled = false
}) => {
  return (
    <div className="mode-bar-container" style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div className="mode-bar">
        {/* Modifiers (Punctuation, Numbers) */}
        <div className="mode-group">
          <button
            className={`modifier-btn ${modifiers.punctuation ? 'active' : ''}`}
            onClick={onTogglePunctuation}
            title="Toggle Punctuation"
          >
            <AtSign size={14} />
            <span>punctuation</span>
          </button>
          <button
            className={`modifier-btn ${modifiers.numbers ? 'active' : ''}`}
            onClick={onToggleNumbers}
            title="Toggle Numbers"
          >
            <Hash size={14} />
            <span>numbers</span>
          </button>
        </div>

        <div className="mode-divider" />

        {/* Primary Modes */}
        <div className="mode-group">
          <button
            className={`mode-btn ${mode === 'time' ? 'active' : ''}`}
            onClick={() => onSelectMode('time')}
          >
            <Clock size={15} />
            <span>time</span>
          </button>
          <button
            className={`mode-btn ${mode === 'words' ? 'active' : ''}`}
            onClick={() => onSelectMode('words')}
          >
            <Type size={15} />
            <span>words</span>
          </button>
          <button
            className={`mode-btn ${mode === 'quote' ? 'active' : ''}`}
            onClick={() => onSelectMode('quote')}
          >
            <QuoteIcon size={15} />
            <span>quote</span>
          </button>
          <button
            className={`mode-btn ${mode === 'zen' ? 'active' : ''}`}
            onClick={() => onSelectMode('zen')}
          >
            <Sparkles size={15} />
            <span>zen</span>
          </button>
          <button
            className={`mode-btn ${mode === 'custom' ? 'active' : ''}`}
            onClick={() => {
              onSelectMode('custom');
              onOpenCustomModal();
            }}
          >
            <Sliders size={15} />
            <span>custom</span>
          </button>
        </div>

        <div className="mode-divider" />

        {/* Mode Specific Sub-Selectors */}
        <div className="mode-group">
          {mode === 'time' && (
            <>
              {([15, 30, 60, 120] as TimeDuration[]).map(d => (
                <button
                  key={d}
                  className={`mode-btn ${timeDuration === d ? 'active' : ''}`}
                  onClick={() => onSelectTimeDuration(d)}
                >
                  {d}
                </button>
              ))}
            </>
          )}

          {mode === 'words' && (
            <>
              {([10, 25, 50, 100] as WordCount[]).map(c => (
                <button
                  key={c}
                  className={`mode-btn ${wordCount === c ? 'active' : ''}`}
                  onClick={() => onSelectWordCount(c)}
                >
                  {c}
                </button>
              ))}
            </>
          )}

          {mode === 'quote' && (
            <>
              {(['all', 'short', 'medium', 'long', 'thicc'] as QuoteLength[]).map(l => (
                <button
                  key={l}
                  className={`mode-btn ${quoteLength === l ? 'active' : ''}`}
                  onClick={() => onSelectQuoteLength(l)}
                >
                  {l}
                </button>
              ))}
            </>
          )}

          {mode === 'zen' && (
            <span style={{ color: 'var(--color-sub)', fontSize: '0.8rem', padding: '0 0.5rem' }}>
              Shift + Enter to finish
            </span>
          )}

          {mode === 'custom' && (
            <button
              className="mode-btn"
              onClick={onOpenCustomModal}
              style={{ color: 'var(--color-accent)' }}
            >
              change text
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
