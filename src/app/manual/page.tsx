"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function ManualInputPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [subreddit, setSubreddit] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!url.trim() && !text.trim()) {
      setError("Provide a Reddit URL or paste the post/comment text.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          text: text.trim() || undefined,
          title: title.trim() || undefined,
          subreddit: subreddit.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to analyze");
        return;
      }
      if (data.isDuplicate) {
        router.push(`/opportunities/${data.opportunity.id}`);
        return;
      }
      router.push(`/opportunities/${data.opportunity.id}`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Manual Input</h1>
      <p className="text-sm text-slate-500 mb-8">
        Paste a Reddit URL or raw post/comment text to analyze and generate Mara reply drafts.
        Useful when the Reddit API is not configured or for specific posts.
      </p>

      <div className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Reddit URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.reddit.com/r/BreakUps/comments/..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <p className="text-xs text-slate-400 mt-1">
            If Reddit API credentials are configured, content will be fetched automatically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">or paste content below</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Subreddit
          </label>
          <input
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
            placeholder="BreakUps"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Post Title <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Can't sleep, miss my ex, don't know what to do"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Post / Comment Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full post or comment text here…"
            rows={8}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setUrl("");
              setText("");
              setTitle("");
              setSubreddit("");
              setError(null);
            }}
          >
            Clear
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Analyze & Generate Drafts
          </Button>
        </div>
      </div>

      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-medium text-slate-600 mb-2">Tips</p>
        <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
          <li>Paste the full text including title for best classification accuracy</li>
          <li>The subreddit name helps calibrate promo risk scoring</li>
          <li>You will be redirected to the opportunity detail page after analysis</li>
          <li>If a URL has already been analyzed, it will open the existing entry</li>
        </ul>
      </div>
    </div>
  );
}
