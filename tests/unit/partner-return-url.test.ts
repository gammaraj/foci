import { describe, expect, it } from "vitest";
import { boostLogikReturnUrl } from "@/lib/boostlogik-integration";
import { certStudPracticeUrl } from "@/lib/certstud-integration";
import { safePartnerReturnUrl } from "@/lib/partner-return-url";

describe("safePartnerReturnUrl", () => {
  const allowed = ["https://boostlogik.com", "https://www.boostlogik.com"] as const;

  it("accepts https URLs on an allowlisted origin", () => {
    expect(safePartnerReturnUrl("https://boostlogik.com/dashboard/p1", allowed)).toBe(
      "https://boostlogik.com/dashboard/p1",
    );
  });

  it("rejects other origins, javascript URLs, and userinfo tricks", () => {
    expect(safePartnerReturnUrl("https://evil.example/phish", allowed)).toBeNull();
    expect(safePartnerReturnUrl("javascript:alert(1)", allowed)).toBeNull();
    expect(safePartnerReturnUrl("https://boostlogik.com.evil.example/", allowed)).toBeNull();
    expect(safePartnerReturnUrl("http://boostlogik.com/dashboard", allowed)).toBeNull();
  });
});

describe("partner promo hrefs", () => {
  it("boostLogikReturnUrl ignores an untrusted returnUrl", () => {
    expect(
      boostLogikReturnUrl({ returnUrl: "https://evil.example/phish", ref: "foci-app" }),
    ).toBe("https://boostlogik.com/dashboard?ref=foci");
  });

  it("boostLogikReturnUrl keeps an allowlisted returnUrl", () => {
    expect(
      boostLogikReturnUrl({ returnUrl: "https://boostlogik.com/dashboard/abc" }),
    ).toBe("https://boostlogik.com/dashboard/abc");
  });

  it("certStudPracticeUrl ignores an untrusted returnUrl", () => {
    expect(
      certStudPracticeUrl({ returnUrl: "https://evil.example/phish" }),
    ).toBe("https://certstud.com/certifications?ref=foci");
  });
});
