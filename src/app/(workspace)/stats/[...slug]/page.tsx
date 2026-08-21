import { redirect } from "next/navigation";

/** `/stats/anything` → `/stats` so we never land on a workspace 404 under Stats. */
export default function StatsCatchAllPage() {
  redirect("/stats");
}
