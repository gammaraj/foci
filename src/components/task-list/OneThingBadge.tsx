export function OneThingBadge({ size = "default" }: { size?: "default" | "compact" }) {
  const compact = size === "compact";
  return (
    <span
      className={`inline-flex items-center font-semibold uppercase rounded border shrink-0 ${
        compact
          ? "px-1 py-0 text-[10px] leading-none tracking-wide"
          : "px-1.5 py-0.5 text-xs"
      } bg-teal-50 dark:bg-teal-900/35 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-700/50`}
      title="Today's One Thing"
    >
      One Thing
    </span>
  );
}
