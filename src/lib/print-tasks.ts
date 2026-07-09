/** Open the browser print dialog after optional layout prep (e.g. expand collapsed sections). */
export function printCurrentView(options?: {
  onPrepare?: () => void;
  onCleanup?: () => void;
}): void {
  options?.onPrepare?.();

  const cleanup = () => {
    options?.onCleanup?.();
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.print());
  });
}
