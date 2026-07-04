"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isWanderingHermitInboundLink } from "@/lib/wanderinghermit-integration";

function WanderingHermitInboundRedirectInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!isWanderingHermitInboundLink(searchParams)) return;
    const qs = searchParams.toString();
    router.replace(qs ? `/app?${qs}` : "/app");
  }, [searchParams, router]);

  return null;
}

export default function WanderingHermitInboundRedirect() {
  return (
    <Suspense fallback={null}>
      <WanderingHermitInboundRedirectInner />
    </Suspense>
  );
}
