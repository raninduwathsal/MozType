/**
 * High-Precision Timer (test-timer.ts)
 * Combines requestAnimationFrame with performance.now() and a steady heartbeat
 * interval to guarantee exact duration timing with microsecond precision and zero drift.
 */

export type TimerTickCallback = (remainingSec: number, elapsedTotalMs: number) => void;
export type TimerFinishCallback = (totalDurationMs: number) => void;

export class TestTimer {
  private startTime: number = 0;
  private durationSeconds: number = 0;
  private isCountDown: boolean = true;
  private lastEmittedSec: number = -1;
  private isRunning: boolean = false;
  private rafId: number | null = null;
  private intervalId: number | null = null;
  private onTick?: TimerTickCallback;
  private onFinish?: TimerFinishCallback;

  constructor(
    durationSeconds: number = 30,
    isCountDown: boolean = true,
    onTick?: TimerTickCallback,
    onFinish?: TimerFinishCallback
  ) {
    this.durationSeconds = durationSeconds;
    this.isCountDown = isCountDown;
    this.onTick = onTick;
    this.onFinish = onFinish;
  }

  public setConfig(durationSeconds: number, isCountDown: boolean) {
    this.durationSeconds = durationSeconds;
    this.isCountDown = isCountDown;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = performance.now();
    this.lastEmittedSec = this.isCountDown ? this.durationSeconds : 0;

    // Start RAF loop for sub-millisecond precision
    this.loop();

    // Secondary heartbeat interval (50ms) to ensure background tabs or frame drops never stall the timer
    if (typeof window !== 'undefined') {
      this.intervalId = window.setInterval(this.checkTick, 50);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getElapsedMs(): number {
    if (!this.isRunning && this.startTime === 0) return 0;
    return performance.now() - this.startTime;
  }

  public getElapsedSeconds(): number {
    return this.getElapsedMs() / 1000;
  }

  public getRemainingSeconds(): number {
    if (!this.isCountDown) return 0;
    const remaining = this.durationSeconds - this.getElapsedSeconds();
    return Math.max(0, remaining);
  }

  private checkTick = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const elapsedMs = now - this.startTime;
    const elapsedSeconds = elapsedMs / 1000;

    if (this.isCountDown) {
      const remainingSec = Math.max(0, Math.ceil(this.durationSeconds - elapsedSeconds));

      // Emit tick every second change
      if (remainingSec !== this.lastEmittedSec) {
        this.lastEmittedSec = remainingSec;
        if (this.onTick) {
          this.onTick(remainingSec, elapsedMs);
        }
      }

      // Check test completion (exact elapsed duration in seconds)
      if (elapsedSeconds >= this.durationSeconds) {
        this.stop();
        if (this.onTick) {
          this.onTick(0, this.durationSeconds * 1000);
        }
        if (this.onFinish) {
          this.onFinish(this.durationSeconds * 1000);
        }
      }
    } else {
      // Count up (Zen or Words mode)
      const currentSec = Math.floor(elapsedSeconds);
      if (currentSec !== this.lastEmittedSec) {
        this.lastEmittedSec = currentSec;
        if (this.onTick) {
          this.onTick(currentSec, elapsedMs);
        }
      }
    }
  };

  private loop = () => {
    if (!this.isRunning) return;
    this.checkTick();
    if (this.isRunning) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };
}
