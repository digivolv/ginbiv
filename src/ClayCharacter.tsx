import React from "react";

interface ClayCharacterProps {
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  frame: number;
  phase?: number;
  color?: string;
}

export const ClayCharacter: React.FC<ClayCharacterProps> = ({
  x,
  y,
  scale = 1,
  rotation = 0,
  frame,
  phase = 0,
  color = "#E8926B",
}) => {
  const t = (frame + phase) / 30;
  const bounce = Math.sin(t * 2) * 4;
  const sway = Math.sin(t * 1.5) * 3;
  const armSwingL = Math.sin(t * 2) * 20;
  const armSwingR = Math.sin(t * 2 + Math.PI) * 20;
  const legSwingL = Math.sin(t * 2) * 15;
  const legSwingR = Math.sin(t * 2 + Math.PI) * 15;

  const shadow = color === "#E8926B" ? "#C0603A" : "#7B9E5A";
  const highlight = color === "#E8926B" ? "#F5C4A8" : "#C8E8A8";
  const skinTone = color === "#E8926B" ? "#F2A882" : "#A8D478";

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale}) rotate(${rotation})`}>
      {/* Body shadow */}
      <ellipse cx={sway} cy={72 + bounce * 0.3} rx={14} ry={4} fill="rgba(0,0,0,0.15)" />

      {/* Left leg */}
      <g transform={`translate(${-7 + sway * 0.3}, ${52 + bounce * 0.5}) rotate(${legSwingL})`}>
        <rect x={-5} y={0} width={10} height={18} rx={5} fill={color} />
        <rect x={-5} y={0} width={10} height={8} rx={4} fill={highlight} opacity={0.5} />
        {/* Foot */}
        <ellipse cx={0} cy={19} rx={6} ry={4} fill={shadow} />
        <ellipse cx={-1} cy={18} rx={5} ry={3} fill={color} />
      </g>

      {/* Right leg */}
      <g transform={`translate(${7 + sway * 0.3}, ${52 + bounce * 0.5}) rotate(${legSwingR})`}>
        <rect x={-5} y={0} width={10} height={18} rx={5} fill={color} />
        <rect x={-5} y={0} width={10} height={8} rx={4} fill={highlight} opacity={0.5} />
        {/* Foot */}
        <ellipse cx={0} cy={19} rx={6} ry={4} fill={shadow} />
        <ellipse cx={1} cy={18} rx={5} ry={3} fill={color} />
      </g>

      {/* Body */}
      <g transform={`translate(${sway * 0.5}, ${bounce})`}>
        {/* Torso */}
        <ellipse cx={0} cy={36} rx={16} ry={20} fill={color} />
        <ellipse cx={-3} cy={26} rx={10} ry={8} fill={highlight} opacity={0.45} />
        {/* Clay seam line */}
        <path d="M 0 18 Q 2 36 0 54" stroke={shadow} strokeWidth={1.5} fill="none" opacity={0.3} />

        {/* Left arm */}
        <g transform={`translate(-16, 28) rotate(${armSwingL - 20})`}>
          <rect x={-5} y={0} width={10} height={16} rx={5} fill={color} />
          <rect x={-4} y={0} width={8} height={7} rx={4} fill={highlight} opacity={0.4} />
          {/* Hand */}
          <ellipse cx={0} cy={17} rx={5.5} ry={5} fill={skinTone} />
          <ellipse cx={-1} cy={15} rx={3} ry={2} fill={highlight} opacity={0.5} />
        </g>

        {/* Right arm */}
        <g transform={`translate(16, 28) rotate(${armSwingR + 20})`}>
          <rect x={-5} y={0} width={10} height={16} rx={5} fill={color} />
          <rect x={-4} y={0} width={8} height={7} rx={4} fill={highlight} opacity={0.4} />
          {/* Hand */}
          <ellipse cx={0} cy={17} rx={5.5} ry={5} fill={skinTone} />
          <ellipse cx={1} cy={15} rx={3} ry={2} fill={highlight} opacity={0.5} />
        </g>

        {/* Neck */}
        <ellipse cx={0} cy={17} rx={8} ry={5} fill={color} />

        {/* Head */}
        <ellipse cx={0} cy={8} rx={15} ry={14} fill={skinTone} />
        {/* Head highlight */}
        <ellipse cx={-4} cy={2} rx={7} ry={6} fill={highlight} opacity={0.5} />
        {/* Eyes */}
        <circle cx={-5} cy={7} r={3.5} fill="white" />
        <circle cx={5} cy={7} r={3.5} fill="white" />
        <circle cx={-4.5 + Math.sin(t) * 0.5} cy={7} r={2} fill="#2A1A0E" />
        <circle cx={5.5 + Math.sin(t) * 0.5} cy={7} r={2} fill="#2A1A0E" />
        {/* Eye shine */}
        <circle cx={-3.5} cy={5.5} r={0.8} fill="white" />
        <circle cx={6.5} cy={5.5} r={0.8} fill="white" />
        {/* Smile */}
        <path d="M -5 12 Q 0 16 5 12" stroke="#7A4030" strokeWidth={1.5} fill="none" strokeLinecap="round" />
        {/* Cheeks */}
        <ellipse cx={-9} cy={11} rx={4} ry={3} fill="#F07050" opacity={0.35} />
        <ellipse cx={9} cy={11} rx={4} ry={3} fill="#F07050" opacity={0.35} />
        {/* Ears */}
        <ellipse cx={-15} cy={8} rx={4} ry={5} fill={skinTone} />
        <ellipse cx={15} cy={8} rx={4} ry={5} fill={skinTone} />
        <ellipse cx={-15} cy={8} rx={2} ry={3} fill={shadow} opacity={0.3} />
        <ellipse cx={15} cy={8} rx={2} ry={3} fill={shadow} opacity={0.3} />
      </g>
    </g>
  );
};
