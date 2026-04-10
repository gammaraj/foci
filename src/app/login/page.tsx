"use client";

import React from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If already logged in, redirect to the app
  React.useEffect(() => {
    if (!loading && user) {
      router.replace("/app");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1a]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[360px]">
          <div className="text-center mb-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to sync your tasks and streaks across devices</p>
          </div>
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
