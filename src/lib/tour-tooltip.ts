import type { CSSProperties } from "react";

const TOOLTIP_WIDTH = 300;
const MARGIN = 16;
const ESTIMATED_HEIGHT = 200;
const GAP = 12;

/** Keep tour tooltips inside the viewport on narrow screens. */
export function positionTourTooltip(
  rect: DOMRect,
  position: "top" | "bottom" | "left" | "right"
): CSSProperties {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const clampLeft = (left: number) =>
    Math.max(MARGIN, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - MARGIN));

  const clampTop = (top: number) =>
    Math.max(MARGIN, Math.min(top, window.innerHeight - ESTIMATED_HEIGHT - MARGIN));

  const spaceAbove = rect.top - MARGIN;
  const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
  const spaceLeft = rect.left - MARGIN;
  const spaceRight = window.innerWidth - rect.right - MARGIN;

  let top: number;
  let left: number;

  switch (position) {
    case "bottom": {
      const placeBelow = spaceBelow >= ESTIMATED_HEIGHT || spaceBelow >= spaceAbove;
      top = placeBelow
        ? rect.bottom + GAP
        : rect.top - ESTIMATED_HEIGHT - GAP;
      left = centerX - TOOLTIP_WIDTH / 2;
      break;
    }
    case "top": {
      const placeAbove = spaceAbove >= ESTIMATED_HEIGHT || spaceAbove >= spaceBelow;
      top = placeAbove
        ? rect.top - ESTIMATED_HEIGHT - GAP
        : rect.bottom + GAP;
      left = centerX - TOOLTIP_WIDTH / 2;
      break;
    }
    case "left": {
      const placeLeft = spaceLeft >= TOOLTIP_WIDTH || spaceLeft >= spaceRight;
      left = placeLeft
        ? rect.left - TOOLTIP_WIDTH - GAP
        : rect.right + GAP;
      top = centerY - 40;
      break;
    }
    case "right": {
      const placeRight = spaceRight >= TOOLTIP_WIDTH || spaceRight >= spaceLeft;
      left = placeRight
        ? rect.right + GAP
        : rect.left - TOOLTIP_WIDTH - GAP;
      top = centerY - 40;
      break;
    }
  }

  return {
    position: "fixed",
    zIndex: 9999,
    top: clampTop(top),
    left: clampLeft(left),
  };
}
