import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  rememberAnalyticsPageTitle,
  resolveAnalyticsPageTitle,
} from "@/lib/analytics-page-title";

type FakeDoc = {
  title: string;
  documentElement: { getAttribute: (n: string) => string | null; setAttribute: (n: string, v: string) => void; removeAttribute: (n: string) => void };
  head: { appendChild: (el: { getAttribute: (n: string) => string | null }) => void };
  querySelector: (sel: string) => { getAttribute: (n: string) => string | null } | null;
};

function installDom(initialTitle = "") {
  const attrs = new Map<string, string>();
  let ogContent: string | null = null;

  const documentElement = {
    getAttribute: (n: string) => attrs.get(n) ?? null,
    setAttribute: (n: string, v: string) => {
      attrs.set(n, v);
    },
    removeAttribute: (n: string) => {
      attrs.delete(n);
    },
  };

  const doc: FakeDoc = {
    title: initialTitle,
    documentElement,
    head: {
      appendChild: (el) => {
        if (el.getAttribute("property") === "og:title") {
          ogContent = el.getAttribute("content");
        }
      },
    },
    querySelector: (sel: string) => {
      if (sel === 'meta[property="og:title"]' && ogContent) {
        return { getAttribute: (n: string) => (n === "content" ? ogContent : null) };
      }
      return null;
    },
  };

  vi.stubGlobal("document", doc);
  vi.stubGlobal("window", { gtag: undefined as unknown });

  return {
    doc,
    setOgTitle: (content: string) => {
      ogContent = content;
    },
    clearAttrs: () => attrs.clear(),
  };
}

describe("analytics-page-title", () => {
  let dom: ReturnType<typeof installDom>;

  beforeEach(() => {
    dom = installDom();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("remembers a normal page title and pins it via gtag set", () => {
    const gtag = vi.fn();
    (window as { gtag?: unknown }).gtag = gtag;
    dom.doc.title = "Foci App — Free Pomodoro Timer, Tasks & Sounds";

    rememberAnalyticsPageTitle(dom.doc.title);

    expect(dom.doc.documentElement.getAttribute("data-foci-analytics-title")).toBe(
      "Foci App — Free Pomodoro Timer, Tasks & Sounds",
    );
    expect(gtag).toHaveBeenCalledWith("set", {
      page_title: "Foci App — Free Pomodoro Timer, Tasks & Sounds",
    });
  });

  it("ignores timer tab titles when remembering", () => {
    rememberAnalyticsPageTitle("29:58 · Focus");
    expect(dom.doc.documentElement.getAttribute("data-foci-analytics-title")).toBeNull();
  });

  it("resolveAnalyticsPageTitle returns the live title when it is not a timer title", () => {
    dom.doc.title = "Productivity Stats – Foci";
    expect(resolveAnalyticsPageTitle()).toBe("Productivity Stats – Foci");
  });

  it("resolveAnalyticsPageTitle falls back to the remembered title while the tab shows the timer", () => {
    rememberAnalyticsPageTitle("Foci App — Free Pomodoro Timer, Tasks & Sounds");
    dom.doc.title = "12:34 · Focus";
    expect(resolveAnalyticsPageTitle()).toBe(
      "Foci App — Free Pomodoro Timer, Tasks & Sounds",
    );
  });

  it("resolveAnalyticsPageTitle falls back to og:title when nothing is remembered", () => {
    dom.setOgTitle("Foci App — Free Focus Timer & Task Manager");
    dom.doc.title = "00:40 · Paused";

    expect(resolveAnalyticsPageTitle()).toBe(
      "Foci App — Free Focus Timer & Task Manager",
    );
  });
});
