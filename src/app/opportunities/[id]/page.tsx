"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import DraftCard from "@/components/DraftCard";
import StatusBadge from "@/components/StatusBadge";
import ScoreBar from "@/components/ScoreBar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CrisisAlert from "@/components/CrisisAlert";

interface DraftReply {
  id: string;
  draftType: string;
  body: string;
  rationale?: string | null;
  riskNotes?: string | null;
  isApproved: boolean;
  isCopied: boolean;
  isAutoPosted: boolean;
  postedAt?: string | null;
}

interface AuditEvent {
  id: string;
  eventType: string;
  message: string;
  createdAt: string;
  metadata?: string | null;
}

interface Opportunity {
  id: string;
  sourceType: string;
  subreddit: string;
  redditUrl?: string | null;
  parentRedditId?: string | null;
  title?: string | null;
  author?: string | null;
  body: string;
  parentContext?: string | null;
  createdAtReddit?: string | null;
  discoveredAt: string;
  painPoint?: string | null;
  emotionalState?: string | null;
  relevanceScore?: number | null;
  urgencyScore?: number | null;
  promoSuitabilityScore?: number | null;
  promoRiskScore?: number | null;
  autonomyEligible: boolean;
  safetyStatus?: string | null;
  isCrisis: boolean;
  shouldAutopost: boolean;
  status: string;
  classificationReasoning?: string | null;
  safetyNotes?: string | null;
  notes?: string | null;
  drafts: DraftReply[];
  auditEvents: AuditEvent[];
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [generatingDrafts, setGeneratingDrafts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const res = await fetch(`/api/opportunities/${id}`);
    if (res.ok) setOpp(await res.json());
  };

