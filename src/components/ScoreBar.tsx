import clsx from "clsx";

interface ScoreBarProps {
  label: string;
  value: number | null;
  invert?: boolean; // if true, high values are bad (promoRisk)
  compact?: boolean;
}

function scoreColor(value: number, invert: boolean): string {
  const effective = invert ? 100 - value : value;
  if (effective >= 70) return "bg-emerald-400";
  if (effective >= 40) return "bg-amber-400";
  return "bg-red-400";
}

export default function ScoreBar({ label, value, invert = false, compact = false }: ScoreBarProps) {
  if (value === null || value === undefined) {
    return (
      <div className={clsx("flex items-center gap-2", compact ? "text-xs" : "text-sm")}>
        <span className="text-slate-500 w-28 shrink-0">{label}</span>
        <span className="text-slate-400 text-xs">—</span>
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center gap-2", compact ? "text-xs" : "text-sm")}>
      <span className="text-slate-600 w-28 shrink-0 text-xs">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all", scoreColor(value, invert))}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-slate-700 font-medium text-xs w-7 text-right">{value}</span>
    </div>
  );
}
