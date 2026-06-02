"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";

const AUTONOMY_MODE_DESCRIPTIONS: Record<string, { label: string; description: string; warning?: string }> = {
  review_only: {
    label: "Review Only",
    description: "Discovers opportunities and generates drafts. Never posts automatically.",
  },
  support_only_autopilot: {
    label: "Support-Only Autopilot",
    description:
      "May autonomously post no-promo supportive replies if all safety checks pass. Promotional content still requires human approval.",
    warning: "Ensure all safety rules and subreddit policies are configured before enabling.",
  },
  full_autopilot: {
    label: "Full Autopilot",
    description: "⚠ DISABLED — requires ALLOW_AUTONOMOUS_PROMO=true in environment. See README.",
    warning: "This mode is intentionally disabled in v1.",
  },
};

interface Settings {
  autonomyMode: string;
  allowAutonomousPromo: boolean;
  maxAutonomousRepliesPerDay: number;
  maxRepliesPerSubredditPerDay: number;
  minMinutesBetweenReplies: number;
  minThreadAgeMinutes: number;
  maxContentAgeHours: number;
  trackedSubreddits: string[];
  searchKeywords: string[];
  blockedKeywords: string[];
  youtubeUrl: string;
  scanIntervalMinutes: number;
  maxResultsPerScan: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          trackedSubreddits: settings.trackedSubreddits,
          searchKeywords: settings.searchKeywords,
          blockedKeywords: settings.blockedKeywords,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error);
      else {
        setSettings(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof Settings, value: unknown) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  const modeConfig = AUTONOMY_MODE_DESCRIPTIONS[settings.autonomyMode];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure Mara Agent behavior</p>
        </div>
        <Button onClick={save} loading={saving} variant="primary">
          {saved ? "✓ Saved" : "Save Changes"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Autonomy Mode */}
      <section className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Autonomy Mode</h2>
        <div className="space-y-3">
          {Object.entries(AUTONOMY_MODE_DESCRIPTIONS).map(([value, config]) => (
            <label
              key={value}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                settings.autonomyMode === value
                  ? "border-slate-400 bg-slate-50"
                  : "border-slate-200 hover:bg-slate-50"
              } ${value === "full_autopilot" ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <input
                type="radio"
                name="autonomyMode"
                value={value}
                checked={settings.autonomyMode === value}
                onChange={() => value !== "full_autopilot" && set("autonomyMode", value)}
                disabled={value === "full_autopilot"}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-slate-800">{config.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
                {config.warning && (
                  <p className="text-xs text-amber-600 mt-1">{config.warning}</p>
                )}
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Rate Limits */}
      <section className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Rate Limits</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "maxAutonomousRepliesPerDay" as const, label: "Max replies / day (global)" },
            { key: "maxRepliesPerSubredditPerDay" as const, label: "Max replies / subreddit / day" },
            { key: "minMinutesBetweenReplies" as const, label: "Min minutes between replies" },
            { key: "minThreadAgeMinutes" as const, label: "Min thread age (minutes)" },
            { key: "maxContentAgeHours" as const, label: "Max content age (hours)" },
            { key: "maxResultsPerScan" as const, label: "Max results per scan" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
              <input
                type="number"
                value={settings[key]}
                onChange={(e) => set(key, parseInt(e.target.value, 10) || 0)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Tracked Subreddits */}
      <section className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Tracked Subreddits</h2>
        <p className="text-xs text-slate-500 mb-3">One subreddit name per line (no r/)</p>
        <textarea
          value={settings.trackedSubreddits.join("\n")}
          onChange={(e) =>
            set(
              "trackedSubreddits",
              e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
            )
          }
          rows={6}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
        />
      </section>

      {/* Keywords */}
      <section className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Keywords</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Search Keywords (one per line)
            </label>
            <textarea
              value={settings.searchKeywords.join("\n")}
              onChange={(e) =>
                set(
                  "searchKeywords",
                  e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                )
              }
              rows={6}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Blocked Keywords — skip content containing these (one per line)
            </label>
            <textarea
              value={settings.blockedKeywords.join("\n")}
              onChange={(e) =>
                set(
                  "blockedKeywords",
                  e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                )
              }
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
            />
          </div>
        </div>
      </section>

      {/* YouTube */}
      <section className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">YouTube Channel</h2>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Video URL for soft promotion
          </label>
          <input
            type="url"
            value={settings.youtubeUrl}
            onChange={(e) => set("youtubeUrl", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <p className="text-xs text-slate-400 mt-1">
            Only mentioned in soft-promo drafts when promoSuitability ≥ 70 and promoRisk ≤ 35.
            Never auto-posted.
          </p>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving} variant="primary" size="lg">
          {saved ? "✓ Saved" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
