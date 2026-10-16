import React, { useRef, useEffect, useCallback, useState } from 'react';
import type {
  GameSettings,
  Particle,
  HitFeedback,
  CrosshairColorKey,
  CrosshairStyle,
} from '../types';
import { soundManager } from '../services/sound';

interface TargetFPS {
  id: number;
  worldX: number;
  worldY: number;
  radius: number;
  headshotRadius: number;
  scale: number;
}

interface GameCanvasProps {
  settings: GameSettings;
  isPlaying: boolean;
  onHit: (isHeadshot: boolean) => void;
  onMiss: () => void;
  onPauseRequested: () => void;
}

const COLOR_MAP: Record<CrosshairColorKey, string> = {
  cyan: '#00f2ff',
  emerald: '#00ff9d',
  crimson: '#ff385c',
  amber: '#ffb703',
  white: '#ffffff',
};

const TARGET_RADII: Record<string, { radius: number; headshotRadius: number }> = {
  small: { radius: 24, headshotRadius: 8.5 },
  normal: { radius: 32, headshotRadius: 11.5 },
  large: { radius: 42, headshotRadius: 15 },
};

export const GameCanvas: React.FC<GameCanvasProps> = ({
  settings,
  isPlaying,
  onHit,
  onMiss,
  onPauseRequested,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pointer Lock 상태
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // 카메라 시점 (가상 1인칭 각도/오프셋)
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 드래그 대체 조작 (포인터 락 미지원 또는 거부 시)
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 사격 반동 피드백 (Recoil Bloom & Muzzle Flash)
  const recoilRef = useRef<number>(0);
  const flashAlphaRef = useRef<number>(0);

  // 표적, 파티클, 피드백 텍스트
  const targetRef = useRef<TargetFPS | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const feedbacksRef = useRef<HitFeedback[]>([]);

  // 새 타겟 스폰 (월드 좌표계)
  const spawnTarget = useCallback(() => {
    const { radius, headshotRadius } =
      TARGET_RADII[settings.targetSize] || TARGET_RADII.normal;

    // 카메라 기준 좌우 ±400px, 상하 -120px ~ +180px 영역에 무작위 스폰
    const rangeX = 420;
    const worldX = (Math.random() * 2 - 1) * rangeX;
    // Y축: 상단 HUD 회피를 위해 약간 아래쪽에 주로 배치 (-80 ~ 160)
    const worldY = (Math.random() * 240) - 80;

    targetRef.current = {
      id: Date.now() + Math.random(),
      worldX,
      worldY,
      radius,
      headshotRadius,
      scale: 0.2,
    };
  }, [settings.targetSize]);

  // 포인터 잠금 요청
  const requestLock = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    } catch {
      // Fallback to drag mode
    }
  }, []);

  // 파티클 생성
  const createExplosion = (x: number, y: number, isCritical: boolean) => {
    const count = isCritical ? 24 : 14;
    const baseColor = isCritical ? '#ffb703' : '#00f2ff';
    const subColor = '#ff385c';

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = (isCritical ? 4.0 : 2.8) + Math.random() * 3.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? baseColor : subColor,
        size: Math.random() * 3 + 2,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02,
      });
    }
  };

  // 피드백 텍스트 생성
  const createFeedback = (x: number, y: number, isCritical: boolean) => {
    feedbacksRef.current.push({
      id: Math.random(),
      x,
      y: y - 14,
      text: isCritical ? 'HEADSHOT +200' : '+100',
      color: isCritical ? '#ffb703' : '#00f2ff',
      alpha: 1,
      scale: isCritical ? 1.4 : 1.0,
      isCritical,
      createTime: performance.now(),
    });
  };

  // 좌클릭 사격 로직 (화면 중앙 기준 명중 판정)
  const handleShoot = useCallback(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;

    // 1. 발사 사운드 & 반동 블룸 & 섬광
    soundManager.playShootSound();
    recoilRef.current = 8; // 크로스헤어 8px 벌어짐
    flashAlphaRef.current = 0.25; // 총구 섬광

    const target = targetRef.current;
    if (!target) return;

    // 타겟의 현재 화면(Screen) 위치 계산
    const screenX = cx + (target.worldX - cameraRef.current.x);
    const screenY = cy + (target.worldY - cameraRef.current.y);

    // 화면 중앙 (cx, cy)과 타겟 중심 간 거리
    const dx = screenX - cx;
    const dy = screenY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= target.radius) {
      // 명중!
      const isHeadshot = dist <= target.headshotRadius;

      if (isHeadshot) {
        soundManager.playHeadshotSound();
        createExplosion(cx, cy, true);
        createFeedback(cx, cy, true);
        onHit(true);
      } else {
        soundManager.playHitSound();
        createExplosion(cx, cy, false);
        createFeedback(cx, cy, false);
        onHit(false);
      }

      // 새 타겟 스폰
      spawnTarget();
    } else {
      // 빗나감 (미스)
      soundManager.playMissSound();
      // 화면 중앙에 미스 스파크
      createExplosion(cx, cy, false);
      onMiss();
    }
  }, [isPlaying, onHit, onMiss, spawnTarget]);

  // 마우스 클릭 및 포인터 락 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // 좌클릭만 처리

    if (!isLocked) {
      requestLock();
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }

    if (isPlaying) {
      handleShoot();
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // 마우스 이동 이벤트: 시점 회전
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPlaying) return;

      const sens = settings.sensitivity || 1.0;

      let dx = 0;
      let dy = 0;

      if (document.pointerLockElement === canvasRef.current) {
        // Pointer Lock 활성 시: 상대 이동량 사용
        dx = e.movementX * sens;
        dy = e.movementY * sens;
      } else if (isDraggingRef.current) {
        // 대체 조작: 마우스 드래그 시 이동량
        dx = (e.clientX - lastMousePosRef.current.x) * sens;
        dy = (e.clientY - lastMousePosRef.current.y) * sens;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      } else {
        return;
      }

      cameraRef.current.x += dx;
      cameraRef.current.y += dy;

      // 상하 시점(Pitch) 제한: 너무 위나 아래로 가지 않도록 클램핑
      const maxPitch = 280;
      cameraRef.current.y = Math.max(-maxPitch, Math.min(maxPitch, cameraRef.current.y));

      // 좌우 시점(Yaw) 제한: 사격장 내 적절한 범위 (-600 ~ 600)
      const maxYaw = 700;
      cameraRef.current.x = Math.max(-maxYaw, Math.min(maxYaw, cameraRef.current.x));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPlaying, settings.sensitivity]);

  // 포인터 락 변경 감지 및 ESC 처리
  useEffect(() => {
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === canvasRef.current;
      setIsLocked(locked);

      // 플레이 중이었는데 포인터 잠금이 풀리면(ESC 등) 일시정지 요청
      if (!locked && isPlaying) {
        onPauseRequested();
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [isPlaying, onPauseRequested]);

  // 창 리사이즈 대응
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 게임 시작 시 초기 타겟 스폰 및 포인터 락 요청
  useEffect(() => {
    if (isPlaying) {
      spawnTarget();
      requestLock();
    } else {
      if (document.pointerLockElement === canvasRef.current) {
        document.exitPointerLock?.();
      }
    }
  }, [isPlaying, spawnTarget, requestLock]);

  // ----------------------------------------------------
  // 메인 애니메이션 렌더 루프
  // ----------------------------------------------------
  useEffect(() => {
    let animId: number;

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const cx = width / 2;
      const cy = height / 2;

      ctx.save();
      ctx.scale(dpr, dpr);

      // 캔버스 클리어
      ctx.clearRect(0, 0, width, height);

      const camX = cameraRef.current.x;
      const camY = cameraRef.current.y;

      // ------------------------------------------------
      // 1. 2D 전술 사격장 배경 렌더링 (원근 격자 & 전술 벽면)
      // ------------------------------------------------
      renderTacticalRange(ctx, width, height, camX, camY);

      // ------------------------------------------------
      // 2. 사격 섬광 (Muzzle Flash / Vignette)
      // ------------------------------------------------
      if (flashAlphaRef.current > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 120, 40, ${flashAlphaRef.current})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        flashAlphaRef.current = Math.max(0, flashAlphaRef.current - 0.05);
      }

      // ------------------------------------------------
      // 3. 표적 렌더링 (월드 좌표 -> 스크린 좌표 투영)
      // ------------------------------------------------
      const target = targetRef.current;
      if (target && isPlaying) {
        if (target.scale < 1) {
          target.scale = Math.min(1, target.scale + 0.15);
        }

        const screenX = cx + (target.worldX - camX);
        const screenY = cy + (target.worldY - camY);

        const currentRadius = target.radius * target.scale;
        const currentHsRadius = target.headshotRadius * target.scale;

        ctx.save();
        ctx.translate(screenX, screenY);

        // A. 타겟 펄스 링
        const pulse = Math.sin(time * 0.007) * 3;
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius + 6 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 56, 92, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // B. 메인 타겟 바디 (전술 레드 그라데이션)
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
        grad.addColorStop(0, '#381622');
        grad.addColorStop(0.7, '#1f131a');
        grad.addColorStop(1, '#ff385c');

        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#ff385c';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // C. 전술 십자 눈금선
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-currentRadius + 4, 0);
        ctx.lineTo(-currentHsRadius - 2, 0);
        ctx.moveTo(currentHsRadius + 2, 0);
        ctx.lineTo(currentRadius - 4, 0);
        ctx.moveTo(0, -currentRadius + 4);
        ctx.lineTo(0, -currentHsRadius - 2);
        ctx.moveTo(0, currentHsRadius + 2);
        ctx.lineTo(0, currentRadius - 4);
        ctx.stroke();

        // D. 중심부 헤드샷 코어 (Bullseye Headshot Zone)
        ctx.beginPath();
        ctx.arc(0, 0, currentHsRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff2a51';
        ctx.shadowColor = '#ff2a51';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // 중앙 화이트 핀포인트
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(2, currentHsRadius * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
      }

      // ------------------------------------------------
      // 4. 파티클 업데이트 & 렌더링
      // ------------------------------------------------
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ------------------------------------------------
      // 5. 플로팅 텍스트 피드백
      // ------------------------------------------------
      const feedbacks = feedbacksRef.current;
      for (let i = feedbacks.length - 1; i >= 0; i--) {
        const fb = feedbacks[i];
        fb.y -= 1.3;
        fb.alpha -= 0.025;

        if (fb.alpha <= 0) {
          feedbacks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, fb.alpha);
        ctx.font = `bold ${Math.round(20 * fb.scale)}px 'Chakra Petch', 'Rajdhani', sans-serif`;
        ctx.fillStyle = fb.color;
        ctx.shadowColor = fb.color;
        ctx.shadowBlur = fb.isCritical ? 16 : 8;
        ctx.textAlign = 'center';
        ctx.fillText(fb.text, fb.x, fb.y);
        ctx.restore();
      }

      // ------------------------------------------------
      // 6. 화면 중앙 고정 조준점 (Fixed Center Crosshair)
      // ------------------------------------------------
      // 반동 블룸 감쇠
      if (recoilRef.current > 0) {
        recoilRef.current = Math.max(0, recoilRef.current - 0.7);
      }

      renderCenterCrosshair(
        ctx,
        cx,
        cy,
        settings.crosshairColor,
        settings.crosshairStyle,
        recoilRef.current
      );

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, settings.crosshairColor, settings.crosshairStyle]);

  // ----------------------------------------------------
  // 전술 사격장 배경 그리기
  // ----------------------------------------------------
  const renderTacticalRange = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camX: number,
    camY: number
  ) => {
    const cx = width / 2;
    const cy = height / 2;

    // A. 원경 배경색
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#060a12');
    bgGrad.addColorStop(0.5, '#0b1322');
    bgGrad.addColorStop(1, '#05080e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    // B. 전술 벽면 패널 (시점 반대 방향 이동)
    const wallOffsetX = (-camX * 0.5) % 80;
    const wallOffsetY = (-camY * 0.5);

    ctx.strokeStyle = 'rgba(0, 242, 255, 0.06)';
    ctx.lineWidth = 1;

    // 수직 패널 라인
    for (let x = wallOffsetX - 80; x < width + 80; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 수평 패널 라인
    const horizonY = cy - camY * 0.4;
    for (let y = (wallOffsetY % 60) - 60; y < height + 60; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // C. 전술 사격장 지평선 및 거리 표시선 (25M RANGE LINE)
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(width, horizonY);
    ctx.stroke();

    // 레인지 텍스트
    ctx.font = "bold 12px 'Rajdhani', sans-serif";
    ctx.fillStyle = 'rgba(0, 242, 255, 0.4)';
    ctx.letterSpacing = '2px';
    ctx.fillText('◄ 25M FIRING LINE ►', cx - camX * 0.3, horizonY - 8);

    // D. 바닥 원근 그리드 (Perspective Floor)
    if (horizonY < height) {
      const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      floorGrad.addColorStop(0, 'rgba(0, 242, 255, 0.04)');
      floorGrad.addColorStop(1, 'rgba(0, 242, 255, 0.01)');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      ctx.strokeStyle = 'rgba(0, 242, 255, 0.08)';
      ctx.lineWidth = 1;

      // 원근 소실점 방사선
      const vanishX = cx - camX * 0.5;
      for (let i = -10; i <= 10; i++) {
        const bottomX = cx + i * 160 - camX * 0.9;
        ctx.beginPath();
        ctx.moveTo(vanishX, horizonY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }
    }

    // E. 전술 나침반 틱 (상단 뷰포트 방향 안내)
    const compassY = 88;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let deg = -60; deg <= 60; deg += 10) {
      const tickX = cx + (deg * 12) - (camX * 0.8);
      if (tickX >= 40 && tickX <= width - 40) {
        const isMajor = deg % 30 === 0;
        ctx.beginPath();
        ctx.moveTo(tickX, compassY);
        ctx.lineTo(tickX, compassY + (isMajor ? 8 : 4));
        ctx.stroke();

        if (isMajor) {
          ctx.font = "10px 'Rajdhani', sans-serif";
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.textAlign = 'center';
          ctx.fillText(`${deg}°`, tickX, compassY + 20);
        }
      }
    }

    ctx.restore();
  };

  // ----------------------------------------------------
  // 화면 중앙 고정 조준점 (Fixed Crosshair with Bloom)
  // ----------------------------------------------------
  const renderCenterCrosshair = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    colorKey: CrosshairColorKey,
    style: CrosshairStyle,
    bloom: number
  ) => {
    const color = COLOR_MAP[colorKey] || '#00f2ff';
    ctx.save();
    ctx.translate(cx, cy);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;

    if (style === 'dot') {
      ctx.beginPath();
      ctx.arc(0, 0, 3 + bloom * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (style === 'cross') {
      const gap = 4 + bloom;
      const len = 9;
      const thickness = 2;

      ctx.lineWidth = thickness;
      ctx.lineCap = 'square';
      ctx.beginPath();
      // 상
      ctx.moveTo(0, -gap);
      ctx.lineTo(0, -gap - len);
      // 하
      ctx.moveTo(0, gap);
      ctx.lineTo(0, gap + len);
      // 좌
      ctx.moveTo(-gap, 0);
      ctx.lineTo(-gap - len, 0);
      // 우
      ctx.moveTo(gap, 0);
      ctx.lineTo(gap + len, 0);
      ctx.stroke();
    } else {
      // 'tactical'
      const gap = 5 + bloom;
      const len = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -gap);
      ctx.lineTo(0, -gap - len);
      ctx.moveTo(0, gap);
      ctx.lineTo(0, gap + len);
      ctx.moveTo(-gap, 0);
      ctx.lineTo(-gap - len, 0);
      ctx.moveTo(gap, 0);
      ctx.lineTo(gap + len, 0);
      ctx.stroke();

      // 중앙 핀포인트 도트
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 은은한 외곽 가이드 링
      ctx.beginPath();
      ctx.arc(0, 0, gap + len + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  };

  return (
    <div className="game-canvas-container" onClick={requestLock}>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />

      {/* 포인터 잠금 요청 안내 오버레이 (미잠금 시 안내) */}
      {isPlaying && !isLocked && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10, 16, 26, 0.85)',
            border: '1px solid var(--color-cyan)',
            padding: '8px 20px',
            borderRadius: '4px',
            color: 'var(--color-cyan)',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-tactical)',
            letterSpacing: '0.1em',
            boxShadow: '0 0 15px var(--color-cyan-glow)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          CLICK SCREEN TO LOCK MOUSE AIM (화면을 클릭하여 시점 조준 시작)
        </div>
      )}
    </div>
  );
};
