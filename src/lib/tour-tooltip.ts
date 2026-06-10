import type { CSSProperties } from "react";

const TOOLTIP_WIDTH = 300;
const MARGIN = 16;
const ESTIMATED_HEIGHT = 200;

/** Keep tour tooltips inside the viewport on narrow screens. */
export function positionTourTooltip(
  rect: DOMRect,
  position: "top" | "bottom" | "left" | "right"
): CSSProperties {
  const style: CSSProperties = { position: "fixed", zIndex: 9999 };
  const centerX = rect.left + rect.width / 2;

  const clampLeft = (left: number) =>
    Math.max(MARGIN, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - MARGIN));

  switch (position) {
    case "bottom":
      style.top = Math.min(rect.bottom + 12, window.innerHeight - ESTIMATED_HEIGHT - MARGIN);
      style.left = clampLeft(centerX - TOOLTIP_WIDTH / 2);
      break;
    case "top":
      style.bottom = Math.max(
        window.innerHeight - rect.top + 12,
        MARGIN
      );
      style.left = clampLeft(centerX - TOOLTIP_WIDTH / 2);
      break;
    case "left":
      style.top = Math.max(
        MARGIN,
        Math.min(rect.top + rect.height / 2 - 40, window.innerHeight - ESTIMATED_HEIGHT - MARGIN)
      );
      style.right = Math.max(MARGIN, window.innerWidth - rect.left + 12);
      break;
    case "right":
      style.top = Math.max(
        MARGIN,
        Math.min(rect.top + rect.height / 2 - 40, window.innerHeight - ESTIMATED_HEIGHT - MARGIN)
      );
      style.left = clampLeft(rect.right + 12);
      break;
  }

  return style;
}
