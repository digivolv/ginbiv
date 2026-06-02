// Reddit API client using snoowrap with conservative rate limiting.
// Gracefully degrades to "unavailable" if credentials are missing.

import type { RedditPost, RedditComment } from "@/types";

// Snoowrap is CJS — import dynamically to avoid SSR issues with Next.js
// and to handle the case where credentials are absent.
let _snoo: any = null;
let _initError: string | null = null;

async function getSnoo(): Promise<any> {
  if (_snoo) return _snoo;
  if (_initError) throw new Error(_initError);

  const required = [
    "REDDIT_CLIENT_ID",
    "REDDIT_CLIENT_SECRET",
    "REDDIT_USERNAME",
    "REDDIT_PASSWORD",
    "REDDIT_USER_AGENT",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    _initError = `Reddit credentials missing: ${missing.join(", ")}. Running in manual-only mode.`;
    throw new Error(_initError);
  }

  try {
    const Snoowrap = (await import("snoowrap")).default;
    _snoo = new Snoowrap({
      userAgent: process.env.REDDIT_USER_AGENT!,
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      username: process.env.REDDIT_USERNAME!,
      password: process.env.REDDIT_PASSWORD!,
    });
    // Conservative rate limit: stay well under Reddit's 60 req/min
    _snoo.config({ requestDelay: 1100, continueAfterRatelimitError: false });
    return _snoo;
  } catch (e) {
    _initError = `Failed to init Reddit client: ${e instanceof Error ? e.message : String(e)}`;
    throw new Error(_initError);
  }
}

export function isRedditAvailable(): boolean {
  const required = [
    "REDDIT_CLIENT_ID",
    "REDDIT_CLIENT_SECRET",
    "REDDIT_USERNAME",
    "REDDIT_PASSWORD",
    "REDDIT_USER_AGENT",
  ];
  return required.every((k) => Boolean(process.env[k]));
}

// Fetch recent hot + new posts from a subreddit
export async function fetchSubredditPosts(
  subreddit: string,
  limit = 25,
  maxAgeHours = 72
): Promise<RedditPost[]> {
  const snoo = await getSnoo();
  const cutoff = Date.now() / 1000 - maxAgeHours * 3600;

  const [hotPosts, newPosts] = await Promise.all([
    snoo.getSubreddit(subreddit).getHot({ limit }),
    snoo.getSubreddit(subreddit).getNew({ limit }),
  ]);

  const all = [...hotPosts, ...newPosts];
  const seen = new Set<string>();
  const results: RedditPost[] = [];

  for (const post of all) {
    if (seen.has(post.id)) continue;
    seen.add(post.id);

    // Skip non-self posts, deleted/removed, locked, too old
    if (!post.is_self) continue;
    if (!post.selftext || post.selftext === "[deleted]" || post.selftext === "[removed]") continue;
    if (post.locked) continue;
    if (post.created_utc < cutoff) continue;
    if (post.removed_by_category) continue;

    results.push({
      id: post.id,
      subreddit,
      author: post.author?.name ?? "[deleted]",
      title: post.title ?? "",
      selftext: post.selftext ?? "",
      url: `https://www.reddit.com${post.permalink}`,
      permalink: post.permalink,
      created_utc: post.created_utc,
      score: post.score,
      num_comments: post.num_comments,
      is_self: true,
      locked: post.locked,
      removed_by_category: post.removed_by_category ?? null,
    });
  }

  return results;
}

// Search a subreddit for posts matching keywords
export async function searchSubreddit(
  subreddit: string,
  keywords: string[],
  limit = 25,
  maxAgeHours = 72
): Promise<RedditPost[]> {
  const snoo = await getSnoo();
  const cutoff = Date.now() / 1000 - maxAgeHours * 3600;

  // Search with the first few keywords (keep query short)
  const query = keywords.slice(0, 3).join(" OR ");
  const posts = await snoo.getSubreddit(subreddit).search({
    query,
    sort: "new",
    time: "week",
    limit,
  });

  const results: RedditPost[] = [];
  for (const post of posts) {
    if (!post.is_self) continue;
    if (!post.selftext || post.selftext === "[deleted]" || post.selftext === "[removed]") continue;
    if (post.locked) continue;
    if (post.created_utc < cutoff) continue;
    if (post.removed_by_category) continue;

    results.push({
      id: post.id,
      subreddit,
      author: post.author?.name ?? "[deleted]",
      title: post.title ?? "",
      selftext: post.selftext ?? "",
      url: `https://www.reddit.com${post.permalink}`,
      permalink: post.permalink,
      created_utc: post.created_utc,
      score: post.score,
      num_comments: post.num_comments,
      is_self: true,
      locked: post.locked,
      removed_by_category: post.removed_by_category ?? null,
    });
  }

  return results;
}

// Post a reply to a Reddit item (comment or post)
// NOTE: Only called when autonomy mode permits it AND all safety checks pass.
export async function postReply(
  thingId: string, // fullname e.g. "t3_abc123" or "t1_abc123"
  body: string
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    const snoo = await getSnoo();
    const submission = await snoo.getContentByIds([thingId]);
    if (!submission || submission.length === 0) {
      return { success: false, error: `Could not find Reddit item ${thingId}` };
    }
    const reply = await submission[0].reply(body);
    return { success: true, replyId: reply.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// Parse a Reddit URL into its components
export function parseRedditUrl(url: string): {
  subreddit?: string;
  postId?: string;
  commentId?: string;
} {
  // https://www.reddit.com/r/SUBREDDIT/comments/POST_ID/TITLE/COMMENT_ID/
  const match = url.match(
    /reddit\.com\/r\/([^/]+)\/comments\/([^/]+)(?:\/[^/]*\/([^/?]+))?/
  );
  if (!match) return {};
  return {
    subreddit: match[1],
    postId: match[2],
    commentId: match[3],
  };
}

// Fetch a single post by URL
export async function fetchPostByUrl(url: string): Promise<{
  post?: RedditPost;
  comment?: RedditComment;
  error?: string;
}> {
  try {
    const snoo = await getSnoo();
    const { subreddit, postId, commentId } = parseRedditUrl(url);

    if (!postId) {
      return { error: "Could not parse Reddit post ID from URL" };
    }

    const submission = await snoo.getSubmission(postId).fetch();
    const post: RedditPost = {
      id: submission.id,
      subreddit: submission.subreddit?.display_name ?? subreddit ?? "unknown",
      author: submission.author?.name ?? "[deleted]",
      title: submission.title ?? "",
      selftext: submission.selftext ?? "",
      url: `https://www.reddit.com${submission.permalink}`,
      permalink: submission.permalink,
      created_utc: submission.created_utc,
      score: submission.score,
      num_comments: submission.num_comments,
      is_self: submission.is_self,
      locked: submission.locked,
      removed_by_category: submission.removed_by_category ?? null,
    };

    if (!commentId) {
      return { post };
    }

    // Fetch the specific comment
    const comment = await snoo.getComment(commentId).fetch();
    const commentData: RedditComment = {
      id: comment.id,
      subreddit: submission.subreddit?.display_name ?? subreddit ?? "unknown",
      author: comment.author?.name ?? "[deleted]",
      body: comment.body ?? "",
      permalink: `https://www.reddit.com${comment.permalink}`,
      created_utc: comment.created_utc,
      score: comment.score,
      link_id: comment.link_id,
      parent_id: comment.parent_id,
      link_title: submission.title,
    };

    return { post, comment: commentData };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
