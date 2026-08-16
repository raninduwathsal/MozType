import React, { useState, useEffect } from 'react';
import {
  Trophy,
  ArrowLeft,
  Clock,
  Type,
  Quote as QuoteIcon,
  Search,
  Flame,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import { TestMode, LeaderboardEntry, UserSession } from '../types';
import { StorageDAL } from '../utils/storage';
import { MozTypeApi } from '../utils/api';

const PAGE_SIZE = 15;

interface LeaderboardPageProps {
  currentSession: UserSession | null;
  onNavigateToTest: () => void;
  onOpenSessionModal: () => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  currentSession,
  onNavigateToTest,
  onOpenSessionModal
}) => {
  const [selectedMode, setSelectedMode] = useState<TestMode>('time');
  const [selectedDetail, setSelectedDetail] = useState<string | number>(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMode, selectedDetail, searchQuery]);

  // Load Leaderboard from MongoDB Atlas
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      // 1. Fetch from live MongoDB Atlas backend
      const liveData = await MozTypeApi.getLeaderboard(selectedMode, selectedDetail, 'english', searchQuery);
      if (isMounted && liveData !== null) {
        setEntries(liveData);
        setIsLoading(false);
        return;
      }

      // 2. Fallback to local storage if API is unreachable
      if (isMounted) {
        const localData = StorageDAL.getLeaderboard(selectedMode, selectedDetail);
        setEntries(localData);
        setIsLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [selectedMode, selectedDetail, searchQuery]);

  const filteredEntries = entries.filter(e =>
    e.username.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const topWpm = entries.length > 0 ? Math.round(entries[0].wpm) : 0;
  const totalRanked = filteredEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalRanked / PAGE_SIZE));
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fullscreen-leaderboard-page">
      {/* Top Action Header */}
      <div className="lb-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            className="btn-secondary"
            onClick={onNavigateToTest}
            title="Return to typing test"
          >
            <ArrowLeft size={18} />
            <span>Back to Typing</span>
          </button>

          <div className="brand-container" onClick={onNavigateToTest}>
            <div className="brand-icon">
              <Flame size={20} />
            </div>
            <div className="brand-title" style={{ fontSize: '1.35rem' }}>
              <span>moz</span>
              <span className="accent">type</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {currentSession && currentSession.active ? (
            <div className="session-pill" onClick={onOpenSessionModal} title="Manage session">
              <span className="session-indicator" />
              <span className="session-name">{currentSession.username}</span>
              {currentSession.bestWpm > 0 && (
                <span className="session-wpm">{Math.round(currentSession.bestWpm)} wpm</span>
              )}
            </div>
          ) : (
            <button className="header-btn highlight" onClick={onOpenSessionModal}>
              <PlusCircle size={17} />
              <span>Start Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Title & Stats Banner */}
      <div className="lb-hero-banner">
        <div className="lb-hero-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Trophy size={28} color="var(--color-accent)" />
            <h1 className="lb-hero-title">Official Leaderboards</h1>
          </div>
          <p className="lb-hero-subtitle">
            Anti-cheat verified rankings for finalized typist sessions.
          </p>
        </div>

        <div className="lb-stat-strip">
          <div className="lb-stat-card">
            <span className="lb-stat-label">Category #1 Speed</span>
            <span className="lb-stat-val highlight">{topWpm > 0 ? `${topWpm} wpm` : '-'}</span>
          </div>
          <div className="lb-stat-card">
            <span className="lb-stat-label">Ranked Typists</span>
            <span className="lb-stat-val">{isLoading ? '...' : totalRanked}</span>
          </div>
          <div className="lb-stat-card">
            <span className="lb-stat-label">Active Mode</span>
            <span className="lb-stat-val" style={{ textTransform: 'capitalize' }}>
              {selectedMode} {selectedDetail}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Category Tabs & Search Bar */}
      <div className="lb-controls-container">
        <div className="lb-tabs-group">
          {/* Primary Mode Tabs */}
          <div className="mode-group" style={{ background: 'var(--color-surface)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-surface-border)' }}>
            <button
              className={`mode-btn ${selectedMode === 'time' ? 'active' : ''}`}
              onClick={() => {
                setSelectedMode('time');
                setSelectedDetail(15);
              }}
            >
              <Clock size={15} />
              <span>time</span>
            </button>

            <button
              className={`mode-btn ${selectedMode === 'words' ? 'active' : ''}`}
              onClick={() => {
                setSelectedMode('words');
                setSelectedDetail(50);
              }}
            >
              <Type size={15} />
              <span>words</span>
            </button>

            <button
              className={`mode-btn ${selectedMode === 'quote' ? 'active' : ''}`}
              onClick={() => {
                setSelectedMode('quote');
                setSelectedDetail('medium');
              }}
            >
              <QuoteIcon size={15} />
              <span>quote</span>
            </button>
          </div>

          {/* Sub-Detail Pills */}
          <div className="mode-group" style={{ background: 'var(--color-surface)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-surface-border)' }}>
            {selectedMode === 'time' && (
              <>
                {[15, 30, 60, 120].map(d => (
                  <button
                    key={d}
                    className={`mode-btn ${selectedDetail === d ? 'active' : ''}`}
                    onClick={() => setSelectedDetail(d)}
                  >
                    {d}s
                  </button>
                ))}
              </>
            )}

            {selectedMode === 'words' && (
              <>
                {[10, 25, 50, 100].map(c => (
                  <button
                    key={c}
                    className={`mode-btn ${selectedDetail === c ? 'active' : ''}`}
                    onClick={() => setSelectedDetail(c)}
                  >
                    {c} words
                  </button>
                ))}
              </>
            )}

            {selectedMode === 'quote' && (
              <>
                {['short', 'medium', 'long', 'thicc'].map(l => (
                  <button
                    key={l}
                    className={`mode-btn ${selectedDetail === l ? 'active' : ''}`}
                    onClick={() => setSelectedDetail(l)}
                  >
                    {l}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Typist Search Input */}
        <div className="lb-search-box">
          <Search size={16} color="var(--color-sub)" />
          <input
            type="text"
            className="lb-search-input"
            placeholder="Search typist handle..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Fullscreen Rankings Table */}
      <div className="lb-table-wrapper">
        <table className="lb-table fullwidth">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Rank</th>
              <th>Typist</th>
              <th>WPM</th>
              <th>Raw WPM</th>
              <th>Accuracy</th>
              <th>Consistency</th>
              <th>Date Recorded</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Sleek Loading Skeleton Shimmer
              <>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <tr key={`skeleton_${i}`} className="lb-skeleton-row">
                    <td><div className="skeleton-pill rank" /></td>
                    <td><div className="skeleton-pill user" /></td>
                    <td><div className="skeleton-pill wpm" /></td>
                    <td><div className="skeleton-pill stat" /></td>
                    <td><div className="skeleton-pill stat" /></td>
                    <td><div className="skeleton-pill stat" /></td>
                    <td><div className="skeleton-pill date" /></td>
                  </tr>
                ))}
              </>
            ) : paginatedEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="lb-empty-cell">
                  <div className="lb-empty-state">
                    <Trophy size={42} color="var(--color-sub)" opacity={0.6} />
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-main)' }}>
                      No ranked entries for {selectedMode} {selectedDetail} yet
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-sub)', maxWidth: '400px', lineHeight: 1.5 }}>
                      Be the first to complete a test and finalize your session to claim the #1 spot on this leaderboard!
                    </p>
                    <button className="btn-primary" onClick={onNavigateToTest} style={{ marginTop: '0.5rem' }}>
                      <Sparkles size={16} />
                      <span>Start Typing Test</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedEntries.map((entry) => {
                const isCurrentUser =
                  currentSession &&
                  currentSession.username.toLowerCase() === entry.username.toLowerCase();

                return (
                  <tr
                    key={entry.id || `entry_${entry.rank}_${entry.username}`}
                    className={isCurrentUser ? 'current-user-row' : ''}
                  >
                    <td>
                      {entry.rank === 1 && (
                        <span className="rank-badge rank-1" title="1st Place Champion">
                          👑
                        </span>
                      )}
                      {entry.rank === 2 && (
                        <span className="rank-badge rank-2" title="2nd Place">
                          2
                        </span>
                      )}
                      {entry.rank === 3 && (
                        <span className="rank-badge rank-3" title="3rd Place">
                          3
                        </span>
                      )}
                      {entry.rank > 3 && (
                        <span className="rank-number">
                          #{entry.rank}
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{entry.username}</span>
                        {entry.badge && (
                          <span className="lb-badge-chip">
                            {entry.badge}
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="lb-you-chip">
                            You
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="lb-wpm-cell">
                      {Math.round(entry.wpm)}
                    </td>

                    <td style={{ color: 'var(--color-sub)', fontWeight: 600 }}>
                      {Math.round(entry.rawWpm)}
                    </td>

                    <td style={{ fontWeight: 600 }}>
                      {Math.round(entry.accuracy)}%
                    </td>

                    <td style={{ fontWeight: 600 }}>
                      {Math.round(entry.consistency)}%
                    </td>

                    <td style={{ color: 'var(--color-sub)', fontSize: '0.85rem' }}>
                      {formatDate(entry.timestamp)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {!isLoading && totalRanked > 0 && (
          <div className="lb-pagination-bar">
            <div className="lb-pagination-info">
              Showing <strong style={{ color: 'var(--color-main)' }}>{(currentPage - 1) * PAGE_SIZE + 1}</strong> to{' '}
              <strong style={{ color: 'var(--color-main)' }}>{Math.min(currentPage * PAGE_SIZE, totalRanked)}</strong> of{' '}
              <strong style={{ color: 'var(--color-accent)' }}>{totalRanked}</strong> ranked typists
            </div>

            {totalPages > 1 && (
              <div className="lb-pagination-actions">
                <button
                  className="btn-secondary pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                  <span>Prev</span>
                </button>

                <div className="lb-page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`page-num-btn ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  className="btn-secondary pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
