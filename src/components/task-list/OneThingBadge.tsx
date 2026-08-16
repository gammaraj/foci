export function OneThingBadge({ size = "default" }: { size?: "default" | "compact" }) {
  const compact = size === "compact";
  return (
    <span
      className={`inline-flex items-center font-semibold uppercase rounded border shrink-0 ${
        compact
          ? "px-1.5 py-0.5 text-xs leading-none tracking-wide"
          : "px-1.5 py-0.5 text-xs"
      } bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700/60`}
      title="Today's One Thing"
    >
      Today&apos;s One Thing
    </span>
  );
}
