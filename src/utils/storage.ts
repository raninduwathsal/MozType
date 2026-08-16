import {
  TestResult,
  UserSession,
  LeaderboardEntry,
  UserSettings,
  TestMode
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'moztype_settings',
  SESSION: 'moztype_current_session',
  HISTORY: 'moztype_history',
  PERSONAL_BESTS: 'moztype_personal_bests',
  LEADERBOARD: 'moztype_leaderboard',
  FINALIZED_USERS: 'moztype_finalized_users'
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'serika-dark',
  caretStyle: 'smooth',
  soundType: 'mechanical',
  soundVolume: 0.4,
  fontFamily: 'JetBrains Mono',
  fontSize: 24,
  smoothCaret: true,
  quickRestart: 'tab',
  showLiveWpm: true,
  showTimerProgress: true,
  freedomMode: false,
  confidenceMode: 'off',
  capsLockWarning: true
};

// Realistic seed leaderboard records to populate initial global rankings
const SEED_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'seed_1',
    rank: 1,
    username: 'MythicSpeed',
    wpm: 178.4,
    rawWpm: 184.2,
    accuracy: 99.2,
    consistency: 91.5,
    mode: 'time',
    modeDetail: 15,
    timestamp: Date.now() - 86400000 * 3,
    isFinalized: true,
    badge: '👑 Champion'
  },
  {
    id: 'seed_2',
    rank: 2,
    username: 'KeyMaster_Pro',
    wpm: 164.8,
    rawWpm: 170.1,
    accuracy: 98.6,
    consistency: 88.4,
    mode: 'time',
    modeDetail: 15,
    timestamp: Date.now() - 86400000 * 5,
    isFinalized: true,
    badge: '⚡ Grandmaster'
  },
  {
    id: 'seed_3',
    rank: 3,
    username: 'VeloType',
    wpm: 152.0,
    rawWpm: 158.3,
    accuracy: 98.0,
    consistency: 86.2,
    mode: 'time',
    modeDetail: 15,
    timestamp: Date.now() - 86400000 * 8,
    isFinalized: true,
    badge: '🔥 Master'
  },
  {
    id: 'seed_4',
    rank: 4,
    username: 'SwiftFingerz',
    wpm: 144.6,
    rawWpm: 149.0,
    accuracy: 97.4,
    consistency: 85.0,
    mode: 'time',
    modeDetail: 15,
    timestamp: Date.now() - 86400000 * 12,
    isFinalized: true
  },
  {
    id: 'seed_5',
    rank: 5,
    username: 'NovaClack',
    wpm: 138.2,
    rawWpm: 142.5,
    accuracy: 97.1,
    consistency: 84.1,
    mode: 'time',
    modeDetail: 15,
    timestamp: Date.now() - 86400000 * 15,
    isFinalized: true
  },
  {
    id: 'seed_6',
    rank: 1,
    username: 'MythicSpeed',
    wpm: 162.5,
    rawWpm: 168.0,
    accuracy: 98.8,
    consistency: 89.2,
    mode: 'time',
    modeDetail: 60,
    timestamp: Date.now() - 86400000 * 2,
    isFinalized: true,
    badge: '👑 Champion'
  },
  {
    id: 'seed_7',
    rank: 2,
    username: 'ClackDemon',
    wpm: 149.2,
    rawWpm: 154.0,
    accuracy: 98.1,
    consistency: 87.0,
    mode: 'time',
    modeDetail: 60,
    timestamp: Date.now() - 86400000 * 7,
    isFinalized: true,
    badge: '⚡ Grandmaster'
  },
  {
    id: 'seed_8',
    rank: 1,
    username: 'ApexTyper',
    wpm: 172.0,
    rawWpm: 176.4,
    accuracy: 99.0,
    consistency: 90.1,
    mode: 'words',
    modeDetail: 50,
    timestamp: Date.now() - 86400000 * 4,
    isFinalized: true,
    badge: '👑 Champion'
  },
  {
    id: 'seed_9',
    rank: 1,
    username: 'PangramHero',
    wpm: 135.4,
    rawWpm: 140.0,
    accuracy: 98.5,
    consistency: 86.4,
    mode: 'quote',
    modeDetail: 'medium',
    timestamp: Date.now() - 86400000 * 6,
    isFinalized: true,
    badge: '📜 Scholar'
  }
];

