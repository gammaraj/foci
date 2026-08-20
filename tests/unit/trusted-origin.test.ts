import { afterEach, describe, expect, it } from "vitest";
import { PRODUCTION_ORIGIN, trustedOriginFromRequest, trustedRedirectHostname } from "@/lib/trusted-origin";

describe("trustedOriginFromRequest", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env.VERCEL_URL = original.VERCEL_URL;
    process.env.VERCEL_BRANCH_URL = original.VERCEL_BRANCH_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = original.VERCEL_PROJECT_PRODUCTION_URL;
  });

  it("allows the production host from the request URL", () => {
    const origin = trustedOriginFromRequest(
      new Request("https://usefoci.com/auth/callback?code=abc", {
        headers: { "x-forwarded-host": "evil.example" },
      }),
    );
    expect(origin).toBe("https://usefoci.com");
  });

  it("ignores a spoofed Host / X-Forwarded-Host", () => {
    const origin = trustedOriginFromRequest(
      new Request("https://usefoci.com/auth/callback", {
        headers: {
          host: "evil.example",
          "x-forwarded-host": "evil.example",
        },
      }),
    );
    expect(origin).toBe("https://usefoci.com");
  });

  it("falls back to production when the request host is unknown", () => {
    const origin = trustedOriginFromRequest(new Request("https://attacker.example/auth/callback"));
    expect(origin).toBe(PRODUCTION_ORIGIN);
  });

  it("allows the current Vercel deployment host", () => {
    process.env.VERCEL_URL = "foci-git-main-filantus.vercel.app";
    const origin = trustedOriginFromRequest(
      new Request("https://foci-git-main-filantus.vercel.app/auth/callback"),
    );
    expect(origin).toBe("https://foci-git-main-filantus.vercel.app");
  });

  it("allows localhost for development", () => {
    const origin = trustedOriginFromRequest(new Request("http://localhost:3000/auth/callback"));
    expect(origin).toBe("http://localhost:3000");
  });
});

describe("trustedRedirectHostname", () => {
  it("does not reflect an untrusted Host header", () => {
    expect(trustedRedirectHostname("evil.example")).toBe("usefoci.com");
  });

  it("keeps the production host", () => {
    expect(trustedRedirectHostname("usefoci.com")).toBe("usefoci.com");
  });
});
