import React, { useState } from 'react';
import {
  X,
  User,
  Flame,
  Award,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserSession } from '../types';
import { StorageDAL } from '../utils/storage';

interface SessionModalProps {
  currentSession: UserSession | null;
  onStartSession: (username: string) => void;
  onFinalizeSession: () => void;
  onClose: () => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  currentSession,
  onStartSession,
  onFinalizeSession,
  onClose
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = usernameInput.trim();

    if (!trimmed) {
      setErrorMsg('Please enter a username to start your session.');
      return;
    }

    if (trimmed.length < 2 || trimmed.length > 20) {
      setErrorMsg('Username must be between 2 and 20 characters.');
      return;
    }

    // Anti-reuse check: cannot take a username that has already been finalized
    if (StorageDAL.isUsernameFinalized(trimmed)) {
      setErrorMsg(`"${trimmed}" is already finalized on the leaderboard. Please choose a unique name.`);
      return;
    }

    setErrorMsg(null);
    onStartSession(trimmed);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Flame size={20} color="var(--color-accent)" />
            <span>{currentSession?.active ? 'Active Session' : 'Start New Session'}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {currentSession && currentSession.active ? (
            /* Active Session Overview */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-surface-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'var(--color-bg)',
                      border: '2px solid var(--color-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-accent)'
                    }}
                  >
                    <User size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-main)' }}>
                        {currentSession.username}
                      </span>
                      <span className="lb-status-chip pending" style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>
                        <span className="live-dot" />
                        <span>In Session</span>
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-sub)', marginTop: '2px' }}>
                      {currentSession.testsCompleted} tests completed this session
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-sub)', textTransform: 'uppercase' }}>
                    Session Best
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                    {Math.round(currentSession.bestWpm)} <span style={{ fontSize: '0.9rem' }}>wpm</span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--color-sub)', lineHeight: 1.5 }}>
                Your best score is already actively appearing on the live leaderboard marked as <strong>In Session / Pending</strong>. You can keep practicing to beat your speed.
                When you click <strong>Finalize & Lock Score</strong>, your high score will be permanently registered and your username will be locked.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    onFinalizeSession();
                    onClose();
                  }}
                >
                  <Lock size={16} />
                  <span>Finalize & Lock Score</span>
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    onClose();
                  }}
                >
                  <span>Continue Practice</span>
                </button>
              </div>
            </div>
          ) : (
            /* New Session Creation Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-sub)', lineHeight: 1.5 }}>
                Enter your handle to begin a tracked session. You can keep retrying to improve your WPM before finalizing your high score on the leaderboard.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="username-input">
                  Your Handle / Username
                </label>
                <input
                  id="username-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. SpeedDemon99"
                  value={usernameInput}
                  onChange={e => {
                    setUsernameInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  autoFocus
                  maxLength={20}
                />
                {errorMsg && (
                  <div className="input-error-msg" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <span>Start Session</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
