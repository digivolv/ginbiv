"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Badge from "./ui/Badge";
import StatusBadge from "./StatusBadge";
import ScoreBar from "./ScoreBar";
import Button from "./ui/Button";

interface Opportunity {
  id: string;
  subreddit: string;
  redditUrl?: string | null;
  title?: string | null;
  author?: string | null;
  body: string;
  painPoint?: string | null;
  emotionalState?: string | null;
  relevanceScore?: number | null;
  urgencyScore?: number | null;
  promoSuitabilityScore?: number | null;
  promoRiskScore?: number | null;
  autonomyEligible: boolean;
  safetyStatus?: string | null;
  isCrisis: boolean;
  status: string;
  discoveredAt: string | Date;
  sourceType: string;
  drafts?: { id: string; draftType: string }[];
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  onReject?: (id: string) => void;
  onMarkCopied?: (id: string) => void;
  onMarkPosted?: (id: string) => void;
  onFalsePositive?: (id: string) => void;
}

export default function OpportunityCard({
  opportunity: opp,
  onReject,
  onMarkCopied,
  onMarkPosted,
  onFalsePositive,
}: OpportunityCardProps) {
  const excerpt = opp.body.slice(0, 200) + (opp.body.length > 200 ? "…" : "");
  const age = formatDistanceToNow(new Date(opp.discoveredAt), { addSuffix: true });

  return (
    <div
      className={`card p-5 transition-shadow hover:shadow-md ${
        opp.isCrisis ? "border-red-300 bg-red-50" : ""
      }`}
    >
      {opp.isCrisis && (
        <div className="mb-3 flex items-center gap-2 text-red-700 text-xs font-semibold">
          <span>⚠</span>
          <span>CRISIS CONTENT — Do Not Promote</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="muted">r/{opp.subreddit}</Badge>
            <StatusBadge status={opp.status} />
            {opp.sourceType === "manual" && <Badge variant="info">Manual</Badge>}
            {opp.autonomyEligible && !opp.isCrisis && (
              <Badge variant="success">Auto-eligible</Badge>
            )}
          </div>
          {opp.title && (
            <p className="font-medium text-slate-800 text-sm leading-snug truncate">
              {opp.title}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-0.5">
            {opp.author ? `u/${opp.author}` : "unknown"} · {age}
          </p>
        </div>

        {opp.redditUrl && (
          <a
            href={opp.redditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline shrink-0"
          >
            Reddit ↗
          </a>
        )}
      </div>

      <p className="text-sm text-slate-600 leading-relaxed mb-4">{excerpt}</p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4">
        <ScoreBar label="Relevance" value={opp.relevanceScore ?? null} compact />
        <ScoreBar label="Urgency" value={opp.urgencyScore ?? null} compact />
        <ScoreBar label="Promo Suit." value={opp.promoSuitabilityScore ?? null} compact />
        <ScoreBar label="Promo Risk" value={opp.promoRiskScore ?? null} invert compact />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {opp.painPoint && (
            <Badge variant="muted">
              {opp.painPoint.replace(/_/g, " ")}
            </Badge>
          )}
          {opp.emotionalState && (
            <Badge variant="muted">{opp.emotionalState}</Badge>
          )}
          {opp.drafts && opp.drafts.length > 0 && (
            <span className="text-xs text-slate-400">{opp.drafts.length} draft(s)</span>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {onReject && opp.status !== "rejected" && opp.status !== "posted_manually" && (
            <Button size="sm" variant="ghost" onClick={() => onReject(opp.id)}>
              Reject
            </Button>
          )}
          {onFalsePositive && (
            <Button size="sm" variant="ghost" onClick={() => onFalsePositive(opp.id)}>
              False +
            </Button>
          )}
          <Link href={`/opportunities/${opp.id}`}>
            <Button size="sm" variant="secondary">
              View →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
