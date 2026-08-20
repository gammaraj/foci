/** Landing preview — cropped to the task board so visitors land on “organized,” not chrome noise. */
export default function HomeAppMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <div className="rounded-t-2xl bg-slate-200/90 dark:bg-[#1a1a2e] px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white dark:bg-[#0d1117] rounded-md px-4 py-1 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-transparent">
            usefoci.com/app
          </div>
        </div>
      </div>

      <div className="rounded-b-2xl border border-slate-200 dark:border-[#1e3355] border-t-0 overflow-hidden shadow-2xl shadow-black/20 dark:shadow-black/40 bg-[#0b1121]">
        {/* eslint-disable-next-line @next/next/no-img-element -- static marketing asset */}
        <img
          src="/home-app-preview.webp"
          alt="Foci task board with projects organized as cards"
          width={1536}
          height={508}
          className="w-full h-auto block"
          decoding="async"
          fetchPriority="high"
        />
      </div>

      <div className="absolute -inset-6 bg-gradient-to-b from-blue-500/[0.06] via-transparent to-indigo-500/[0.04] rounded-3xl -z-10 blur-2xl pointer-events-none" />
    </div>
  );
}
