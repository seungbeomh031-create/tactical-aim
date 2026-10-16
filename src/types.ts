export type GameDuration = 30 | 60 | 90;
export type TargetSizeMode = 'small' | 'normal' | 'large';
export type CrosshairColorKey = 'cyan' | 'emerald' | 'crimson' | 'amber' | 'white';
export type CrosshairStyle = 'dot' | 'cross' | 'tactical';

export type GameStatus = 'MENU' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'RESULT';

export interface GameSettings {
  duration: GameDuration;
  targetSize: TargetSizeMode;
  crosshairColor: CrosshairColorKey;
  crosshairStyle: CrosshairStyle;
  soundEnabled: boolean;
  sensitivity: number;
}

export interface GameStats {
  score: number;
  hits: number;
  misses: number;
  headshots: number;
  totalShots: number;
  accuracy: number;
  kpm: number; // Hits per minute
}

export interface Target {
  id: number;
  x: number;
  y: number;
  radius: number;
  headshotRadius: number;
  spawnTime: number;
  maxLifeTime?: number;
  scale: number; // For spawn pop animation
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

export interface HitFeedback {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  isCritical: boolean;
  createTime: number;
}

export interface HighScoreRecord {
  score: number;
  accuracy: number;
  headshots: number;
  date: string;
}

export type HighScoreMap = {
  [duration in GameDuration]?: HighScoreRecord;
};
