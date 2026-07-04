"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isCertStudInboundLink } from "@/lib/certstud-integration";

function CertStudInboundRedirectInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!isCertStudInboundLink(searchParams)) return;
    const qs = searchParams.toString();
    router.replace(qs ? `/app?${qs}` : "/app");
  }, [searchParams, router]);

  return null;
}

export default function CertStudInboundRedirect() {
  return (
    <Suspense fallback={null}>
      <CertStudInboundRedirectInner />
    </Suspense>
  );
}
