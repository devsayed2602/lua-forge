"use client";

import { useEffect, useRef, useCallback } from "react";

/* ─── Types ────────────────────────────────────────────────────────── */

interface Streak {
  x: number;
  y: number;
  direction: "horizontal" | "vertical";
  length: number;
  maxLength: number;
  life: number;
  maxLife: number;
  opacity: number;
  width: number;
  /** -1 = shrink toward origin, +1 = grow from origin */
  side: -1 | 1;
}

interface FlickerDot {
  gridX: number;
  gridY: number;
  life: number;
  maxLife: number;
  intensity: number;
  /** Slight size pulse multiplier */
  pulsePhase: number;
}

/* ─── Easing helpers ───────────────────────────────────────────────── */

/** Smooth bell‑curve: rises then falls across 0→1 */
const bell = (t: number) => Math.sin(t * Math.PI);

/** Ease‑out cubic */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Ease‑in cubic */
const easeIn = (t: number) => t * t * t;

/* ─── Component ────────────────────────────────────────────────────── */

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const streaksRef = useRef<Streak[]>([]);
  const flickersRef = useRef<FlickerDot[]>([]);
  const lastTimeRef = useRef<number>(0);
  const streakTimerRef = useRef<number>(0);
  const flickerTimerRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  /** Responsive grid spacing — tighter on mobile, wider on desktop */
  const getGridSpacing = useCallback((width: number) => {
    if (width < 640) return 24;
    if (width < 1024) return 32;
    if (width < 1920) return 40;
    return 48; // 4K‑friendly
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width: number;
    let height: number;
    let spacing: number;
    let cols: number;
    let rows: number;
    let offsetX: number;
    let offsetY: number;
    let dpr: number;

    /* ── Resize handler ─────────────────────────────────────────── */
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      spacing = getGridSpacing(width);
      cols = Math.ceil(width / spacing) + 2;
      rows = Math.ceil(height / spacing) + 2;
      offsetX = (width - (cols - 1) * spacing) / 2;
      offsetY = (height - (rows - 1) * spacing) / 2;

      // Pre‑render static dot grid to offscreen canvas
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement("canvas");
      }
      const offscreen = offscreenCanvasRef.current;
      offscreen.width = width * dpr;
      offscreen.height = height * dpr;
      const octx = offscreen.getContext("2d");
      if (octx) {
        octx.setTransform(dpr, 0, 0, dpr, 0, 0);
        octx.fillStyle = "rgba(255, 255, 255, 0.07)";
        for (let gy = 0; gy < rows; gy++) {
          for (let gx = 0; gx < cols; gx++) {
            const x = offsetX + gx * spacing;
            const y = offsetY + gy * spacing;
            octx.beginPath();
            octx.arc(x, y, 0.7, 0, Math.PI * 2);
            octx.fill();
          }
        }
      }
    };

    resize();
    window.addEventListener("resize", resize);

    /* ── Streak spawner ─────────────────────────────────────────── */
    const spawnStreak = () => {
      const gridX = Math.floor(Math.random() * cols);
      const gridY = Math.floor(Math.random() * rows);
      const x = offsetX + gridX * spacing;
      const y = offsetY + gridY * spacing;

      const direction: "horizontal" | "vertical" =
        Math.random() > 0.5 ? "horizontal" : "vertical";

      // Streaks span 3‑8 grid cells for a sharp, purposeful line
      const cellSpan = 3 + Math.random() * 5;
      const maxLength = spacing * cellSpan;

      // Longer lifetime = slower, more ambient rhythm (1.5–3.5 seconds)
      const maxLife = 1500 + Math.random() * 2000;

      streaksRef.current.push({
        x,
        y,
        direction,
        length: 0,
        maxLength,
        life: 0,
        maxLife,
        opacity: 0,
        width: 0.8 + Math.random() * 1.2,
        side: Math.random() > 0.5 ? 1 : -1,
      });
    };

    /* ── Flicker spawner ────────────────────────────────────────── */
    const spawnFlicker = () => {
      const gridX = Math.floor(Math.random() * cols);
      const gridY = Math.floor(Math.random() * rows);
      flickersRef.current.push({
        gridX,
        gridY,
        life: 0,
        maxLife: 400 + Math.random() * 900,
        intensity: 0.4 + Math.random() * 0.6,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    };

    /* ── Main animation loop ────────────────────────────────────── */
    const animate = (timestamp: number) => {
      const dt = Math.min(timestamp - (lastTimeRef.current || timestamp), 50);
      lastTimeRef.current = timestamp;
      frameCountRef.current++;

      // ── Solid black background ──
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // ── Build flicker lookup ──
      const flickerMap = new Map<string, { alpha: number; pulse: number }>();
      for (const f of flickersRef.current) {
        const progress = f.life / f.maxLife;
        const alpha = bell(progress) * f.intensity;
        const pulse = Math.sin(f.pulsePhase + f.life * 0.008) * 0.3 + 0.7;
        const key = `${f.gridX},${f.gridY}`;
        const existing = flickerMap.get(key);
        if (!existing || alpha > existing.alpha) {
          flickerMap.set(key, { alpha, pulse });
        }
      }

      // ── Draw dot grid ──
      // Use offscreen canvas for base grid
      if (offscreenCanvasRef.current) {
        ctx.drawImage(offscreenCanvasRef.current, 0, 0, width, height);
      }

      // Draw interactive flickers on top
      for (const [key, flicker] of flickerMap.entries()) {
        const [gx, gy] = key.split(",").map(Number);
        const x = offsetX + gx * spacing;
        const y = offsetY + gy * spacing;
        const { alpha, pulse } = flicker;

        if (alpha > 0.01) {
          // Outer glow — very subtle bloom
          const glowR = 5 + alpha * 10;
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowR);
          gradient.addColorStop(
            0,
            `rgba(255, 255, 255, ${(0.15 + alpha * 0.5) * pulse})`
          );
          gradient.addColorStop(
            0.5,
            `rgba(255, 255, 255, ${alpha * 0.08 * pulse})`
          );
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = gradient;
          ctx.fillRect(x - glowR, y - glowR, glowR * 2, glowR * 2);

          // Bright core
          const coreAlpha = 0.3 + alpha * 0.7;
          const coreR = 0.8 + alpha * 0.8;
          ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`;
          ctx.beginPath();
          ctx.arc(x, y, coreR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Draw streaks ──
      for (const streak of streaksRef.current) {
        const progress = streak.life / streak.maxLife;

        // 3‑phase lifecycle: grow → hold → fade
        let opacity: number;
        let currentLength: number;

        if (progress < 0.15) {
          // Phase 1: rapid grow
          const t = easeOut(progress / 0.15);
          opacity = t * 0.85;
          currentLength = t * streak.maxLength;
        } else if (progress < 0.55) {
          // Phase 2: hold at full brightness, slight shimmer
          const shimmer =
            1 - Math.sin((progress - 0.15) * Math.PI * 6) * 0.05;
          opacity = 0.85 * shimmer;
          currentLength = streak.maxLength;
        } else {
          // Phase 3: gradual fade + slight retraction
          const t = easeIn((progress - 0.55) / 0.45);
          opacity = (1 - t) * 0.85;
          currentLength = streak.maxLength * (1 - t * 0.4);
        }

        streak.opacity = opacity;
        streak.length = currentLength;

        if (opacity < 0.003) continue;

        // Calculate start & end points
        let x1: number, y1: number, x2: number, y2: number;

        if (streak.direction === "horizontal") {
          if (streak.side === 1) {
            x1 = streak.x;
            x2 = streak.x + currentLength;
          } else {
            x1 = streak.x - currentLength;
            x2 = streak.x;
          }
          y1 = streak.y;
          y2 = streak.y;
        } else {
          if (streak.side === 1) {
            y1 = streak.y;
            y2 = streak.y + currentLength;
          } else {
            y1 = streak.y - currentLength;
            y2 = streak.y;
          }
          x1 = streak.x;
          x2 = streak.x;
        }

        // Soft glow layer (wider, dimmer)
        ctx.save();
        ctx.globalAlpha = opacity * 0.15;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = streak.width + 4;
        ctx.lineCap = "round";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();

        // Core line — sharp gradient from transparent → white → transparent
        const grad =
          streak.direction === "horizontal"
            ? ctx.createLinearGradient(x1, y1, x2, y2)
            : ctx.createLinearGradient(x1, y1, x2, y2);

        grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
        grad.addColorStop(0.1, `rgba(255, 255, 255, ${opacity * 0.6})`);
        grad.addColorStop(0.5, `rgba(255, 255, 255, ${opacity})`);
        grad.addColorStop(0.9, `rgba(255, 255, 255, ${opacity * 0.6})`);
        grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = streak.width;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Bright origin‑point node
        const nodeGlow = ctx.createRadialGradient(
          streak.x,
          streak.y,
          0,
          streak.x,
          streak.y,
          3
        );
        nodeGlow.addColorStop(
          0,
          `rgba(255, 255, 255, ${opacity * 0.9})`
        );
        nodeGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = nodeGlow;
        ctx.fillRect(streak.x - 3, streak.y - 3, 6, 6);
      }

      // ── Spawn timers (slow, ambient cadence) ──
      streakTimerRef.current += dt;
      flickerTimerRef.current += dt;

      // Streaks: every ~1.5–3.5 seconds
      if (streakTimerRef.current > 1500 + Math.random() * 2000) {
        const count = Math.random() > 0.75 ? 2 : 1;
        for (let i = 0; i < count; i++) spawnStreak();
        streakTimerRef.current = 0;
      }

      // Flickers: every ~350–800ms, 1‑2 at a time
      if (flickerTimerRef.current > 350 + Math.random() * 450) {
        const count = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) spawnFlicker();
        flickerTimerRef.current = 0;
      }

      // ── Update lifetimes ──
      for (const s of streaksRef.current) s.life += dt;
      for (const f of flickersRef.current) f.life += dt;

      // ── Cleanup dead ──
      streaksRef.current = streaksRef.current.filter(
        (s) => s.life < s.maxLife
      );
      flickersRef.current = flickersRef.current.filter(
        (f) => f.life < f.maxLife
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    // Seed initial state so the canvas isn't blank on load
    for (let i = 0; i < 4; i++) spawnStreak();
    for (let i = 0; i < 10; i++) spawnFlicker();

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [getGridSpacing]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
