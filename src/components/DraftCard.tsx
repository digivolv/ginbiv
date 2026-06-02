"use client";

import { useState } from "react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

interface Draft {
  id: string;
  draftType: string;
  body: string;
  rationale?: string | null;
  riskNotes?: string | null;
  isApproved: boolean;
  isCopied: boolean;
  isAutoPosted: boolean;
}

interface DraftCardProps {
  draft: Draft;
  onApprove?: (id: string) => void;
  onCopy?: (id: string, body: string) => void;
  onBodyChange?: (id: string, body: string) => void;
  isCrisis?: boolean;
}

const DRAFT_TYPE_LABELS: Record<string, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
  no_promo: { label: "No Promo", variant: "success" },
  short_reply: { label: "Short Reply", variant: "info" },
  soft_promo: { label: "Soft Promo", variant: "warning" },
  crisis_safe: { label: "Crisis Safe", variant: "crisis" },
};

export default function DraftCard({ draft, onApprove, onCopy, onBodyChange, isCrisis }: DraftCardProps) {
  const [body, setBody] = useState(draft.body);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const typeConfig = DRAFT_TYPE_LABELS[draft.draftType] ?? { label: draft.draftType, variant: "default" as const };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(draft.id, body);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
          {draft.isApproved && <Badge variant="success">✓ Approved</Badge>}
          {draft.isAutoPosted && <Badge variant="info">Auto-Posted</Badge>}
          {draft.draftType === "soft_promo" && (
            <span className="text-xs text-amber-600">⚠ Requires human review before posting</span>
          )}
          {isCrisis && draft.draftType !== "crisis_safe" && (
            <span className="text-xs text-red-600">⚠ Crisis context</span>
          )}
        </div>
        <div className="flex gap-2">
          {!draft.isAutoPosted && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(!editing)}>
                {editing ? "Preview" : "Edit"}
              </Button>
              {!draft.isApproved && onApprove && (
                <Button size="sm" variant="success" onClick={() => onApprove(draft.id)}>
                  Approve
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={handleCopy}>
                {copied ? "✓ Copied" : "Copy"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="p-4">
        {editing ? (
          <textarea
            className="w-full text-sm text-slate-800 leading-relaxed bg-white border border-slate-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[120px]"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              onBodyChange?.(draft.id, e.target.value);
            }}
          />
        ) : (
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{body}</p>
        )}

        {(draft.rationale || draft.riskNotes) && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
            {draft.rationale && (
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-600">Rationale:</span> {draft.rationale}
              </p>
            )}
            {draft.riskNotes && (
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-600">Risk:</span> {draft.riskNotes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
