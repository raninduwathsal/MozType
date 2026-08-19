import { TestMode, LeaderboardEntry, TestResult } from '../types';

export class MozTypeApi {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {})
        },
        ...options
      });

      if (!response.ok) {
        console.warn(`[Api Warning] ${endpoint} returned status ${response.status}`);
        return null;
      }

      return (await response.json()) as T;
    } catch (err) {
      console.warn(`[Api Connection Notice] ${endpoint}: Offline or fallback mode.`, err);
      return null;
    }
  }

  /**
   * Fetches real-time leaderboard data directly from MongoDB Atlas
   */
  public static async getLeaderboard(
    mode: TestMode = 'time',
    modeDetail: string | number = 15,
    language: string = 'english',
    search: string = '',
    status: 'all' | 'finalized' | 'pending' = 'all'
  ): Promise<LeaderboardEntry[] | null> {
    const params = new URLSearchParams({
      mode,
      mode2: String(modeDetail),
      language,
      status,
      ...(search ? { search } : {})
    });

    const result = await this.request<{ success: boolean; data: LeaderboardEntry[] }>(
      `/api/leaderboard?${params.toString()}`
    );

    if (result && result.success && Array.isArray(result.data)) {
      return result.data;
    }
    return null;
  }

  /**
   * Checks if username is already finalized in MongoDB Atlas
   */
  public static async isUsernameAvailable(username: string): Promise<boolean> {
    const result = await this.request<{ success: boolean; finalized: boolean }>(
      '/api/session',
      {
        method: 'POST',
        body: JSON.stringify({ action: 'check', username })
      }
    );

    if (result) {
      return !result.finalized;
    }
    return true;
  }

  /**
   * Submits or updates an active session's provisional score to MongoDB Atlas leaderboard (isFinalized: false)
   */
  public static async submitPendingScore(params: {
    username: string;
    wpm: number;
    rawWpm?: number;
    accuracy?: number;
    consistency?: number;
    mode?: TestMode;
    modeDetail?: string | number;
    language?: string;
  }): Promise<{ success: boolean; rank?: number; isFinalized?: boolean } | null> {
    return await this.request<{ success: boolean; rank?: number; isFinalized?: boolean }>(
      '/api/session',
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'update-score',
          username: params.username,
          wpm: params.wpm,
          rawWpm: params.rawWpm,
          accuracy: params.accuracy,
          consistency: params.consistency,
          mode: params.mode || 'time',
          mode2: params.modeDetail || 15,
          language: params.language || 'english'
        })
      }
    );
  }

  /**
   * Finalizes a session in MongoDB Atlas and locks the username permanently (isFinalized: true)
   */
  public static async finalizeSession(params: {
    username: string;
    bestWpm: number;
    rawWpm?: number;
    accuracy?: number;
    consistency?: number;
    mode?: TestMode;
    modeDetail?: string | number;
    language?: string;
  }): Promise<{ success: boolean; message?: string } | null> {
    return await this.request<{ success: boolean; message?: string }>(
      '/api/session',
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'finalize',
          username: params.username,
          bestWpm: params.bestWpm,
          wpm: params.bestWpm,
          rawWpm: params.rawWpm,
          accuracy: params.accuracy,
          consistency: params.consistency,
          mode: params.mode || 'time',
          mode2: params.modeDetail || 15,
          language: params.language || 'english'
        })
      }
    );
  }

  /**
   * Submits completed test result directly to MongoDB Atlas `results` collection
   */
  public static async submitResult(result: TestResult): Promise<boolean> {
    const payload = {
      username: result.username,
      mode: result.mode,
      mode2: result.modeDetail,
      language: 'english',
      wpm: result.wpm,
      raw: result.rawWpm,
      acc: result.accuracy,
      consistency: result.consistency,
      duration: result.duration,
      charStats: [
        result.correctChars,
        result.incorrectChars,
        result.extraChars,
        result.missedChars
      ],
      modifiers: result.modifiers,
      isPb: result.isPb
    };

    const res = await this.request<{ success: boolean }>(
      '/api/results',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );

    return res?.success ?? false;
  }
}
