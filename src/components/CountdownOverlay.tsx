import React, { useEffect, useState } from 'react';
import { soundManager } from '../services/sound';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number>(3);

  useEffect(() => {
    soundManager.playCountdownBeep(false);

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          soundManager.playCountdownBeep(true);
          setTimeout(() => {
            onComplete();
          }, 350);
          return 0;
        }
        soundManager.playCountdownBeep(false);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="countdown-overlay">
      <div className="countdown-sub">TACTICAL SYSTEM READY</div>
      <div key={count} className="countdown-number">
        {count === 0 ? 'ENGAGE!' : count}
      </div>
    </div>
  );
};
