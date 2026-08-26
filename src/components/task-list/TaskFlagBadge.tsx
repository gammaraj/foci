import { CHIP_TONE, META_CHIP_CLASS } from "@/components/task-list/utils";

export function WaitingBadge() {
  return (
    <span className={`${META_CHIP_CLASS} ${CHIP_TONE.waiting}`} title="Waiting on a blocker">
      Waiting
    </span>
  );
}

export function SomedayBadge() {
  return (
    <span className={`${META_CHIP_CLASS} ${CHIP_TONE.someday}`} title="Someday / maybe">
      Someday
    </span>
  );
}

export function TimingBadge() {
  return (
    <span className={`${META_CHIP_CLASS} ${CHIP_TONE.timing}`} title="Timer running on this task">
      <span className="w-1 h-1 rounded-full bg-white animate-pulse" aria-hidden />
      Timing
    </span>
  );
}

export function SelectedBadge() {
  return (
    <span className={`${META_CHIP_CLASS} ${CHIP_TONE.selected}`} title="Selected for focus">
      Selected
    </span>
  );
}

export function subtaskCountChipClass(open?: boolean): string {
  return `${META_CHIP_CLASS} transition-colors ${open ? CHIP_TONE.subtasksOpen : CHIP_TONE.subtasks}`;
}
