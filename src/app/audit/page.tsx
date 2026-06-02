"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface AuditEvent {
  id: string;
  eventType: string;
  message: string;
  createdAt: string;
  metadata?: string | null;
  opportunityId?: string | null;
  opportunity?: {
    subreddit: string;
    title?: string | null;
    author?: string | null;
    redditUrl?: string | null;
  } | null;
}

const EVENT_TYPE_STYLES: Record<string, React.ComponentProps<typeof Badge>["variant"]> = {
  discovered: "info",
  classified: "info",
  draft_generated: "info",
  auto_posted: "success",
  queued_for_review: "warning",
  approved: "success",
  rejected: "muted",
  copied: "success",
  posted_manually: "success",
  safety_check_failed: "danger",
  safety_check_passed: "success",
  crisis_flagged: "crisis",
  scan_started: "muted",
  scan_completed: "info",
  error: "danger",
  false_positive: "muted",
  author_blocked: "warning",
};

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");

  const load = async (reset = false) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (typeFilter) params.set("eventType", typeFilter);
    if (!reset && cursor) params.set("cursor", cursor);

    const res = await fetch(`/api/audit?${params}`);
    const data = await res.json();

    if (reset) setEvents(data.items ?? []);
    else setEvents((prev) => [...prev, ...(data.items ?? [])]);
    setCursor(data.nextCursor ?? null);
    setHasMore(data.hasMore ?? false);
    setLoading(false);
  };

  useEffect(() => {
    setCursor(null);
    load(true);
  }, [typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Audit Log</h1>
      <p className="text-sm text-slate-500 mb-6">
        Every agent decision, safety check, and status change is logged here.
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "auto_posted", "safety_check_failed", "crisis_flagged", "error", "scan_completed"].map(
          (t) => (
            <button
              key={t || "all"}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t || "All Events"}
            </button>
          )
        )}
      </div>

      {loading && events.length === 0 ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          No audit events yet. Run a scan or analyze a post to start seeing activity here.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <div key={event.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <span className="text-xs text-slate-400 w-32 shrink-0 pt-0.5">
                    {format(new Date(event.createdAt), "MMM d HH:mm:ss")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={EVENT_TYPE_STYLES[event.eventType] ?? "default"}>
                        {event.eventType.replace(/_/g, " ")}
                      </Badge>
                      {event.opportunity && (
                        <span className="text-xs text-slate-500">
                          r/{event.opportunity.subreddit}
                          {event.opportunity.author ? ` · u/${event.opportunity.author}` : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700">{event.message}</p>
                    {event.opportunityId && (
                      <Link
                        href={`/opportunities/${event.opportunityId}`}
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                      >
                        View opportunity →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="px-5 py-4 border-t border-slate-100 text-center">
              <Button variant="secondary" size="sm" onClick={() => load(false)} loading={loading}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
