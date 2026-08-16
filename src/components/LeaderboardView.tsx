import React, { useState, useEffect } from 'react';
import {
  Trophy,
  X,
  Crown,
  Clock,
  Type,
  Quote as QuoteIcon,
  Sparkles
} from 'lucide-react';
import { TestMode, LeaderboardEntry, UserSession } from '../types';
import { StorageDAL } from '../utils/storage';

interface LeaderboardViewProps {
  currentSession: UserSession | null;
  onClose: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentSession,
  onClose
}) => {
  const [selectedMode, setSelectedMode] = useState<TestMode>('time');
  const [selectedDetail, setSelectedDetail] = useState<string | number>(15);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const data = StorageDAL.getLeaderboard(selectedMode, selectedDetail);
    setEntries(data);
  }, [selectedMode, selectedDetail]);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Trophy size={22} color="#ffd700" />
            <span>MozType Global Leaderboards</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Leaderboard Category Filters */}
          <div className="lb-filter-bar">
            <div className="mode-group" style={{ background: 'var(--color-surface)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)' }}>
              <button
                className={`mode-btn ${selectedMode === 'time' && selectedDetail === 15 ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMode('time');
                  setSelectedDetail(15);
                }}
              >
                <Clock size={14} />
                <span>time 15s</span>
              </button>

              <button
                className={`mode-btn ${selectedMode === 'time' && selectedDetail === 60 ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMode('time');
                  setSelectedDetail(60);
                }}
              >
                <Clock size={14} />
                <span>time 60s</span>
              </button>

              <button
                className={`mode-btn ${selectedMode === 'words' && selectedDetail === 50 ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMode('words');
                  setSelectedDetail(50);
                }}
              >
                <Type size={14} />
                <span>words 50</span>
              </button>

              <button
                className={`mode-btn ${selectedMode === 'words' && selectedDetail === 10 ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMode('words');
                  setSelectedDetail(10);
                }}
              >
                <Type size={14} />
                <span>words 10</span>
              </button>

              <button
                className={`mode-btn ${selectedMode === 'quote' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMode('quote');
                  setSelectedDetail('medium');
                }}
              >
                <QuoteIcon size={14} />
                <span>quote</span>
              </button>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="lb-table-container">
            <table className="lb-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>User</th>
                  <th>WPM</th>
                  <th>Raw</th>
                  <th>Accuracy</th>
                  <th>Consistency</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-sub)' }}>
                      No ranked entries recorded for this category yet. Be the first to claim #1!
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const isCurrentUser = currentSession?.username.toLowerCase() === entry.username.toLowerCase();
                    return (
                      <tr key={entry.id} className={isCurrentUser ? 'current-user' : ''}>
                        <td>
                          {entry.rank === 1 && <span className="rank-badge rank-1">👑</span>}
                          {entry.rank === 2 && <span className="rank-badge rank-2">2</span>}
                          {entry.rank === 3 && <span className="rank-badge rank-3">3</span>}
                          {entry.rank > 3 && (
                            <span style={{ color: 'var(--color-sub)', fontWeight: 600, paddingLeft: '8px' }}>
                              #{entry.rank}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 600 }}>{entry.username}</span>
                            {entry.badge && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: 'var(--radius-pill)',
                                  background: 'rgba(255, 215, 0, 0.15)',
                                  color: '#ffd700',
                                  fontWeight: 700
                                }}
                              >
                                {entry.badge}
                              </span>
                            )}
                            {isCurrentUser && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: 'var(--radius-pill)',
                                  background: 'rgba(6, 214, 160, 0.15)',
                                  color: '#06d6a0',
                                  fontWeight: 600
                                }}
                              >
                                you
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '1.05rem' }}>
                          {Math.round(entry.wpm)}
                        </td>
                        <td style={{ color: 'var(--color-sub)' }}>
                          {Math.round(entry.rawWpm)}
                        </td>
                        <td>
                          {Math.round(entry.accuracy)}%
                        </td>
                        <td>
                          {Math.round(entry.consistency)}%
                        </td>
                        <td style={{ color: 'var(--color-sub)', fontSize: '0.82rem' }}>
                          {formatDate(entry.timestamp)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