  useEffect(() => {
    fetch(`/api/opportunities/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOpp(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const classify = async () => {
    setClassifying(true);
    setError(null);
    const res = await fetch(`/api/opportunities/${id}/classify`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else setOpp(data);
    setClassifying(false);
  };

  const generateDrafts = async () => {
    setGeneratingDrafts(true);
    setError(null);
    const res = await fetch(`/api/opportunities/${id}/drafts`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else await reload();
    setGeneratingDrafts(false);
  };

  const patchDraft = async (draftId: string, patch: Record<string, unknown>) => {
    await fetch(`/api/drafts/${draftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await reload();
  };

  const patchOpp = async (patch: Record<string, unknown>) => {
    const res = await fetch(`/api/opportunities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) setOpp(await res.json());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Opportunity not found.</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-3">
          ← Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          ← Back
        </Button>
        <StatusBadge status={opp.status} />
        {opp.isCrisis && (
          <Badge variant="crisis">⚠ CRISIS</Badge>
        )}
      </div>

      {opp.isCrisis && (
        <div className="mb-6">
          <CrisisAlert />
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="muted">r/{opp.subreddit}</Badge>
              <Badge variant="muted">{opp.sourceType}</Badge>
              {opp.author && <span className="text-sm text-slate-500">u/{opp.author}</span>}
            </div>
            {opp.title && (
              <h1 className="text-lg font-semibold text-slate-900 mb-1">{opp.title}</h1>
            )}
            <p className="text-xs text-slate-400">
              {opp.createdAtReddit
                ? `Posted ${formatDistanceToNow(new Date(opp.createdAtReddit), { addSuffix: true })}`
                : `Discovered ${formatDistanceToNow(new Date(opp.discoveredAt), { addSuffix: true })}`}
            </p>
          </div>
          {opp.redditUrl && (
            <a
              href={opp.redditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline shrink-0"
            >
              View on Reddit ↗
            </a>
          )}
        </div>

        {opp.parentContext && (
          <div className="mb-3 bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border-l-2 border-slate-300">
            <p className="text-xs font-medium text-slate-400 mb-1">Thread context</p>
            <p className="leading-relaxed">{opp.parentContext}</p>
          </div>
        )}

        <div className="bg-white border border-slate-100 rounded-lg p-4">
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{opp.body}</p>
        </div>
      </div>

      {/* Classification */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Classification</h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={classify}
            loading={classifying}
          >
            {opp.painPoint ? "Re-classify" : "Classify"}
          </Button>
        </div>

        {opp.painPoint ? (
          <div>
            <div className="flex gap-2 mb-4">
              <Badge variant="info">{opp.painPoint.replace(/_/g, " ")}</Badge>
              {opp.emotionalState && <Badge variant="muted">{opp.emotionalState}</Badge>}
              {opp.safetyStatus && (
                <Badge
                  variant={
                    opp.safetyStatus === "safe"
                      ? "success"
                      : opp.safetyStatus === "crisis"
                      ? "crisis"
                      : "warning"
                  }
                >
                  {opp.safetyStatus}
                </Badge>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <ScoreBar label="Relevance" value={opp.relevanceScore ?? null} />
              <ScoreBar label="Urgency" value={opp.urgencyScore ?? null} />
              <ScoreBar label="Promo Suitability" value={opp.promoSuitabilityScore ?? null} />
              <ScoreBar label="Promo Risk" value={opp.promoRiskScore ?? null} invert />
            </div>

            {opp.classificationReasoning && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                <p className="font-medium text-slate-500 text-xs mb-1">Reasoning</p>
                <p>{opp.classificationReasoning}</p>
              </div>
            )}
            {opp.safetyNotes && opp.safetyNotes !== "none" && (
              <div className="mt-2 bg-amber-50 rounded-lg p-3 text-sm text-amber-700">
                <p className="font-medium text-xs mb-1">Safety Notes</p>
                <p>{opp.safetyNotes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Not yet classified. Click "Classify" to analyze this content.
          </p>
        )}
      </div>

      {/* Drafts */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Reply Drafts</h2>
          <Button
            size="sm"
            variant={opp.drafts.length > 0 ? "secondary" : "primary"}
            onClick={generateDrafts}
            loading={generatingDrafts}
            disabled={!opp.painPoint}
            title={!opp.painPoint ? "Classify first" : undefined}
          >
            {opp.drafts.length > 0 ? "Regenerate" : "Generate Drafts"}
          </Button>
        </div>

        {opp.drafts.length === 0 ? (
          <p className="text-sm text-slate-400">
            {opp.painPoint
              ? 'No drafts yet. Click "Generate Drafts" to create Mara reply drafts.'
              : "Classify the content first, then generate drafts."}
          </p>
        ) : (
          <div className="space-y-4">
            {opp.drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                isCrisis={opp.isCrisis}
                onApprove={(draftId) => patchDraft(draftId, { isApproved: true })}
                onCopy={(draftId) => patchDraft(draftId, { isCopied: true })}
                onBodyChange={async (draftId, body) => {
                  await fetch(`/api/drafts/${draftId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ body }),
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Actions</h2>
        <div className="flex gap-2 flex-wrap">
          {opp.status !== "rejected" && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => patchOpp({ status: "rejected" })}
            >
              Reject
            </Button>
          )}
          {opp.status !== "copied" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => patchOpp({ status: "copied" })}
            >
              Mark Copied
            </Button>
          )}
          {opp.status !== "posted_manually" && (
            <Button
              variant="success"
              size="sm"
              onClick={() => patchOpp({ status: "posted_manually" })}
            >
              Mark Manually Posted
            </Button>
          )}
          {opp.status !== "false_positive" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => patchOpp({ status: "false_positive" })}
            >
              False Positive
            </Button>
          )}
        </div>
      </div>

      {/* Audit Trail */}
      {opp.auditEvents.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Audit Trail</h2>
          <div className="space-y-3">
            {opp.auditEvents.map((event) => (
              <div key={event.id} className="flex gap-3 text-sm">
                <span className="text-xs text-slate-400 w-32 shrink-0 pt-0.5">
                  {format(new Date(event.createdAt), "MMM d HH:mm")}
                </span>
                <div>
                  <span className="font-medium text-slate-600 text-xs uppercase tracking-wide">
                    {event.eventType.replace(/_/g, " ")}
                  </span>
                  <p className="text-slate-600">{event.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
