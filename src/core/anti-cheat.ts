import { TestResult, KeypressEvent } from '../types';

export class AntiCheatValidator {
  /**
   * Checks if a test result qualifies for the global/official leaderboard
   */
  public static isLeaderboardEligible(result: TestResult, events: KeypressEvent[]): { eligible: boolean; reason?: string } {
    // 1. Modifiers check
    if (result.modifiers.lazyMode) {
      return { eligible: false, reason: "Lazy mode is not allowed for ranked leaderboard" };
    }
    if (result.modifiers.blindMode) {
      return { eligible: false, reason: "Blind mode is not allowed for ranked leaderboard" };
    }
    if (result.modifiers.reverseOrder) {
      return { eligible: false, reason: "Reverse order modifier is not allowed for ranked leaderboard" };
    }

    // 2. Mode requirement (Time 15/60, or Words 10/25/50/100)
    if (result.mode === 'time') {
      const validTimes = [15, 30, 60, 120];
      if (!validTimes.includes(Number(result.modeDetail))) {
        return { eligible: false, reason: "Unranked time duration" };
      }
    } else if (result.mode === 'words') {
      const validWords = [10, 25, 50, 100];
      if (!validWords.includes(Number(result.modeDetail))) {
        return { eligible: false, reason: "Unranked word count" };
      }
    } else if (result.mode === 'quote') {
      // Quote mode is allowed
    } else {
      return { eligible: false, reason: "Custom and Zen modes are unranked" };
    }

    // 3. Minimum accuracy requirement
    if (result.accuracy < 75) {
      return { eligible: false, reason: "Accuracy below minimum 75% threshold" };
    }

    // 4. Minimum duration requirement
    if (result.duration < 3) {
      return { eligible: false, reason: "Test ended too quickly" };
    }

    // 5. Anti-bot latency analysis
    if (events && events.length > 10) {
      let totalDelta = 0;
      let zeroDeltas = 0;
      for (let i = 1; i < events.length; i++) {
        const delta = events[i].timestamp - events[i - 1].timestamp;
        if (delta <= 1) zeroDeltas++;
        totalDelta += delta;
      }
      const avgInterval = totalDelta / (events.length - 1);

      // Inhuman speed check (< 30ms per character or > 300 WPM sustained or instant batch pasting)
      if (zeroDeltas > events.length * 0.4 || avgInterval < 30 || result.wpm > 300) {
        return { eligible: false, reason: "Inhuman typing velocity detected" };
      }
    }

    return { eligible: true };
  }
}
