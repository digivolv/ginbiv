"use client";

import { useState, useEffect, useCallback } from "react";
import OpportunityCard from "@/components/OpportunityCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "classified", label: "Classified" },
  { value: "drafted", label: "Drafted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "copied", label: "Copied" },
  { value: "posted_manually", label: "Posted" },
  { value: "auto_posted", label: "Auto-Posted" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "relevance", label: "Highest Relevance" },
  { value: "urgency", label: "Highest Urgency" },
  { value: "promo_risk_asc", label: "Lowest Promo Risk" },
];

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
  discoveredAt: string;
  sourceType: string;
  drafts?: { id: string; draftType: string }[];
}

export default function DashboardPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadOpportunities = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        params.set("sort", sortBy);
        params.set("limit", "20");
        if (!reset && cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/opportunities?${params}`);
        const data = await res.json();

        if (reset) {
          setItems(data.items ?? []);
        } else {
          setItems((prev) => [...prev, ...(data.items ?? [])]);
        }
        setCursor(data.nextCursor ?? null);
        setHasMore(data.hasMore ?? false);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, sortBy, cursor]
  );

  useEffect(() => {
    setCursor(null);
    loadOpportunities(true);
  }, [statusFilter, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScan = async () => {
    setScanning(true);
    setScanError(null);
    setScanResult(null);
    try {
      const res = await fetch("/api/scan", { method: "POST", body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error ?? "Scan failed");
      } else {
        setScanResult(
          `Found ${data.opportunitiesFound} new, generated ${data.draftsGenerated} drafts, auto-posted ${data.autoRepliesPosted}`
        );
        loadOpportunities(true);
      }
    } catch (e) {
      setScanError("Network error");
    } finally {
      setScanning(false);
    }
  };

  const patchStatus = async (id: string, status: string) => {
    await fetch(`/api/opportunities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setItems((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  };

  const counts = {
    crisis: items.filter((o) => o.isCrisis).length,
    new: items.filter((o) => o.status === "new").length,
    drafted: items.filter((o) => o.status === "drafted").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opportunity Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reddit posts and comments where Mara can help
          </p>
        </div>
        <Button onClick={handleScan} loading={scanning} variant="primary" size="lg">
          {scanning ? "Scanning…" : "Run Scan"}
        </Button>
      </div>

      {counts.crisis > 0 && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-red-600">⚠</span>
          <span className="text-sm text-red-700 font-medium">
            {counts.crisis} crisis item{counts.crisis > 1 ? "s" : ""} require human attention — do not promote
          </span>
        </div>
      )}

      {scanError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {scanError}
        </div>
      )}
      {scanResult && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          Scan complete: {scanResult}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-6">
        {[
          { label: "Total shown", value: items.length },
          { label: "Drafted", value: counts.drafted, highlight: counts.drafted > 0 },
          { label: "Crisis", value: counts.crisis, crisis: counts.crisis > 0 },
        ].map(({ label, value, highlight, crisis }) => (
          <div
            key={label}
            className={`px-4 py-2 rounded-lg text-sm ${
              crisis
                ? "bg-red-50 border border-red-200"
                : highlight
                ? "bg-amber-50 border border-amber-200"
                : "bg-white border border-slate-200"
            }`}
          >
            <span className={`font-semibold ${crisis ? "text-red-700" : "text-slate-800"}`}>
              {value}
            </span>
            <span className="text-slate-500 ml-1">{label}</span>
          </div>
        ))}
      </div>

      {/* Items */}
      {loading && items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3" />
          Loading opportunities…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-lg mb-2">No opportunities yet</p>
          <p className="text-slate-400 text-sm mb-6">
            Run a scan to discover Reddit posts, or use Manual Input to analyze a specific URL.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={handleScan} loading={scanning} variant="primary">
              Run Scan
            </Button>
            <a href="/manual">
              <Button variant="secondary">Manual Input</Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onReject={(id) => patchStatus(id, "rejected")}
              onMarkCopied={(id) => patchStatus(id, "copied")}
              onMarkPosted={(id) => patchStatus(id, "posted_manually")}
              onFalsePositive={(id) => patchStatus(id, "false_positive")}
            />
          ))}
          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="secondary"
                onClick={() => loadOpportunities(false)}
                loading={loading}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
