import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

/** Server-only gate for /admin. Returns the signed-in allowlisted user. */
export async function requireAdmin(nextPath = "/admin") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${nextPath}`);
  }
  if (!isAdminEmail(user.email)) {
    redirect("/app");
  }
  return user;
}
