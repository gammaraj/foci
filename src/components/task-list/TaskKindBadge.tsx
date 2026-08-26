import type { TaskKind } from "@/lib/types";
import { CHIP_TONE, META_CHIP_CAPS, META_CHIP_CLASS } from "@/components/task-list/utils";

export function TaskKindBadge({
  kind,
}: {
  kind: TaskKind;
  size?: "default" | "compact";
}) {
  if (kind === "task") return null;

  const label = kind === "note" ? "Note" : "Q";
  const title = kind === "note" ? "Note" : "Question";
  const tone = kind === "note" ? CHIP_TONE.note : CHIP_TONE.question;
  const stamp = kind === "question" ? META_CHIP_CAPS : "";

  return (
    <span className={`${META_CHIP_CLASS} ${stamp} ${tone}`} title={title}>
      {label}
    </span>
  );
}
