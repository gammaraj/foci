"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isBoostLogikInboundLink } from "@/lib/boostlogik-integration";

function BoostLogikInboundRedirectInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!isBoostLogikInboundLink(searchParams)) return;
    const qs = searchParams.toString();
    router.replace(qs ? `/app?${qs}` : "/app");
  }, [searchParams, router]);

  return null;
}

export default function BoostLogikInboundRedirect() {
  return (
    <Suspense fallback={null}>
      <BoostLogikInboundRedirectInner />
    </Suspense>
  );
}
