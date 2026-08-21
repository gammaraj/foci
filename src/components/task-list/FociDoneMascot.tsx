import { doneMascotSmile } from "@/lib/done-today";
import { FociDot, type FociDotMood } from "@/components/FociDot";

function moodFromProgress(todayCount: number, idleDays: number | null): FociDotMood {
  if (todayCount > 0) return "happy";
  if (doneMascotSmile(todayCount, idleDays) < -0.4) return "sad";
  return "ready";
}

/** Done-bar Beavy — mood follows today's finishes vs idle days. */
export function FociDoneMascot({
  todayCount,
  idleDays,
  size = 18,
  className = "",
}: {
  todayCount: number;
  idleDays: number | null;
  size?: number;
  className?: string;
}) {
  return (
    <FociDot
      mood={moodFromProgress(todayCount, idleDays)}
      size={size}
      className={className}
    />
  );
}
