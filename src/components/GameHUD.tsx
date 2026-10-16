import React from 'react';
import type { GameStats } from '../types';

interface GameHUDProps {
  stats: GameStats;
  timeLeft: number;
  totalTime: number;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  timeLeft,
  totalTime,
  onPause,
}) => {
  const timePercent = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  return (
    <header className="hud-container">
      {/* HUD Left: Logo & Score */}
      <div className="hud-left">
        <div className="hud-logo">
          <div className="hud-logo-icon" />
          <span>TACTICAL AIM</span>
        </div>

        <div className="hud-stat-box">
          <span className="hud-stat-label">SCORE</span>
          <span className="hud-stat-value highlight-cyan">
            {stats.score.toLocaleString()}
          </span>
        </div>
      </div>

      {/* HUD Center: Timer Countdown & Bar */}
      <div className="hud-timer-wrap">
        <span className="hud-stat-label">TIME REMAINING</span>
        <span
          className={`hud-stat-value ${
            timeLeft <= 5 ? 'highlight-crimson' : ''
          }`}
        >
          {timeLeft.toString().padStart(2, '0')}s
        </span>
        <div className="hud-timer-bar-bg">
          <div
            className="hud-timer-bar-fill"
            style={{
              width: `${timePercent}%`,
              backgroundColor: timeLeft <= 5 ? 'var(--color-crimson)' : undefined,
              boxShadow:
                timeLeft <= 5 ? '0 0 8px var(--color-crimson)' : undefined,
            }}
          />
        </div>
      </div>

      {/* HUD Right: Accuracy, Hits, Misses, Headshots & Pause */}
      <div className="hud-right">
        <div className="hud-stats-group">
          <div className="hud-stat-box">
            <span className="hud-stat-label">ACCURACY</span>
            <span className="hud-stat-value highlight-amber">
              {stats.accuracy.toFixed(1)}%
            </span>
          </div>

          <div className="hud-stat-box">
            <span className="hud-stat-label">HITS / MISS</span>
            <span className="hud-stat-value">
              {stats.hits} / <span style={{ color: 'var(--text-dim)' }}>{stats.misses}</span>
            </span>
          </div>

          <div className="hud-stat-box">
            <span className="hud-stat-label">HEADSHOTS</span>
            <span className="hud-stat-value highlight-crimson">
              {stats.headshots}
            </span>
          </div>
        </div>

        <button
          className="hud-pause-btn tactical-bevel"
          onClick={onPause}
          title="Pause game (ESC)"
        >
          <span className="key-badge">ESC</span>
          <span>PAUSE</span>
        </button>
      </div>
    </header>
  );
};
