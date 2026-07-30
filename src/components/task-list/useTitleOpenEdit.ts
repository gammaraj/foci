"use client";

import { useCallback, useEffect, useRef } from "react";

const SINGLE_CLICK_MS = 220;

/**
 * Single-click opens/edits the task; double-click can rename without also
 * firing the single-click action (avoids open→close flash).
 */
export function useTitleOpenEdit(onOpen?: () => void, onRename?: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onClick = useCallback(() => {
    if (!onOpen) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!onRename) {
      onOpen();
      return;
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onOpen();
    }, SINGLE_CLICK_MS);
  }, [onOpen, onRename]);

  const onDoubleClick = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onRename?.();
  }, [onRename]);

  return { onClick, onDoubleClick };
}
