import type { GameDuration, GameSettings, HighScoreMap, HighScoreRecord } from '../types';

const SETTINGS_KEY = 'tactical_aim_settings_v1';
const HIGHSCORE_KEY = 'tactical_aim_highscores_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  duration: 30,
  targetSize: 'normal',
  crosshairColor: 'cyan',
  crosshairStyle: 'tactical',
  soundEnabled: true,
  sensitivity: 0.35,
  mouseDpi: 800,
};

export const loadGameSettings = (): GameSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveGameSettings = (settings: GameSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
};

export const loadHighScores = (): HighScoreMap => {
  try {
    const raw = localStorage.getItem(HIGHSCORE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const saveHighScore = (
  duration: GameDuration,
  score: number,
  accuracy: number,
  headshots: number
): { isNewHigh: boolean; previousRecord?: HighScoreRecord } => {
  const allScores = loadHighScores();
  const prev = allScores[duration];

  if (!prev || score > prev.score) {
    const newRecord: HighScoreRecord = {
      score,
      accuracy,
      headshots,
      date: new Date().toLocaleDateString(),
    };
    allScores[duration] = newRecord;
    try {
      localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(allScores));
    } catch (e) {
      console.error('Failed to save highscore', e);
    }
    return { isNewHigh: true, previousRecord: prev };
  }

  return { isNewHigh: false, previousRecord: prev };
};
