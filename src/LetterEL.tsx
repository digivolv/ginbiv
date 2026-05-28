import React from "react";

interface LetterProps {
  x: number;
  y: number;
  frame: number;
}

// Clay-style 3D letter "E" with platform ledges for climbing
export const LetterE: React.FC<LetterProps> = ({ x, y, frame }) => {
  const t = frame / 60;
  const sway = Math.sin(t * 0.8) * 1.5;

  // Clay palette
  const base = "#5B8FD4";
  const side = "#3A6AB0";
  const top = "#8BB8F0";
  const highlight = "#C8DEFF";
  const shadow = "#2A4A80";

  const depth = 28; // 3D depth offset

  return (
    <g transform={`translate(${x + sway}, ${y})`}>
      {/* === LETTER E 3D BODY === */}
      {/* Back face offset (shadow side) */}
      <g transform={`translate(${depth}, ${depth})`} opacity={0.35}>
        {/* Vertical bar */}
        <rect x={0} y={0} width={50} height={200} rx={6} fill={shadow} />
        {/* Top arm */}
        <rect x={0} y={0} width={140} height={50} rx={6} fill={shadow} />
        {/* Middle arm */}
        <rect x={0} y={75} width={110} height={50} rx={6} fill={shadow} />
        {/* Bottom arm */}
        <rect x={0} y={150} width={140} height={50} rx={6} fill={shadow} />
      </g>

      {/* Side faces for 3D depth */}
      {/* Vertical bar - right side */}
      <polygon points={`50,0 ${50+depth},${depth} ${50+depth},${200+depth} 50,200`} fill={side} />
      {/* Vertical bar - bottom */}
      <polygon points={`0,200 ${depth},${200+depth} ${50+depth},${200+depth} 50,200`} fill={side} />

      {/* Top arm - right */}
      <polygon points={`140,0 ${140+depth},${depth} ${140+depth},${50+depth} 140,50`} fill={side} />
      {/* Top arm - bottom */}
      <polygon points={`50,50 ${50+depth},${50+depth} ${140+depth},${50+depth} 140,50`} fill={side} />

      {/* Middle arm - right */}
      <polygon points={`110,75 ${110+depth},${75+depth} ${110+depth},${125+depth} 110,125`} fill={side} />
      {/* Middle arm - bottom */}
      <polygon points={`50,125 ${50+depth},${125+depth} ${110+depth},${125+depth} 110,125`} fill={side} />

      {/* Bottom arm - right */}
      <polygon points={`140,150 ${140+depth},${150+depth} ${140+depth},${200+depth} 140,200`} fill={side} />
      {/* Bottom arm - top face */}
      <polygon points={`50,150 ${50+depth},${150+depth} ${140+depth},${150+depth} 140,150`} fill={top} />

      {/* Top face of top arm */}
      <polygon points={`0,0 ${depth},${depth} ${140+depth},${depth} 140,0`} fill={top} />
      {/* Top face of middle arm */}
      <polygon points={`50,75 ${50+depth},${75+depth} ${110+depth},${75+depth} 110,75`} fill={top} />

      {/* === FRONT FACES === */}
      {/* Vertical bar */}
      <rect x={0} y={0} width={50} height={200} rx={6} fill={base} />
      <rect x={5} y={8} width={28} height={100} rx={4} fill={highlight} opacity={0.18} />

      {/* Top arm */}
      <rect x={0} y={0} width={140} height={50} rx={6} fill={base} />
      <rect x={8} y={7} width={90} height={18} rx={3} fill={highlight} opacity={0.22} />

      {/* Middle arm */}
      <rect x={0} y={75} width={110} height={50} rx={6} fill={base} />
      <rect x={8} y={82} width={65} height={18} rx={3} fill={highlight} opacity={0.22} />

      {/* Bottom arm */}
      <rect x={0} y={150} width={140} height={50} rx={6} fill={base} />
      <rect x={8} y={157} width={90} height={18} rx={3} fill={highlight} opacity={0.22} />

      {/* Clay texture dots */}
      {[20, 60, 100, 140, 180].map((cy, i) => (
        <circle key={i} cx={25} cy={cy} r={2} fill={highlight} opacity={0.15} />
      ))}

      {/* Rim highlights on edges */}
      <rect x={0} y={0} width={140} height={4} rx={2} fill={highlight} opacity={0.5} />
      <rect x={0} y={75} width={110} height={4} rx={2} fill={highlight} opacity={0.4} />
      <rect x={0} y={150} width={140} height={4} rx={2} fill={highlight} opacity={0.4} />
    </g>
  );
};

// Clay-style 3D letter "L"
export const LetterL: React.FC<LetterProps> = ({ x, y, frame }) => {
  const t = frame / 60;
  const sway = Math.sin(t * 0.8 + 1) * 1.5;

  const base = "#D45B7A";
  const side = "#A03558";
  const top = "#F090AA";
  const highlight = "#FFD0DC";
  const shadow = "#701838";

  const depth = 28;

  return (
    <g transform={`translate(${x + sway}, ${y})`}>
      {/* Back face offset */}
      <g transform={`translate(${depth}, ${depth})`} opacity={0.35}>
        <rect x={0} y={0} width={50} height={200} rx={6} fill={shadow} />
        <rect x={0} y={150} width={140} height={50} rx={6} fill={shadow} />
      </g>

      {/* 3D sides */}
      {/* Vertical bar right */}
      <polygon points={`50,0 ${50+depth},${depth} ${50+depth},${200+depth} 50,200`} fill={side} />
      {/* Vertical bar bottom */}
      <polygon points={`0,200 ${depth},${200+depth} ${50+depth},${200+depth} 50,200`} fill={side} />
      {/* Bottom arm right */}
      <polygon points={`140,150 ${140+depth},${150+depth} ${140+depth},${200+depth} 140,200`} fill={side} />
      {/* Bottom arm top face */}
      <polygon points={`50,150 ${50+depth},${150+depth} ${140+depth},${150+depth} 140,150`} fill={top} />
      {/* Vertical top face */}
      <polygon points={`0,0 ${depth},${depth} ${50+depth},${depth} 50,0`} fill={top} />

      {/* === FRONT FACES === */}
      {/* Vertical bar */}
      <rect x={0} y={0} width={50} height={200} rx={6} fill={base} />
      <rect x={5} y={8} width={28} height={120} rx={4} fill={highlight} opacity={0.18} />

      {/* Bottom arm */}
      <rect x={0} y={150} width={140} height={50} rx={6} fill={base} />
      <rect x={8} y={157} width={90} height={18} rx={3} fill={highlight} opacity={0.22} />

      {/* Clay texture */}
      {[20, 60, 100, 140, 180].map((cy, i) => (
        <circle key={i} cx={25} cy={cy} r={2} fill={highlight} opacity={0.15} />
      ))}

      {/* Edge highlights */}
      <rect x={0} y={0} width={50} height={4} rx={2} fill={highlight} opacity={0.5} />
      <rect x={0} y={150} width={140} height={4} rx={2} fill={highlight} opacity={0.4} />
    </g>
  );
};
