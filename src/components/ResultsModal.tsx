import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  ArrowRight,
  Share2,
  Crown,
  Check,
  Award,
  Sparkles
} from 'lucide-react';
import { TestResult } from '../types';
import { ResultsChart } from './ResultsChart';
import { triggerConfetti } from '../utils/confetti';

interface ResultsModalProps {
  result: TestResult;
  onRestart: () => void;
  onNextTest: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  result,
  onRestart,
  onNextTest
}) => {
  const [copied, setCopied] = useState(false);
  const [animatedWpm, setAnimatedWpm] = useState(0);

  useEffect(() => {
    if (result.isPb) {
      triggerConfetti();
    }

    // Number counting animation for hero WPM
    const target = Math.round(result.wpm);
    let current = 0;
    const step = Math.max(1, Math.floor(target / 25));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setAnimatedWpm(target);
        clearInterval(timer);
      } else {
        setAnimatedWpm(current);
      }
    }, 15);

    return () => clearInterval(timer);
  }, [result]);

  const handleCopy = () => {
    const text = `MozType Test Result 🔥\nMode: ${result.mode} ${result.modeDetail}\nWPM: ${Math.round(result.wpm)} | Raw: ${Math.round(result.rawWpm)}\nAccuracy: ${Math.round(result.accuracy)}% | Consistency: ${Math.round(result.consistency)}%\nChars: ${result.correctChars}/${result.incorrectChars}/${result.extraChars}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="results-screen">
      {/* Hero Stats */}
      <div className="results-hero-grid">
        <div className="hero-wpm-box">
          <div className="hero-label">
            <span>wpm</span>
            {result.isPb && (
              <span className="pb-crown-badge">
                <Crown size={15} />
                <span>New Personal Best!</span>
              </span>
            )}
          </div>
          <div className="hero-value">{animatedWpm}</div>
        </div>

        <div className="hero-secondary-grid">
          <div className="secondary-stat-box">
            <span className="stat-label">acc</span>
            <span className="stat-value">{Math.round(result.accuracy)}%</span>
          </div>

          <div className="secondary-stat-box">
            <span className="stat-label">raw</span>
            <span className="stat-value">{Math.round(result.rawWpm)}</span>
          </div>
        </div>
      </div>

      {/* SVG Timeline Chart */}
      <ResultsChart history={result.history} duration={result.duration} />

      {/* Detailed Stats Grid */}
      <div className="detailed-stats-grid">
        <div className="stat-item">
          <span className="stat-item-label">test type</span>
          <span className="stat-item-value">
            {result.mode} {result.modeDetail}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-item-label" title="Standardized words (5 correct keystrokes = 1 word)">characters</span>
          <span className="stat-item-value char-breakdown" title="Correct / Incorrect / Extra keystrokes">
            <span className="c-correct" title="Correct characters typed">{result.correctChars}</span>
            <span className="c-slash">/</span>
            <span className="c-incorrect" title="Mistyped keystrokes">{result.incorrectChars}</span>
            <span className="c-slash">/</span>
            <span className="c-extra" title="Extra characters">{result.extraChars}</span>
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-sub)', marginTop: '2px' }}>
            correct / errors / extra
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-item-label" title="Smoothness and rhythm stability of typing velocity">consistency</span>
          <span className="stat-item-value">
            {Math.round(result.consistency)}%
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-sub)', marginTop: '2px' }}>
            pace stability
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-item-label">time</span>
          <span className="stat-item-value">
            {result.duration}s
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-sub)', marginTop: '2px' }}>
            elapsed duration
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-item-label">user</span>
          <span className="stat-item-value highlight">
            {result.username}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-sub)', marginTop: '2px' }}>
            active typist
          </span>
        </div>
      </div>

      {/* Quote Attribution if Quote Mode */}
      {result.quoteMeta && (
        <div className="quote-meta-pill" style={{ margin: '-1rem auto 1.5rem', width: 'fit-content' }}>
          <Sparkles size={15} />
          <span>Quote by</span>
          <span className="author">{result.quoteMeta.author}</span>
          {result.quoteMeta.source && <span>({result.quoteMeta.source})</span>}
        </div>
      )}

      {/* Action Buttons */}
      <div className="results-actions-bar">
        <button className="btn-primary" onClick={onRestart} title="Restart with same words (Tab + Enter)">
          <RotateCcw size={18} />
          <span>Restart Test</span>
        </button>

        <button className="btn-secondary" onClick={onNextTest} title="Start new random test">
          <ArrowRight size={18} />
          <span>Next Test</span>
        </button>

        <button className="btn-secondary" onClick={handleCopy} title="Copy result card">
          {copied ? <Check size={18} color="#06d6a0" /> : <Share2 size={18} />}
          <span>{copied ? 'Copied!' : 'Share Result'}</span>
        </button>
      </div>
    </div>
  );
};
