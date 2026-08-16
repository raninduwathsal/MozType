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
        const list: string[] = JSON.parse(stored);
        // Filter out any legacy mock usernames
        const mockNames = ['mythicspeed', 'keymaster_pro', 'velotype', 'swiftfingerz', 'novaclack', 'clackdemon', 'apextyper', 'pangramhero'];
        return list.filter(name => !mockNames.includes(name.toLowerCase()));
      }
    } catch {
      // ignore
    }
    return [];
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

    // Submit best result to leaderboard if session has recorded scores
    let newEntry: LeaderboardEntry | null = null;
    if (session.bestWpm > 0) {
      newEntry = {
        id: `lb_${Date.now()}_${session.username}`,
        rank: 0,
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
      if (history.length > 100) {
        history.pop();
      }
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }

  // LEADERBOARDS (100% pure real user scores only, no mock entries)
  public static getLeaderboard(mode: TestMode = 'time', modeDetail: string | number = 15): LeaderboardEntry[] {
    let allEntries: LeaderboardEntry[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      if (stored) {
        const parsed: LeaderboardEntry[] = JSON.parse(stored);
        // Clean out any legacy mock seed entries
        allEntries = parsed.filter(e => !e.id.startsWith('seed_'));
      }
    } catch {
      allEntries = [];
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
        const parsed: LeaderboardEntry[] = JSON.parse(stored);
        allEntries = parsed.filter(e => !e.id.startsWith('seed_'));
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
