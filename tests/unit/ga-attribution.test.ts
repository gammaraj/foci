import { describe, expect, it } from "vitest";
import {
  analyticsPagePath,
  isSelfCampaignSource,
  shouldIgnoreLandingAttribution,
  shouldIgnoreReferrer,
  shouldStripSelfCampaign,
  stripSelfCampaignParams,
} from "@/lib/ga-attribution";

describe("ga-attribution", () => {
  it("ignores Google OAuth and Supabase referrers", () => {
    expect(shouldIgnoreReferrer("https://accounts.google.com/")).toBe(true);
    expect(shouldIgnoreReferrer("https://xyz.supabase.co/auth/v1/callback")).toBe(true);
    expect(shouldIgnoreReferrer("https://chat.openai.com/")).toBe(false);
  });

  it("treats foci-header style tokens as self campaigns", () => {
    expect(isSelfCampaignSource("foci-header")).toBe(true);
    expect(isSelfCampaignSource("foci-footer")).toBe(true);
    expect(isSelfCampaignSource("chatgpt.com")).toBe(false);
  });

  it("strips self UTM params from the landing URL", () => {
    const params = new URLSearchParams("utm_source=foci-header&utm_medium=referral&view=cards");
    expect(shouldStripSelfCampaign(params)).toBe(true);
    const next = stripSelfCampaignParams(params);
    expect(next.get("utm_source")).toBeNull();
    expect(next.get("utm_medium")).toBeNull();
    expect(next.get("view")).toBe("cards");
  });

  it("keeps product query params on analytics page_path", () => {
    expect(analyticsPagePath("/app", "utm_source=chatgpt.com&layout=plan")).toBe(
      "/app?layout=plan",
    );
    expect(analyticsPagePath("/blog/flowtime-technique-guide", "utm_source=foci-header")).toBe(
      "/blog/flowtime-technique-guide",
    );
  });

  it("ignores landing attribution for OAuth referrers or self UTMs", () => {
    expect(
      shouldIgnoreLandingAttribution("https://accounts.google.com/o/oauth2", ""),
    ).toBe(true);
    expect(shouldIgnoreLandingAttribution("", "utm_source=foci-app")).toBe(true);
    expect(shouldIgnoreLandingAttribution("https://t.co/", "utm_source=twitter")).toBe(false);
  });
});