export class StorageDAL {
  // SETTINGS
  public static getSettings(): UserSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  }

  public static saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  // SESSIONS
  public static getCurrentSession(): UserSession | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  }

  public static isUsernameFinalized(username: string): boolean {
    try {
      const finalized = this.getFinalizedUsers();
      return finalized.map(u => u.toLowerCase()).includes(username.trim().toLowerCase());
    } catch {
      return false;
    }
  }

  public static getFinalizedUsers(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FINALIZED_USERS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return ['mythicspeed', 'keymaster_pro', 'velotype', 'swiftfingerz', 'novaclack', 'clackdemon', 'apextyper', 'pangramhero'];
  }

  public static startSession(username: string): UserSession {
    const trimmed = username.trim();
    const session: UserSession = {
      active: true,
      username: trimmed,
      sessionStartedAt: Date.now(),
      bestWpm: 0,
      testsCompleted: 0,
      finalized: false
    };
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch {
      // ignore
    }
    return session;
  }

  public static updateSessionScore(result: TestResult): UserSession | null {
    const session = this.getCurrentSession();
    if (!session || !session.active || session.finalized) return null;

    session.testsCompleted += 1;
    if (result.wpm > session.bestWpm) {
      session.bestWpm = result.wpm;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch {
      // ignore
    }
    return session;
  }

  public static finalizeSession(): { finalizedSession: UserSession | null; leaderboardEntry: LeaderboardEntry | null } {
    const session = this.getCurrentSession();
    if (!session) return { finalizedSession: null, leaderboardEntry: null };

    session.finalized = true;
    session.active = false;

    // Lock username
    const finalizedList = this.getFinalizedUsers();
    if (!finalizedList.includes(session.username.toLowerCase())) {
      finalizedList.push(session.username.toLowerCase());
      try {
        localStorage.setItem(STORAGE_KEYS.FINALIZED_USERS, JSON.stringify(finalizedList));
      } catch {
        // ignore
      }
    }

    // Submit best result to leaderboard if session has scores
    let newEntry: LeaderboardEntry | null = null;
    if (session.bestWpm > 0) {
      newEntry = {
        id: `lb_${Date.now()}_${session.username}`,
        rank: 0, // rank computed on read
        username: session.username,
        wpm: session.bestWpm,
        rawWpm: Math.round(session.bestWpm * 1.05 * 10) / 10,
        accuracy: 98.2,
        consistency: 88.0,
        mode: 'time',
        modeDetail: 15,
        timestamp: Date.now(),
        isFinalized: true
      };
      this.addLeaderboardEntry(newEntry);
    }

    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {
      // ignore
    }

    return { finalizedSession: session, leaderboardEntry: newEntry };
  }

  // PERSONAL BESTS
  public static getPersonalBests(): Record<string, TestResult> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PERSONAL_BESTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return {};
  }

  public static checkAndUpdatePb(result: TestResult): boolean {
    const key = `${result.mode}_${result.modeDetail}`;
    const pbs = this.getPersonalBests();
    const existing = pbs[key];

    if (!existing || result.wpm > existing.wpm) {
      pbs[key] = result;
      try {
        localStorage.setItem(STORAGE_KEYS.PERSONAL_BESTS, JSON.stringify(pbs));
      } catch {
        // ignore
      }
      return true;
    }
    return false;
  }

  // HISTORY
  public static getHistory(): TestResult[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  }

  public static saveTestResult(result: TestResult): void {
    try {
      const history = this.getHistory();
      history.unshift(result);
      // Keep last 100 tests
      if (history.length > 100) {
        history.pop();
      }
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }

  // LEADERBOARDS
  public static getLeaderboard(mode: TestMode = 'time', modeDetail: string | number = 15): LeaderboardEntry[] {
    let allEntries: LeaderboardEntry[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      if (stored) {
        allEntries = JSON.parse(stored);
      } else {
        allEntries = SEED_LEADERBOARD;
        localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(allEntries));
      }
    } catch {
      allEntries = SEED_LEADERBOARD;
    }

    const filtered = allEntries.filter(
      e => e.mode === mode && String(e.modeDetail) === String(modeDetail)
    );

    // Sort descending by WPM, then accuracy, then timestamp
    filtered.sort((a, b) => {
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return b.timestamp - a.timestamp;
    });

    // Assign ranking 1, 2, 3...
    return filtered.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }

  public static addLeaderboardEntry(entry: LeaderboardEntry): void {
    try {
      let allEntries: LeaderboardEntry[] = [];
      const stored = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      if (stored) {
        allEntries = JSON.parse(stored);
      } else {
        allEntries = [...SEED_LEADERBOARD];
      }

      // Check if user already has an entry for this mode/detail
      const existingIdx = allEntries.findIndex(
        e => e.username.toLowerCase() === entry.username.toLowerCase() &&
             e.mode === entry.mode &&
             String(e.modeDetail) === String(entry.modeDetail)
      );

      if (existingIdx >= 0) {
        if (entry.wpm > allEntries[existingIdx].wpm) {
          allEntries[existingIdx] = entry;
        }
      } else {
        allEntries.push(entry);
      }

      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(allEntries));
    } catch {
      // ignore
    }
  }
}
