"use client";

import type { ProjectTemplate } from "@/lib/templates";
import { PROJECT_TEMPLATES } from "@/lib/templates";

interface ProjectTemplatePickerProps {
  onSelect: (template: ProjectTemplate) => void;
  /** Compact chips (inline add-project) vs richer cards (empty state / manage). */
  variant?: "chips" | "menu" | "cards";
  templates?: ProjectTemplate[];
  className?: string;
}

export function ProjectTemplatePicker({
  onSelect,
  variant = "chips",
  templates = PROJECT_TEMPLATES,
  className = "",
}: ProjectTemplatePickerProps) {
  const workflow = templates.filter((t) => t.category !== "finance");
  const finance = templates.filter((t) => t.category === "finance");

  if (variant === "menu") {
    return (
      <div className={className}>
        {templates.map((tpl) => (
          <button
            key={tpl.label}
            type="button"
            className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition-colors border-b border-slate-50 dark:border-[#1e3050]/50 last:border-b-0"
            onClick={() => onSelect(tpl)}
          >
            <div className="flex items-center gap-2">
              <span className="text-base flex-shrink-0">{tpl.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{tpl.label}</div>
                <div className="text-xs text-slate-400 dark:text-slate-300 truncate">
                  {tpl.tasks.length} tasks · new project
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (variant === "cards") {
    const section = (title: string, items: ProjectTemplate[]) =>
      items.length === 0 ? null : (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 px-0.5">
            {title}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {items.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => onSelect(tpl)}
                className="text-left p-3 rounded-xl border border-slate-100 dark:border-[#1e3050] hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="text-xl mb-1">{tpl.emoji}</div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-colors">
                  {tpl.label}
                </div>
                <div className="text-sm text-slate-400 dark:text-slate-300">
                  {tpl.tasks.length} tasks
                </div>
              </button>
            ))}
          </div>
        </div>
      );

    return (
      <div className={`space-y-4 ${className}`}>
        {section("Workflows", workflow)}
        {section("Financial planning", finance)}
      </div>
    );
  }

  // chips
  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs text-slate-500 dark:text-slate-400">Or start from a template:</p>
      <div className="flex flex-wrap gap-1.5">
        {templates.map((tpl) => (
          <button
            key={tpl.label}
            type="button"
            onClick={() => onSelect(tpl)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-[#243350] bg-white text-slate-700 dark:bg-[#131d30] dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-800 dark:hover:text-blue-200 transition-colors touch-target-sm"
            title={`${tpl.description} · ${tpl.tasks.length} tasks`}
          >
            {tpl.emoji} {tpl.label}
          </button>
        ))}
      </div>
    </div>
  );
}
