"use client";

import React, { Suspense } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import AppNavbar from "@/components/AppNavbar";
import { safeNextPath } from "@/lib/safe-next-path";
import { Spinner } from "@/components/ui/Spinner";

function LoginBody() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  React.useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [user, loading, router, nextPath]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" className="text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-page">
      <AppNavbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[360px]">
          <div className="text-center mb-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to sync your tasks and streaks across devices
            </p>
          </div>
          <AuthForm nextPath={nextPath} />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" className="text-blue-500" />
        </div>
      }
    >
      <LoginBody />
    </Suspense>
  );
}
