import React, { useState } from 'react';
import { soundManager } from '../services/sound';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuit,
}) => {
  const [confirmQuit, setConfirmQuit] = useState(false);

  const handleResume = () => {
    soundManager.playClickSound();
    onResume();
  };

  const handleRestart = () => {
    soundManager.playClickSound();
    onRestart();
  };

  const handleQuitRequest = () => {
    soundManager.playClickSound();
    setConfirmQuit(true);
  };

  const handleConfirmQuit = () => {
    soundManager.playClickSound();
    onQuit();
  };

  const handleCancelQuit = () => {
    soundManager.playClickSound();
    setConfirmQuit(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window tactical-bevel">
        {!confirmQuit ? (
          <>
            <h2 className="modal-title">TACTICAL PAUSE</h2>
            <p className="modal-desc">훈련이 일시 중단되었습니다. (ESC로 재개 가능)</p>
            <div className="modal-actions">
              <button
                className="btn-modal-primary tactical-bevel"
                onClick={handleResume}
              >
                RESUME MISSION (재개)
              </button>
              <button
                className="btn-modal-secondary tactical-bevel"
                onClick={handleRestart}
              >
                RESTART (다시 시작)
              </button>
              <button
                className="btn-modal-danger tactical-bevel"
                onClick={handleQuitRequest}
              >
                ABORT TO MENU (메뉴로 나가기)
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="modal-title" style={{ color: 'var(--color-crimson)' }}>
              WARNING: ABORT MISSION?
            </h2>
            <p className="modal-desc">
              현재 훈련 기록이 저장되지 않고 소실됩니다. 정말로 메인 메뉴로
              돌아가시겠습니까?
            </p>
            <div className="modal-actions">
              <button
                className="btn-modal-danger tactical-bevel"
                onClick={handleConfirmQuit}
              >
                YES, ABORT (종료 확인)
              </button>
              <button
                className="btn-modal-secondary tactical-bevel"
                onClick={handleCancelQuit}
              >
                CANCEL (취소)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
