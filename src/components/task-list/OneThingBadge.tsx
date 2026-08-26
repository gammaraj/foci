import { CHIP_TONE, META_CHIP_CAPS, META_CHIP_CLASS } from "@/components/task-list/utils";

/** Stamp token — stays caps so it reads as today's One Thing, not generic meta. */
export function OneThingBadge() {
  return (
    <span
      className={`${META_CHIP_CLASS} ${META_CHIP_CAPS} ${CHIP_TONE.one}`}
      title="Today's One Thing"
      role="status"
      aria-label="Today's One Thing"
    >
      ONE
    </span>
  );
}
