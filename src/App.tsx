import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import type {
  GameDuration,
  GameSettings,
  GameStats,
  GameStatus,
  HighScoreMap,
  HighScoreRecord,
} from './types';
import {
  loadGameSettings,
  saveGameSettings,
  loadHighScores,
  saveHighScore,
} from './services/storage';
import { soundManager } from './services/sound';
import { MainMenu } from './components/MainMenu';
import { GameHUD } from './components/GameHUD';
import { GameCanvas } from './components/GameCanvas';
import { CountdownOverlay } from './components/CountdownOverlay';
import { PauseModal } from './components/PauseModal';
import { ResultScreen } from './components/ResultScreen';

export const App: React.FC = () => {
  // 1. 기본 설정 및 최고 기록
  const [settings, setSettings] = useState<GameSettings>(() => loadGameSettings());
  const [highScores, setHighScores] = useState<HighScoreMap>(() => loadHighScores());

  // 2. 게임 상태 관리
  const [status, setStatus] = useState<GameStatus>('MENU');
  const [timeLeft, setTimeLeft] = useState<number>(settings.duration);

  // 3. 실시간 게임 통계
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    hits: 0,
    misses: 0,
    headshots: 0,
    totalShots: 0,
    accuracy: 0,
    kpm: 0,
  });

  // 4. 결과 화면을 위한 이전 기록 및 신기록 플래그
  const [prevRecord, setPrevRecord] = useState<HighScoreRecord | undefined>();
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // 타이머 인터벌 참조
  const timerRef = useRef<number | null>(null);

  // 사운드 세팅 동기화
  useEffect(() => {
    soundManager.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  // 설정 업데이트
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveGameSettings(updated);
      return updated;
    });
  };

  // 훈련 통계 초기화
  const resetStats = useCallback(() => {
    setStats({
      score: 0,
      hits: 0,
      misses: 0,
      headshots: 0,
      totalShots: 0,
      accuracy: 0,
      kpm: 0,
    });
    setTimeLeft(settings.duration);
  }, [settings.duration]);

  // 게임 시작 (카운트다운 진입)
  const handleStartGame = () => {
    soundManager.playClickSound();
    resetStats();
    setStatus('COUNTDOWN');
  };

  // 카운트다운 종료 -> 실제 플레이 시작
  const handleCountdownComplete = () => {
    setStatus('PLAYING');
  };

  // 게임 종료 처리
  const handleFinishGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    soundManager.playGameOverSound();

    // 최고 점수 기록 저장 및 비교
    const { isNewHigh, previousRecord } = saveHighScore(
      settings.duration,
      stats.score,
      stats.accuracy,
      stats.headshots
    );

    setIsNewRecord(isNewHigh);
    setPrevRecord(previousRecord);
    setHighScores(loadHighScores());
    setStatus('RESULT');
  }, [settings.duration, stats.score, stats.accuracy, stats.headshots]);

  // 플레이 중 1초 단위 타이머
  useEffect(() => {
    if (status === 'PLAYING') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleFinishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, handleFinishGame]);

  // 명중 핸들러
  const handleHit = useCallback((isHeadshot: boolean) => {
    setStats((prev) => {
      const newHits = prev.hits + 1;
      const newHeadshots = isHeadshot ? prev.headshots + 1 : prev.headshots;
      const newTotalShots = prev.totalShots + 1;
      // 기본 100점 + 헤드샷 보너스 100점 (총 200점)
      const points = isHeadshot ? 200 : 100;
      const newScore = prev.score + points;
      const newAccuracy = (newHits / newTotalShots) * 100;

      return {
        ...prev,
        score: newScore,
        hits: newHits,
        headshots: newHeadshots,
        totalShots: newTotalShots,
        accuracy: newAccuracy,
      };
    });
  }, []);

  // 빗나감(미스) 핸들러
  const handleMiss = useCallback(() => {
    setStats((prev) => {
      const newMisses = prev.misses + 1;
      const newTotalShots = prev.totalShots + 1;
      const newAccuracy = (prev.hits / newTotalShots) * 100;

      return {
        ...prev,
        misses: newMisses,
        totalShots: newTotalShots,
        accuracy: newAccuracy,
      };
    });
  }, []);

  // ESC 일시정지 키 이벤트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (status === 'PLAYING') {
          soundManager.playClickSound();
          setStatus('PAUSED');
        } else if (status === 'PAUSED') {
          soundManager.playClickSound();
          setStatus('PLAYING');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  // 일시정지 재개
  const handleResume = () => {
    setStatus('PLAYING');
  };

  // 일시정지에서 재시작
  const handleRestart = () => {
    resetStats();
    setStatus('COUNTDOWN');
  };

  // 일시정지 / 결과 화면에서 메인 메뉴 복귀
  const handleGoMenu = () => {
    resetStats();
    setStatus('MENU');
  };

  // 결과 화면에서 다시 플레이
  const handlePlayAgain = () => {
    resetStats();
    setStatus('COUNTDOWN');
  };

  return (
    <div className="app-container">
      {/* 1. 상단 HUD (게임 진행 또는 일시정지 중일 때 상시 노출) */}
      {(status === 'PLAYING' || status === 'PAUSED' || status === 'COUNTDOWN') && (
        <GameHUD
          stats={stats}
          timeLeft={timeLeft}
          totalTime={settings.duration}
          onPause={() => setStatus('PAUSED')}
        />
      )}

      {/* 2. 게임 Canvas (PLAYING 및 PAUSED 시 활성) */}
      <GameCanvas
        settings={settings}
        isPlaying={status === 'PLAYING'}
        onHit={handleHit}
        onMiss={handleMiss}
        onPauseRequested={() => {
          soundManager.playClickSound();
          setStatus('PAUSED');
        }}
      />

      {/* 3. 카운트다운 오버레이 */}
      {status === 'COUNTDOWN' && (
        <CountdownOverlay onComplete={handleCountdownComplete} />
      )}

      {/* 4. 일시 정지 모달 */}
      {status === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onQuit={handleGoMenu}
        />
      )}

      {/* 5. 메인 메뉴 */}
      {status === 'MENU' && (
        <MainMenu
          settings={settings}
          highScores={highScores}
          onUpdateSettings={handleUpdateSettings}
          onStartGame={handleStartGame}
        />
      )}

      {/* 6. 결과 화면 */}
      {status === 'RESULT' && (
        <ResultScreen
          stats={stats}
          duration={settings.duration as GameDuration}
          previousRecord={prevRecord}
          isNewRecord={isNewRecord}
          onPlayAgain={handlePlayAgain}
          onGoMenu={handleGoMenu}
        />
      )}
    </div>
  );
};

export default App;
