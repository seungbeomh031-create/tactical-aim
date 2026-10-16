import React from 'react';
import type { GameDuration, GameStats, HighScoreRecord } from '../types';
import { soundManager } from '../services/sound';

interface ResultScreenProps {
  stats: GameStats;
  duration: GameDuration;
  previousRecord?: HighScoreRecord;
  isNewRecord: boolean;
  onPlayAgain: () => void;
  onGoMenu: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  stats,
  duration,
  previousRecord,
  isNewRecord,
  onPlayAgain,
  onGoMenu,
}) => {
  const prevScore = previousRecord ? previousRecord.score : 0;
  const scoreDiff = stats.score - prevScore;

  const handlePlayAgain = () => {
    soundManager.playClickSound();
    onPlayAgain();
  };

  const handleGoMenu = () => {
    soundManager.playClickSound();
    onGoMenu();
  };

  // 헤드샷 비율 계산
  const headshotRatio = stats.hits > 0 ? (stats.headshots / stats.hits) * 100 : 0;

  return (
    <div className="result-overlay">
      <div className="result-card tactical-bevel-lg">
        {/* Header */}
        <header className="result-header">
          <div className="debrief-tag">MISSION DEBRIEF // {duration}s OPERATION</div>
          <h2 className="result-title">COMBAT EVALUATION</h2>
          {isNewRecord && (
            <div className="new-record-banner tactical-bevel">
              ★ NEW ALL-TIME RECORD ACHIEVED ★
            </div>
          )}
        </header>

        {/* Big Score Hero */}
        <div className="score-hero-section">
          <div className="score-main">
            <div className="score-main-label">FINAL SCORE</div>
            <div className="score-main-value">{stats.score.toLocaleString()}</div>
            {previousRecord && (
              <div
                className={`score-diff-badge ${
                  scoreDiff >= 0 ? 'up' : 'down'
                }`}
              >
                <span>PREVIOUS BEST: {prevScore.toLocaleString()}</span>
                <span>
                  ({scoreDiff >= 0 ? `+${scoreDiff.toLocaleString()}` : scoreDiff.toLocaleString()})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Core Metrics Grid */}
        <div className="result-stats-grid">
          <div className="result-stat-card tactical-bevel">
            <span className="result-stat-label">ACCURACY (명중률)</span>
            <span className="result-stat-num cyan">{stats.accuracy.toFixed(1)}%</span>
          </div>

          <div className="result-stat-card tactical-bevel">
            <span className="result-stat-label">TOTAL HITS (명중)</span>
            <span className="result-stat-num">{stats.hits}</span>
          </div>

          <div className="result-stat-card tactical-bevel">
            <span className="result-stat-label">MISSED SHOTS (빗나감)</span>
            <span className="result-stat-num crimson">{stats.misses}</span>
          </div>

          <div className="result-stat-card tactical-bevel">
            <span className="result-stat-label">HEADSHOTS (헤드샷)</span>
            <span className="result-stat-num gold">
              {stats.headshots}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                ({headshotRatio.toFixed(0)}%)
              </span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-actions">
          <button
            className="btn-result-menu tactical-bevel"
            onClick={handleGoMenu}
          >
            MAIN MENU
          </button>
          <button
            className="btn-result-play tactical-bevel"
            onClick={handlePlayAgain}
          >
            DEPLOY AGAIN (다시 플레이)
          </button>
        </div>
      </div>
    </div>
  );
};
