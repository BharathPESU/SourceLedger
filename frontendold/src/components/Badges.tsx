import type { FieldStatus } from "../lib/types";

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const isHigh = confidence >= 70;
  const isMid = confidence >= 40 && confidence < 70;
  
  let bg = "bg-red-500/15 text-red-400 border-red-500/30";
  if (isHigh) bg = "bg-[#D4FF00]/15 text-[#D4FF00] border-[#D4FF00]/30 shadow-[0_0_10px_rgba(212,255,0,0.15)]";
  else if (isMid) bg = "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${bg}`}>
      {confidence}%
    </span>
  );
}

export function ConfidenceBar({ confidence }: { confidence: number }) {
  const isHigh = confidence >= 70;
  const isMid = confidence >= 40 && confidence < 70;

  let color = "#EF4444";
  if (isHigh) color = "#D4FF00";
  else if (isMid) color = "#FFB800";

  return (
    <div className="w-full bg-[#181920] h-2 rounded-full overflow-hidden border border-[#262833]">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${confidence}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function StatusBadge({ status }: { status: FieldStatus }) {
  if (status === "auto_committed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_6px_#D4FF00]" />
        Auto-Committed
      </span>
    );
  }
  if (status === "human_corrected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Human Corrected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
      Needs Review
    </span>
  );
}

export function SourceBadge({ origin, trustTier }: { origin: string; trustTier: number }) {
  const tiers: Record<number, { label: string; cls: string }> = {
    1: { label: "Manufacturer (Tier 1)", cls: "bg-[#D4FF00]/15 text-[#D4FF00] border-[#D4FF00]/30" },
    2: { label: "Distributor (Tier 2)", cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
    3: { label: "Marketplace (Tier 3)", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  };
  const current = tiers[trustTier] || tiers[3];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${current.cls}`} title={origin}>
      {current.label}
    </span>
  );
}
