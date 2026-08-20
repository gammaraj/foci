import { NotFoundView } from "@/components/NotFoundView";

/** In-app 404 — workspace chrome is already on screen, so skip a second full-height center. */
export default function WorkspaceNotFound() {
  return <NotFoundView embedded />;
}
