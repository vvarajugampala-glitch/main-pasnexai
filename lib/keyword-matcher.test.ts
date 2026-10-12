import {
  doesAutomationConditionMatch,
  findBestAutomationMatch,
  normalizeMatchText,
  type AutomationCandidate,
  type MatchContext,
} from "./keyword-matcher";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log("=== REGRESSION TESTS: KEYWORD MATCHER ===");

// 1. Existing keyword still matches
{
  const result = doesAutomationConditionMatch({ keyword: "price" }, "What is the price of this item?");
  assert(result.matched && result.specificity > 0, "Existing keyword 'price' in string matches");
}

// 2. Newly created keyword matches after save (array format)
{
  const result = doesAutomationConditionMatch({ keywords: ["nice", "awesome"] }, "Such a nice video!");
  assert(result.matched && result.specificity > 0, "Newly created keyword 'nice' in array matches");
}

// 3. Multiple keywords with contains_any
{
  const config = { keywords: ["price", "cost", "buy"], match_mode: "contains_any" as const };
  assert(doesAutomationConditionMatch(config, "how much does it cost?").matched, "contains_any matches 'cost'");
  assert(doesAutomationConditionMatch(config, "can I buy now?").matched, "contains_any matches 'buy'");
  assert(!doesAutomationConditionMatch(config, "great photo").matched, "contains_any rejects 'great photo'");
}

// 4. Multiple keywords with contains_all
{
  const config = { keywords: ["price", "dm"], match_mode: "contains_all" as const };
  assert(doesAutomationConditionMatch(config, "please dm me the price").matched, "contains_all matches when both present");
  assert(!doesAutomationConditionMatch(config, "what is the price?").matched, "contains_all rejects when only 'price' present");
}

// 5. exact mode with positive and negative cases
{
  const config = { keywords: ["price", "link"], match_mode: "exact" as const };
  assert(doesAutomationConditionMatch(config, "price").matched, "exact mode matches 'price'");
  assert(doesAutomationConditionMatch(config, "  PRICE  ").matched, "exact mode normalizes whitespace and casing");
  assert(!doesAutomationConditionMatch(config, "what is the price?").matched, "exact mode rejects sentence containing keyword");
}

// 6. Case and whitespace normalization
{
  assert(normalizeMatchText("  HELLO   WORLD  ") === "hello world", "whitespace normalization works");
  const result = doesAutomationConditionMatch({ keywords: ["super cool"] }, "This is SUPER   COOL!");
  assert(result.matched, "multi-word keyword matches with varying internal whitespace & uppercase");
}

// 7. Nonmatching comments remain nonmatching
{
  const config = { keywords: ["demo", "pricing"], match_mode: "contains_any" as const };
  assert(!doesAutomationConditionMatch(config, "random feedback message").matched, "non-matching comment does not match");
}

// 8. Specificity priority: Specific keyword automation MUST win over generic onboarding fallback
{
  const mockAutomations: AutomationCandidate[] = [
    {
      id: "fallback-onboarding",
      name: "Instagram Comment to DM",
      trigger_type: "comment_received",
      config_json: {
        template: "Instagram Comment to DM",
        channel_type: "instagram",
        // no keywords or empty
      },
      created_at: "2026-08-04T15:48:49Z",
    },
    {
      id: "user-new-keyword",
      name: "Instagram Auto-DM Workflow",
      trigger_type: "comment_received",
      config_json: {
        channel_type: "instagram",
        keywords: ["nice"],
        comment_condition_type: "keywords",
        match_mode: "contains_any",
      },
      created_at: "2026-10-12T05:00:00Z",
    },
  ];

  const ctx: MatchContext = {
    channelType: "instagram",
    isCommentEvent: true,
    incomingText: "nice reel!",
  };

  const bestMatch = findBestAutomationMatch(mockAutomations, ctx);
  assert(bestMatch !== null, "Found a match");
  assert(bestMatch?.id === "user-new-keyword", "User's new keyword automation took priority over legacy onboarding fallback!");
}

// 9. Specific-post targeting continues to work
{
  const mockAutomations: AutomationCandidate[] = [
    {
      id: "all-posts-automation",
      name: "Global Price Reply",
      trigger_type: "comment_received",
      config_json: {
        channel_type: "instagram",
        keywords: ["price"],
        post_scope: "all",
      },
    },
    {
      id: "specific-post-automation",
      name: "Special Reel Promo",
      trigger_type: "comment_received",
      config_json: {
        channel_type: "instagram",
        keywords: ["price"],
        post_scope: "specific",
        post_id: "reel12345",
      },
    },
  ];

  // Incoming on reel12345
  const matchSpecific = findBestAutomationMatch(mockAutomations, {
    channelType: "instagram",
    isCommentEvent: true,
    incomingText: "price please",
    postId: "reel12345",
  });
  assert(matchSpecific?.id === "specific-post-automation", "Specific post filter prioritized when matching target post");

  // Incoming on other post
  const matchOther = findBestAutomationMatch(mockAutomations, {
    channelType: "instagram",
    isCommentEvent: true,
    incomingText: "price please",
    postId: "other_post_999",
  });
  assert(matchOther?.id === "all-posts-automation", "Falls back to all-posts automation when post id does not match");
}

console.log("\nALL 9 REGRESSION TESTS PASSED! 🎉");
