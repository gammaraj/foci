import { describe, it, expect } from "vitest";
import { getDailyQuote, getDisplayQuote, parseQuote } from "@/lib/quotes";

describe("quotes", () => {
  it("parseQuote splits author after the last dash", () => {
    expect(parseQuote("Keep going. - Sam Levenson")).toEqual({
      text: "Keep going.",
      author: "Sam Levenson",
    });
    expect(parseQuote("No author here")).toEqual({ text: "No author here" });
  });

  it("getDailyQuote is stable for a given day", () => {
    const day = new Date(2026, 7, 30);
    expect(getDailyQuote(day)).toBe(getDailyQuote(new Date(2026, 7, 30)));
  });

  it("getDisplayQuote prefers a custom quote when provided", () => {
    const day = new Date(2026, 7, 30);
    expect(getDisplayQuote(null, day)).toBe(getDailyQuote(day));
    expect(getDisplayQuote("  Deep work first  ", day)).toBe("Deep work first");
    expect(getDisplayQuote("", day)).toBe(getDailyQuote(day));
  });
});
