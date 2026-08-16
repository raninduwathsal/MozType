export type TestMode = 'time' | 'words' | 'quote' | 'zen' | 'custom';
export type TimeDuration = 15 | 30 | 60 | 120;
export type WordCount = 10 | 25 | 50 | 100;
export type QuoteLength = 'short' | 'medium' | 'long' | 'thicc' | 'all';

export type CaretStyle = 'smooth' | 'line' | 'block' | 'underline' | 'outline' | 'laser' | 'off';
export type SoundType = 'off' | 'mechanical' | 'thock' | 'typewriter' | 'beep' | 'pop';
export type FontFamily = 'JetBrains Mono' | 'Fira Code' | 'Roboto Mono' | 'Space Mono' | 'Inter';

export interface TestModifiers {
  punctuation: boolean;
  numbers: boolean;
  blindMode: boolean;
  lazyMode: boolean;
  reverseOrder: boolean;
}

export interface Quote {
  id: number;
  text: string;
  author: string;
  source?: string;
  length: 'short' | 'medium' | 'long' | 'thicc';
}

export interface KeypressEvent {
  key: string;
  timestamp: number;
  expected: string;
  isCorrect: boolean;
  isExtra?: boolean;
  isBackspace?: boolean;
  wordIndex: number;
  letterIndex: number;
}

export interface TickStep {
  second: number;
  timestamp: number;
  wpm: number;
  rawWpm: number;
  errors: number;
  cumulativeErrors?: number;
  correctChars: number;
  allChars: number;
}

export interface TestResult {
  id: string;
  timestamp: number;
  mode: TestMode;
  modeDetail: string | number;
  modifiers: TestModifiers;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  duration: number; // in seconds
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  totalKeystrokes: number;
  isPb: boolean;
  username: string;
  history: TickStep[];
  burstHistory: number[];
  quoteMeta?: {
    author: string;
    source?: string;
  };
}

export interface UserSession {
  active: boolean;
  username: string;
  sessionStartedAt: number;
  bestWpm: number;
  testsCompleted: number;
  finalized: boolean;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  mode: TestMode;
  modeDetail: string | number;
  timestamp: number;
  isCurrentSession?: boolean;
  isFinalized?: boolean;
  badge?: string;
}

export interface UserSettings {
  theme: string;
  caretStyle: CaretStyle;
  soundType: SoundType;
  soundVolume: number;
  fontFamily: FontFamily;
  fontSize: number;
  smoothCaret: boolean;
  quickRestart: 'tab' | 'enter' | 'esc' | 'off';
  showLiveWpm: boolean;
  showTimerProgress: boolean;
  freedomMode: boolean; // allow backspacing anytime
  confidenceMode: 'off' | 'on' | 'max';
  capsLockWarning: boolean;
}
