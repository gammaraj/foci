export function OneThingBadge({ size = "default" }: { size?: "default" | "compact" }) {
  const compact = size === "compact";
  return (
    <span
      className={`inline-flex items-center font-semibold uppercase rounded border shrink-0 ${
        compact
          ? "px-1 py-0 text-[10px] leading-none tracking-wide"
          : "px-1.5 py-0.5 text-xs"
      } bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50`}
      title="Today's One Thing"
    >
      One Thing
    </span>
  );
}
