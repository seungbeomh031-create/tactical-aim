import React from 'react';
import type {
  GameDuration,
  GameSettings,
  HighScoreMap,
  TargetSizeMode,
  CrosshairColorKey,
  CrosshairStyle,
} from '../types';
import { soundManager } from '../services/sound';

interface MainMenuProps {
  settings: GameSettings;
  highScores: HighScoreMap;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onStartGame: () => void;
}

const CROSSHAIR_COLORS: { key: CrosshairColorKey; hex: string; name: string }[] = [
  { key: 'cyan', hex: '#00f2ff', name: 'CYAN' },
  { key: 'emerald', hex: '#00ff9d', name: 'EMERALD' },
  { key: 'crimson', hex: '#ff385c', name: 'CRIMSON' },
  { key: 'amber', hex: '#ffb703', name: 'AMBER' },
  { key: 'white', hex: '#ffffff', name: 'WHITE' },
];

export const MainMenu: React.FC<MainMenuProps> = ({
  settings,
  highScores,
  onUpdateSettings,
  onStartGame,
}) => {


  const handleDurationChange = (dur: GameDuration) => {
    soundManager.playClickSound();
    onUpdateSettings({ duration: dur });
  };

  const handleTargetSizeChange = (size: TargetSizeMode) => {
    soundManager.playClickSound();
    onUpdateSettings({ targetSize: size });
  };

  const handleColorChange = (color: CrosshairColorKey) => {
    soundManager.playClickSound();
    onUpdateSettings({ crosshairColor: color });
  };

  const handleStyleChange = (style: CrosshairStyle) => {
    soundManager.playClickSound();
    onUpdateSettings({ crosshairStyle: style });
  };

  const handleSoundToggle = () => {
    const next = !settings.soundEnabled;
    soundManager.enabled = next;
    if (next) soundManager.playClickSound();
    onUpdateSettings({ soundEnabled: next });
  };

  const activeColorHex =
    CROSSHAIR_COLORS.find((c) => c.key === settings.crosshairColor)?.hex ||
    '#00f2ff';

  return (
    <div className="menu-overlay">
      <div className="menu-card tactical-bevel-lg">
        {/* Header Section */}
        <header className="menu-header">
          <div className="brand-badge">PROTOCOL: PRECISION TRAINER</div>
          <h1 className="menu-title">
            TACTICAL <span>AIM</span>
          </h1>
          <p className="menu-subtitle">
            전술 FPS 고정밀 에임 & 반응속도 훈련 시스템. 중심부를 조준해 헤드샷
            보너스를 획득하세요.
          </p>
        </header>

        {/* Content Section: Config & HighScores */}
        <div className="menu-grid">
          {/* Left: Configuration Panel */}
          <div className="config-panel tactical-bevel">
            <div className="config-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>MISSION CONFIGURATION</span>
            </div>

            {/* Duration Selector */}
            <div className="config-item">
              <label className="config-label">
                <span>PRACTICE DURATION</span>
                <span>{settings.duration} SECONDS</span>
              </label>
              <div className="option-btn-group">
                {([30, 60, 90] as GameDuration[]).map((dur) => (
                  <button
                    key={dur}
                    className={`option-btn tactical-bevel ${
                      settings.duration === dur ? 'active' : ''
                    }`}
                    onClick={() => handleDurationChange(dur)}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            {/* Target Size Selector */}
            <div className="config-item">
              <label className="config-label">
                <span>TARGET SIZE</span>
                <span style={{ textTransform: 'uppercase' }}>
                  {settings.targetSize}
                </span>
              </label>
              <div className="option-btn-group">
                {(['small', 'normal', 'large'] as TargetSizeMode[]).map((size) => (
                  <button
                    key={size}
                    className={`option-btn tactical-bevel ${
                      settings.targetSize === size ? 'active' : ''
                    }`}
                    onClick={() => handleTargetSizeChange(size)}
                  >
                    {size === 'small' ? 'SMALL' : size === 'normal' ? 'NORMAL' : 'LARGE'}
                  </button>
                ))}
              </div>
            </div>

            {/* Crosshair Color */}
            <div className="config-item">
              <label className="config-label">
                <span>CROSSHAIR COLOR</span>
                <span style={{ color: activeColorHex }}>
                  {settings.crosshairColor.toUpperCase()}
                </span>
              </label>
              <div className="swatches-row">
                {CROSSHAIR_COLORS.map((col) => (
                  <button
                    key={col.key}
                    className={`color-swatch-btn ${
                      settings.crosshairColor === col.key ? 'active' : ''
                    }`}
                    style={{
                      backgroundColor: col.hex,
                      color: col.hex,
                    }}
                    onClick={() => handleColorChange(col.key)}
                    title={col.name}
                  />
                ))}
              </div>
            </div>

            {/* Crosshair Style */}
            <div className="config-item">
              <label className="config-label">
                <span>RETICLE STYLE</span>
                <span style={{ textTransform: 'uppercase' }}>
                  {settings.crosshairStyle}
                </span>
              </label>
              <div className="option-btn-group">
                {(['tactical', 'cross', 'dot'] as CrosshairStyle[]).map((st) => (
                  <button
                    key={st}
                    className={`option-btn tactical-bevel ${
                      settings.crosshairStyle === st ? 'active' : ''
                    }`}
                    onClick={() => handleStyleChange(st)}
                  >
                    {st.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Mouse Sensitivity */}
            <div className="config-item">
              <label className="config-label">
                <span>MOUSE SENSITIVITY (감도)</span>
                <span style={{ color: 'var(--color-cyan)', fontWeight: 'bold' }}>
                  {settings.sensitivity.toFixed(1)}x
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={settings.sensitivity}
                  onChange={(e) =>
                    onUpdateSettings({ sensitivity: parseFloat(e.target.value) })
                  }
                  style={{
                    flex: 1,
                    accentColor: 'var(--color-cyan)',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: High Scores & Rules Panel */}
          <div className="highscore-panel tactical-bevel">
            <div className="config-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>HIGH RECORDS & BRIEFING</span>
            </div>

            {/* Record Cards by duration */}
            <div className="record-cards">
              {([30, 60, 90] as GameDuration[]).map((dur) => {
                const rec = highScores[dur];
                const isCurrent = settings.duration === dur;
                return (
                  <div
                    key={dur}
                    className={`record-card tactical-bevel ${
                      isCurrent ? 'highlight' : ''
                    }`}
                  >
                    <div>
                      <div className="record-duration">
                        {dur}s MISSION {isCurrent && '★ SELECTED'}
                      </div>
                      <div className="record-meta">
                        {rec ? `${rec.accuracy.toFixed(1)}% ACC · ${rec.headshots} HS` : 'NO RECORD'}
                      </div>
                    </div>
                    <div className="record-score">
                      {rec ? rec.score.toLocaleString() : '---'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Rules */}
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <div className="config-label" style={{ marginBottom: '6px' }}>
                <span>TACTICAL FPS CONTROLS & RULES</span>
              </div>
              <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '18px' }}>
                <li><strong>마우스 시점 이동</strong>: 마우스를 움직여 가상 사격장 시점 조준 (Pointer Lock)</li>
                <li><strong>화면 중앙 조준점</strong>: 화면 정중앙 십자선으로 표적 조준 및 사격</li>
                <li>중심부 정밀 타격 (헤드샷): <strong style={{ color: 'var(--color-crimson)' }}>+200 PTS</strong></li>
                <li>일반 바디 타격: <strong style={{ color: '#fff' }}>+100 PTS</strong></li>
                <li>사격 피드백: 반동 블룸(Bloom) 및 발사 플래시</li>
                <li>ESC 키로 언제든 안전하게 포인터 잠금 해제 & 일시 정지</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="menu-footer">
          <button
            className="btn-sound-toggle tactical-bevel"
            onClick={handleSoundToggle}
            title="소리 켜기/끄기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {settings.soundEnabled ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              )}
            </svg>
            <span>{settings.soundEnabled ? 'AUDIO ON' : 'AUDIO OFF'}</span>
          </button>

          <button
            className="btn-start-deploy tactical-bevel"
            onClick={onStartGame}
          >
            <span>DEPLOY TACTICAL PRACTICE</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
