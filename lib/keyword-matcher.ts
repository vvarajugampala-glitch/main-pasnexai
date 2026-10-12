export type AutomationMatchConfig = {
  keyword?: string;
  keywords?: string[];
  match_mode?: "contains_any" | "contains_all" | "exact";
  comment_condition_type?: "any" | "keywords";
  post_scope?: "all" | "specific";
  post_id?: string;
  channel_type?: string;
  [key: string]: unknown;
};

export type AutomationCandidate = {
  id: string;
  name: string;
  trigger_type: string;
  config_json?: AutomationMatchConfig | null;
  created_at?: string;
};

export type MatchContext = {
  channelType: string;
  isCommentEvent: boolean;
  incomingText: string;
  postId?: string | null;
};

/**
 * Normalizes text for matching by:
 * - Lowercasing
 * - Trimming outer whitespace
 * - Collapsing multiple internal whitespaces to a single space
 */
export function normalizeMatchText(text?: string | null): string {
  if (!text) return "";
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Checks if a specific automation's trigger condition matches the incoming event.
 */
export function doesAutomationConditionMatch(
  config: AutomationMatchConfig,
  incomingText: string
): { matched: boolean; specificity: number } {
  const normIncoming = normalizeMatchText(incomingText);

  // 1. Check if user configured explicit "any" comment or wildcard keyword
  const isExplicitWildcard =
    config.comment_condition_type === "any" ||
    config.keyword === "*" ||
    (Array.isArray(config.keywords) && config.keywords.includes("*"));

  if (isExplicitWildcard) {
    // Specificity score 1 (lowest priority fallback)
    return { matched: true, specificity: 1 };
  }

  // 2. Extract configured keywords
  const rawKeywords = Array.isArray(config.keywords) && config.keywords.length > 0
    ? config.keywords
    : config.keyword
      ? [config.keyword]
      : [];

  const activeKeywords = rawKeywords
    .map((k) => normalizeMatchText(k))
    .filter((k) => k.length > 0 && k !== "*");

  // If automation has no keywords defined at all, treat as low-specificity fallback
  if (activeKeywords.length === 0) {
    return { matched: true, specificity: 0 };
  }

  const mode = config.match_mode || "contains_any";

  if (mode === "exact") {
    // Exact match: the entire incoming text equals one of the keywords
    const isExact = activeKeywords.some((kw) => normIncoming === kw);
    return isExact ? { matched: true, specificity: 100 } : { matched: false, specificity: 0 };
  }

  if (mode === "contains_all") {
    // Contains all: incoming text must contain every keyword
    const containsAll = activeKeywords.every((kw) => normIncoming.includes(kw));
    return containsAll ? { matched: true, specificity: 50 + activeKeywords.length * 5 } : { matched: false, specificity: 0 };
  }

  // Default: contains_any
  // Uses word boundary / substring matching.
  const matchedKeyword = activeKeywords.find((kw) => {
    // Check direct substring
    if (!normIncoming.includes(kw)) return false;
    return true;
  });

  if (matchedKeyword) {
    return { matched: true, specificity: 10 + matchedKeyword.length };
  }

  return { matched: false, specificity: 0 };
}

/**
 * Finds the best matching automation from candidates by:
 * 1. Filtering by channel type, trigger event (comment vs dm), and post ID
 * 2. Evaluating keyword matching
 * 3. Prioritizing specific keyword matches over generic catch-all automations,
 *    and newly updated/created automations over legacy defaults.
 */
export function findBestAutomationMatch(
  automations: AutomationCandidate[],
  ctx: MatchContext
): AutomationCandidate | null {
  const isMetaPageChannel = (type?: string) => type === "facebook" || type === "messenger";

  const candidatesWithScore: Array<{
    automation: AutomationCandidate;
    specificity: number;
    hasPostFilter: boolean;
  }> = [];

  for (const automation of automations) {
    const config = (automation.config_json ?? {}) as AutomationMatchConfig;

    // 1. Channel Filter
    if (
      config.channel_type &&
      config.channel_type !== "all" &&
      config.channel_type !== ctx.channelType &&
      !(isMetaPageChannel(config.channel_type) && isMetaPageChannel(ctx.channelType))
    ) {
      continue;
    }

    // 2. Trigger Type Filter
    if (ctx.isCommentEvent) {
      if (!["comment_received", "comment_to_dm", "keyword_or_message"].includes(automation.trigger_type)) {
        continue;
      }
    } else {
      if (!["message_received", "keyword_or_message", "ai_chat_started"].includes(automation.trigger_type)) {
        continue;
      }
    }

    // 3. Post ID Filter (if configured)
    let hasPostFilter = false;
    if (config.post_id && config.post_id.trim()) {
      hasPostFilter = true;
      const targetPost = config.post_id.trim();
      const incomingPost = ctx.postId ? ctx.postId.trim() : "";
      if (incomingPost && !incomingPost.includes(targetPost) && !targetPost.includes(incomingPost)) {
        continue;
      }
    }

    // 4. Keyword Condition Match
    const { matched, specificity } = doesAutomationConditionMatch(config, ctx.incomingText);
    if (!matched) {
      continue;
    }

    candidatesWithScore.push({
      automation,
      specificity: specificity + (hasPostFilter ? 1000 : 0),
      hasPostFilter,
    });
  }

  if (candidatesWithScore.length === 0) {
    return null;
  }

  // Sort by highest specificity first (e.g. exact keywords > contains keywords > catch-all)
  // If tied in specificity, prefer the more recently created or updated one (or first in list)
  candidatesWithScore.sort((a, b) => b.specificity - a.specificity);

  return candidatesWithScore[0].automation;
}
