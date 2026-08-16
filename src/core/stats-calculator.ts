import { KeypressEvent, TickStep, TestResult, TestMode, TestModifiers } from '../types';

export class StatsCalculator {
  /**
   * Calculates WPM: (correct_chars / 5) / (duration_seconds / 60)
   */
  public static calculateWpm(correctChars: number, durationSeconds: number): number {
    if (durationSeconds <= 0) return 0;
    const minutes = durationSeconds / 60;
    const words = correctChars / 5;
    return Math.max(0, Math.round((words / minutes) * 100) / 100);
  }

  /**
   * Calculates Raw WPM: (all_chars / 5) / (duration_seconds / 60)
   */
  public static calculateRawWpm(allChars: number, durationSeconds: number): number {
    if (durationSeconds <= 0) return 0;
    const minutes = durationSeconds / 60;
    const words = allChars / 5;
    return Math.max(0, Math.round((words / minutes) * 100) / 100);
  }

  /**
   * Calculates Accuracy: (correct_keystrokes / total_keystrokes) * 100
   */
  public static calculateAccuracy(correctKeystrokes: number, totalKeystrokes: number): number {
    if (totalKeystrokes <= 0) return 100;
    const acc = (correctKeystrokes / totalKeystrokes) * 100;
    return Math.max(0, Math.min(100, Math.round(acc * 100) / 100));
  }

  /**
   * Calculates Consistency % using Coefficient of Variation and Monkeytype's Kogasa curve
   */
  public static calculateConsistency(tickHistory: TickStep[]): number {
    if (!tickHistory || tickHistory.length < 2) return 100;

    const wpms = tickHistory.map(step => step.wpm);
    const mean = wpms.reduce((acc, v) => acc + v, 0) / wpms.length;

    if (mean === 0) return 100;

    const variance =
      wpms.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / wpms.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation
    const cov = stdDev / mean;

    // Kogasa consistency mapping (Monkeytype formula curve)
    // Produces realistic consistency percentages (e.g. 70%-95% for normal typing)
    const consistency = Math.max(0, Math.min(100, (1 - Math.min(1, cov * 0.85)) * 100));
    return Math.round(consistency * 100) / 100;
  }

  /**
   * Calculates Burst History (WPM per word individually)
   */
  public static calculateBurstHistory(events: KeypressEvent[]): number[] {
    if (!events || events.length === 0) return [];

    const wordGroups = new Map<number, KeypressEvent[]>();
    for (const ev of events) {
      if (ev.isBackspace) continue;
      if (!wordGroups.has(ev.wordIndex)) {
        wordGroups.set(ev.wordIndex, []);
      }
      wordGroups.get(ev.wordIndex)!.push(ev);
    }

    const bursts: number[] = [];
    wordGroups.forEach((evList) => {
      if (evList.length < 2) return;
      const firstTime = evList[0].timestamp;
      const lastTime = evList[evList.length - 1].timestamp;
      const durationSec = (lastTime - firstTime) / 1000;
      if (durationSec > 0.05) {
        const correctChars = evList.filter(e => e.isCorrect).length;
        const wpm = this.calculateWpm(correctChars, durationSec);
        if (wpm > 0 && wpm < 350) {
          bursts.push(Math.round(wpm));
        }
      }
    });

    return bursts;
  }

  /**
   * Compiles full test results from event log and state
   */
  public static buildTestResult(params: {
    mode: TestMode;
    modeDetail: string | number;
    modifiers: TestModifiers;
    durationSeconds: number;
    events: KeypressEvent[];
    tickHistory: TickStep[];
    username: string;
    quoteMeta?: { author: string; source?: string };
    isPb?: boolean;
  }): TestResult {
    const {
      mode,
      modeDetail,
      modifiers,
      durationSeconds,
      events,
      tickHistory,
      username,
      quoteMeta,
      isPb = false
    } = params;

    let correctChars = 0;
    let incorrectChars = 0;
    let extraChars = 0;
    let totalKeystrokes = 0;

    for (const ev of events) {
      if (ev.isBackspace) continue;
      totalKeystrokes++;
      if (ev.isExtra) {
        extraChars++;
      } else if (ev.isCorrect) {
        correctChars++;
      } else {
        incorrectChars++;
      }
    }

    const wpm = this.calculateWpm(correctChars, durationSeconds);
    const rawWpm = this.calculateRawWpm(totalKeystrokes, durationSeconds);
    const accuracy = this.calculateAccuracy(correctChars, totalKeystrokes);
    const consistency = this.calculateConsistency(tickHistory);
    const burstHistory = this.calculateBurstHistory(events);

    return {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now(),
      mode,
      modeDetail,
      modifiers,
      wpm,
      rawWpm,
      accuracy,
      consistency,
      duration: Math.max(1, Math.round(durationSeconds)),
      correctChars,
      incorrectChars,
      extraChars,
      missedChars: 0,
      totalKeystrokes,
      isPb,
      username: username || 'Guest',
      history: tickHistory,
      burstHistory,
      quoteMeta
    };
  }
}
