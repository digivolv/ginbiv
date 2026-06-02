import { deterministicSafetyCheck, isCrisisContent, passesPreFilter } from "../lib/safety";
import { passesPreFilter as scoringPreFilter } from "../lib/scoring";

// Re-export for test clarity
const { deterministicSafetyCheck: check } = { deterministicSafetyCheck };

describe("isCrisisContent", () => {
  test("detects suicide mention", () => {
    expect(isCrisisContent("I want to kill myself tonight")).toBe(true);
  });

  test("detects self-harm", () => {
    expect(isCrisisContent("I've been cutting myself again")).toBe(true);
  });

  test("detects 'end my life'", () => {
    expect(isCrisisContent("I just want to end my life")).toBe(true);
  });

  test("does not flag normal breakup content", () => {
    expect(isCrisisContent("I miss my ex so much, can't sleep")).toBe(false);
  });

  test("does not flag 'I'm dying of embarrassment'", () => {
    expect(isCrisisContent("I'm dying of embarrassment over what I said")).toBe(false);
  });
});

describe("deterministicSafetyCheck", () => {
  test("passes a clean no-promo draft", () => {
    const result = deterministicSafetyCheck(
      "Nights make no-contact feel impossible. Put your phone across the room.",
      "I miss my ex so much. Can't sleep.",
    );
    expect(result.isSafe).toBe(true);
    expect(result.isCrisis).toBe(false);
    expect(result.flags).toHaveLength(0);
  });

  test("flags subscribe in draft", () => {
    const result = deterministicSafetyCheck(
      "Please subscribe to my channel for more tips.",
      "I can't sleep after my breakup.",
    );
    expect(result.isSafe).toBe(false);
    expect(result.flags.some((f) => f.toLowerCase().includes("self-promotion"))).toBe(true);
  });

  test("flags crisis content in original", () => {
    const result = deterministicSafetyCheck(
      "Take care of yourself tonight.",
      "I want to kill myself, I can't take this breakup.",
    );
    expect(result.isCrisis).toBe(true);
    expect(result.isSafe).toBe(false);
  });

  test("flags disallowed external URL", () => {
    const result = deterministicSafetyCheck(
      "Check out this resource: https://someothersite.com/thing",
      "I miss my ex.",
    );
    expect(result.isSafe).toBe(false);
    expect(result.flags.some((f) => f.includes("URL"))).toBe(true);
  });

  test("allows YouTube URL when allowed", () => {
    const result = deterministicSafetyCheck(
      "I made a video for nights like this https://youtube.com/watch?v=abc",
      "I can't sleep.",
      "https://youtube.com/watch?v=abc"
    );
    // YouTube URL in draft should not flag when it's in the allowed list
    // (URL check allows youtube.com domains)
    expect(result.flags.some((f) => f.includes("URL"))).toBe(false);
  });

  test("flags 'smash the like'", () => {
    const result = deterministicSafetyCheck(
      "If this helped, smash the like button!",
      "I'm heartbroken.",
    );
    expect(result.isSafe).toBe(false);
  });

  test("passes empty flags array for clean content", () => {
    const result = deterministicSafetyCheck(
      "I know this feeling. Nights are the hardest. Try putting your phone in another room.",
      "Going through a bad breakup, can't sleep at all.",
    );
    expect(result.flags).toHaveLength(0);
  });
});

describe("passesPreFilter (scoring)", () => {
  test("passes content with breakup keyword", () => {
    expect(scoringPreFilter("Just went through a bad breakup and can't sleep")).toBe(true);
  });

  test("passes content with no contact", () => {
    expect(scoringPreFilter("Day 14 of no contact, still hurts")).toBe(true);
  });

  test("rejects content with legal advice keyword", () => {
    expect(scoringPreFilter("Need legal advice about my breakup custody situation")).toBe(false);
  });

  test("rejects irrelevant content", () => {
    expect(scoringPreFilter("What is the best way to cook pasta?")).toBe(false);
  });

  test("passes affirmation content", () => {
    expect(scoringPreFilter("Looking for good sleep affirmations to help me heal")).toBe(true);
  });
});
