import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { LetterE, LetterL } from "./LetterEL";
import { ClayCharacter } from "./ClayCharacter";

// Floating particle
const FloatingDot: React.FC<{ cx: number; cy: number; r: number; color: string; frame: number; speed: number; amp: number }> = ({
  cx, cy, r, color, frame, speed, amp,
}) => {
  const y = cy + Math.sin(frame * speed * 0.05) * amp;
  const opacity = 0.4 + Math.sin(frame * speed * 0.07) * 0.3;
  return <circle cx={cx} cy={y} r={r} fill={color} opacity={opacity} />;
};

// Ground shadow
const GroundShadow: React.FC<{ x: number; y: number; rx: number; ry: number }> = ({ x, y, rx, ry }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="rgba(0,0,0,0.18)" />
);

export const ELScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Camera intro zoom
  const sceneScale = interpolate(frame, [0, 40], [0.7, 1], { extrapolateRight: "clamp" });
  const sceneOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Letter E is at left, Letter L to its right
  const eX = 80;
  const eY = 140;
  const lX = 340;
  const lY = 140;

  // Character positions — climbing paths along E ledges
  // Char 1: climbing up the vertical bar of E
  const c1Progress = ((frame * 0.6) % 200);
  const c1Y = eY + 200 - c1Progress;
  const c1X = eX + 25;
  const c1OnLedge = c1Progress > 180; // reached top

  // Char 2: walking along top arm of E
  const c2Progress = ((frame * 0.5 + 60) % 140);
  const c2X = eX + 10 + c2Progress;
  const c2Y = eY + 12;

  // Char 3: standing on middle arm of E, waving
  const c3X = eX + 90;
  const c3Y = eY + 87;

  // Char 4: climbing L vertical
  const c4Progress = ((frame * 0.55 + 30) % 200);
  const c4Y = lY + 200 - c4Progress;
  const c4X = lX + 25;

  // Char 5: sitting on top of L
  const c5X = lX + 22;
  const c5Y = lY + 4;
  const c5Sway = Math.sin(frame * 0.1) * 4;

  // Char 6: walking along bottom arm of L
  const c6Progress = ((frame * 0.45 + 90) % 140);
  const c6X = lX + 10 + c6Progress;
  const c6Y = lY + 162;

  // Background gradient stops animate subtly
  const bgHue = 220 + Math.sin(frame * 0.02) * 8;

  return (
    <div
      style={{
        width,
        height,
        background: `linear-gradient(160deg, hsl(${bgHue},40%,92%) 0%, hsl(${bgHue+15},50%,80%) 50%, hsl(${bgHue+30},45%,70%) 100%)`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0, opacity: sceneOpacity }}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Definitions: filters for clay sheen */}
        <defs>
          <filter id="clay-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="soft-shadow">
            <feDropShadow dx={4} dy={6} stdDeviation={6} floodColor="rgba(0,0,0,0.25)" />
          </filter>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="floor-grad" cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Floor glow */}
        <ellipse cx={width / 2} cy={height - 60} rx={420} ry={80} fill="url(#floor-grad)" />

        {/* Ambient floating particles */}
        {[
          { cx: 60, cy: 80, r: 6, color: "#8BB8F0", speed: 1.2, amp: 12 },
          { cx: 200, cy: 50, r: 4, color: "#F090AA", speed: 0.9, amp: 18 },
          { cx: 500, cy: 100, r: 5, color: "#A8D478", speed: 1.4, amp: 10 },
          { cx: 700, cy: 60, r: 7, color: "#F5C4A8", speed: 0.7, amp: 20 },
          { cx: 880, cy: 120, r: 4, color: "#8BB8F0", speed: 1.1, amp: 14 },
          { cx: 140, cy: 320, r: 5, color: "#FFD0DC", speed: 0.8, amp: 16 },
          { cx: 760, cy: 280, r: 6, color: "#C8E8A8", speed: 1.3, amp: 11 },
        ].map((p, i) => (
          <FloatingDot key={i} {...p} frame={frame} />
        ))}

        {/* Main scene group with intro scale */}
        <g transform={`translate(${width / 2 - 280}, ${height / 2 - 220}) scale(${sceneScale})`} filter="url(#soft-shadow)">

          {/* Ground shadows under letters */}
          <GroundShadow x={eX + 90} y={380} rx={95} ry={18} />
          <GroundShadow x={lX + 90} y={380} rx={95} ry={18} />

          {/* LETTER E */}
          <LetterE x={eX} y={eY} frame={frame} />

          {/* LETTER L */}
          <LetterL x={lX} y={lY} frame={frame} />

          {/* Character ground shadows */}
          <GroundShadow x={c1X + 28} y={378} rx={16} ry={5} />
          <GroundShadow x={c4X + 28} y={378} rx={16} ry={5} />

          {/* === CHARACTERS === */}

          {/* Char 1: Climbing E vertical bar */}
          <ClayCharacter
            x={c1X}
            y={c1Y}
            scale={0.55}
            frame={frame}
            phase={0}
            color="#E8926B"
          />

          {/* Char 2: Walking along E top arm */}
          <ClayCharacter
            x={c2X}
            y={c2Y}
            scale={0.5}
            frame={frame}
            phase={20}
            color="#90D468"
          />

          {/* Char 3: On E middle arm, slight wave */}
          <ClayCharacter
            x={c3X}
            y={c3Y}
            scale={0.48}
            rotation={Math.sin(frame * 0.08) * 4}
            frame={frame}
            phase={40}
            color="#E8926B"
          />

          {/* Char 4: Climbing L vertical bar */}
          <ClayCharacter
            x={c4X}
            y={c4Y}
            scale={0.55}
            frame={frame}
            phase={60}
            color="#90D468"
          />

          {/* Char 5: Sitting on top of L, feet dangling */}
          <ClayCharacter
            x={c5X + c5Sway}
            y={c5Y - 30}
            scale={0.48}
            rotation={c5Sway * 0.5}
            frame={frame}
            phase={80}
            color="#E8926B"
          />

          {/* Char 6: Walking along L bottom arm */}
          <ClayCharacter
            x={c6X}
            y={c6Y}
            scale={0.5}
            frame={frame}
            phase={100}
            color="#90D468"
          />

        </g>

        {/* Title text */}
        <text
          x={width / 2}
          y={height - 40}
          textAnchor="middle"
          fontFamily="'Georgia', serif"
          fontSize={22}
          fontWeight="bold"
          letterSpacing={6}
          fill="rgba(60,40,80,0.55)"
        >
          EL · CLAY WORLD
        </text>

        {/* Subtle vignette */}
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(30,20,50,0.25)" />
        </radialGradient>
        <rect x={0} y={0} width={width} height={height} fill="url(#vignette)" />
      </svg>
    </div>
  );
};
