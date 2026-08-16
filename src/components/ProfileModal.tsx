import React, { useState, useEffect } from 'react';
import {
  User,
  X,
  Crown,
  History,
  Award,
  Zap,
  Clock,
  Target
} from 'lucide-react';
import { TestResult, UserSession } from '../types';
import { StorageDAL } from '../utils/storage';

interface ProfileModalProps {
  currentSession: UserSession | null;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentSession,
  onClose
}) => {
  const [history, setHistory] = useState<TestResult[]>([]);
  const [pbs, setPbs] = useState<Record<string, TestResult>>({});

  useEffect(() => {
    setHistory(StorageDAL.getHistory());
    setPbs(StorageDAL.getPersonalBests());
  }, []);

  const totalTests = history.length;
  const totalSeconds = history.reduce((acc, h) => acc + h.duration, 0);
  const avgWpm = totalTests > 0 ? Math.round(history.reduce((acc, h) => acc + h.wpm, 0) / totalTests) : 0;
  const avgAcc = totalTests > 0 ? Math.round(history.reduce((acc, h) => acc + h.accuracy, 0) / totalTests) : 0;
  const maxWpm = totalTests > 0 ? Math.max(...history.map(h => h.wpm)) : 0;

  const formatTotalTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${sec % 60}s`;
    return `${sec}s`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <User size={22} color="var(--color-accent)" />
            <span>Typist Profile & History</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* User Overview Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-surface-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'var(--color-bg)',
                  border: '2px solid var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-accent)'
                }}
              >
                <Crown size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-main)' }}>
                  {currentSession?.username || 'Guest Typist'}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-sub)' }}>
                  {currentSession?.active ? 'Active Tracked Session' : 'Unranked Guest Session'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-sub)', textTransform: 'uppercase' }}>
                  Best WPM
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                  {Math.round(maxWpm)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-sub)', textTransform: 'uppercase' }}>
                  Avg WPM
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-main)' }}>
                  {avgWpm}
                </div>
              </div>
            </div>
          </div>

          {/* Aggregate Stats Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.75rem'
            }}
          >
            <div className="stat-item" style={{ background: 'var(--color-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <span className="stat-item-label">tests completed</span>
              <span className="stat-item-value">{totalTests}</span>
            </div>
            <div className="stat-item" style={{ background: 'var(--color-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <span className="stat-item-label">time typing</span>
              <span className="stat-item-value">{formatTotalTime(totalSeconds)}</span>
            </div>
            <div className="stat-item" style={{ background: 'var(--color-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <span className="stat-item-label">avg accuracy</span>
              <span className="stat-item-value">{avgAcc}%</span>
            </div>
            <div className="stat-item" style={{ background: 'var(--color-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <span className="stat-item-label">session best</span>
              <span className="stat-item-value highlight">{currentSession ? Math.round(currentSession.bestWpm) : '-'} wpm</span>
            </div>
          </div>

          {/* Personal Bests Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-sub)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Personal Bests
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
              {['time_15', 'time_60', 'words_50', 'quote_medium'].map(key => {
                const pb = pbs[key];
                const label = key.replace('_', ' ');
                return (
                  <div
                    key={key}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-surface-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-sub)', textTransform: 'capitalize' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: pb ? 'var(--color-accent)' : 'var(--color-sub)' }}>
                      {pb ? `${Math.round(pb.wpm)} wpm` : '-'}
                    </div>
                    {pb && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-sub)' }}>
                        {Math.round(pb.accuracy)}% acc • {Math.round(pb.consistency)}% con
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent History Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-sub)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Test History
            </div>
            <div className="lb-table-container">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th>WPM</th>
                    <th>Raw</th>
                    <th>Accuracy</th>
                    <th>Consistency</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-sub)' }}>
                        No typing tests completed yet. Take your first test to see history!
                      </td>
                    </tr>
                  ) : (
                    history.slice(0, 10).map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>
                          {item.mode} {item.modeDetail}
                        </td>
                        <td style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                          {Math.round(item.wpm)}
                        </td>
                        <td style={{ color: 'var(--color-sub)' }}>
                          {Math.round(item.rawWpm)}
                        </td>
                        <td>
                          {Math.round(item.accuracy)}%
                        </td>
                        <td>
                          {Math.round(item.consistency)}%
                        </td>
                        <td style={{ color: 'var(--color-sub)', fontSize: '0.8rem' }}>
                          {formatDate(item.timestamp)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
