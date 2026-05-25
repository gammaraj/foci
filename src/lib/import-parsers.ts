import type { Subtask } from "./types";

/** Parse a single CSV row, respecting quoted fields */
export function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCSVRow(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1).map(parseCSVRow);
  return { headers, rows };
}

export function findColumn(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.includes(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

export function normalizeDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const isoMatch = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }
  const usMatch = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    return `${usMatch[3]}-${usMatch[1].padStart(2, "0")}-${usMatch[2].padStart(2, "0")}`;
  }
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return undefined;
}

export type ParsedTask = {
  title: string;
  completed?: boolean;
  dueDate?: string;
  subtasks?: Pick<Subtask, "title" | "completed">[];
};

export function parseGoogleTasksJSON(text: string): ParsedTask[] | null {
  try {
    const data = JSON.parse(text);
    const lists = Array.isArray(data) ? data : data.items ? [data] : null;
    if (!lists) return null;

    const results: ParsedTask[] = [];
    for (const list of lists) {
      const items = list.items || list;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (!item.title && !item.name) continue;
        results.push({
          title: (item.title || item.name || "").trim(),
          completed: item.status === "completed" || item.completed === true,
          dueDate: normalizeDate(item.due || item.dueDate),
        });
      }
    }
    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}

export function parseFociJSON(text: string): ParsedTask[] | null {
  try {
    const data = JSON.parse(text);
    const tasks: unknown[] = Array.isArray(data) ? data : data.tasks;
    if (!Array.isArray(tasks)) return null;

    const first = tasks[0] as Record<string, unknown>;
    if (!first || (!("projectId" in first) && !("sessions" in first) && !("timeSpent" in first))) {
      return null;
    }

    return (tasks as Record<string, unknown>[]).map((t) => ({
      title: String(t.title || ""),
      completed: Boolean(t.completed),
      dueDate: t.dueDate ? String(t.dueDate) : undefined,
      subtasks: Array.isArray(t.subtasks)
        ? (t.subtasks as Record<string, unknown>[]).map((s) => ({
            title: String(s.title || ""),
            completed: Boolean(s.completed),
          }))
        : undefined,
    }));
  } catch {
    return null;
  }
}

export function parseTodoistCSV(headers: string[], rows: string[][]): ParsedTask[] | null {
  const contentIdx = findColumn(headers, "content", "task name", "task_name");
  if (contentIdx === -1) return null;
  const dueDateIdx = findColumn(headers, "due date", "due_date", "deadline");
  const completedIdx = findColumn(headers, "is completed", "is_completed", "completed");
  const typeIdx = findColumn(headers, "type");

  if (typeIdx === -1 && !headers.some((h) => h.includes("content"))) return null;

  return rows
    .filter((r) => {
      if (typeIdx !== -1 && r[typeIdx] && r[typeIdx].toLowerCase() !== "task") return false;
      return r[contentIdx]?.trim();
    })
    .map((r) => ({
      title: r[contentIdx].trim(),
      completed: completedIdx !== -1 ? r[completedIdx] === "1" || r[completedIdx]?.toLowerCase() === "true" : false,
      dueDate: dueDateIdx !== -1 ? normalizeDate(r[dueDateIdx]) : undefined,
    }));
}

export function parseAsanaCSV(headers: string[], rows: string[][]): ParsedTask[] | null {
  const nameIdx = findColumn(headers, "name", "task name");
  if (nameIdx === -1) return null;
  const dueDateIdx = findColumn(headers, "due date", "due_date", "deadline");
  const completedIdx = findColumn(headers, "completed", "completed at", "completed_at");
  const sectionIdx = findColumn(headers, "section", "column");
  const assigneeIdx = findColumn(headers, "assignee");
  if (sectionIdx === -1 && assigneeIdx === -1) return null;

  return rows
    .filter((r) => r[nameIdx]?.trim())
    .map((r) => ({
      title: r[nameIdx].trim(),
      completed: completedIdx !== -1 ? Boolean(r[completedIdx]?.trim()) : false,
      dueDate: dueDateIdx !== -1 ? normalizeDate(r[dueDateIdx]) : undefined,
    }));
}

export function parseNotionCSV(headers: string[], rows: string[][]): ParsedTask[] | null {
  const nameIdx = findColumn(headers, "name", "title", "task");
  if (nameIdx === -1) return null;
  const statusIdx = findColumn(headers, "status", "state");
  const dueDateIdx = findColumn(headers, "due", "date", "deadline");

  return rows
    .filter((r) => r[nameIdx]?.trim())
    .map((r) => {
      const status = statusIdx !== -1 ? r[statusIdx]?.toLowerCase() : "";
      return {
        title: r[nameIdx].trim(),
        completed: status === "done" || status === "completed" || status === "complete",
        dueDate: dueDateIdx !== -1 ? normalizeDate(r[dueDateIdx]) : undefined,
      };
    });
}

export function parseGenericCSV(headers: string[], rows: string[][]): ParsedTask[] | null {
  const nameIdx = findColumn(headers, "title", "name", "task", "summary", "subject", "description", "to-do", "todo");
  if (nameIdx === -1) return null;
  const dueDateIdx = findColumn(headers, "due", "date", "deadline");
  const completedIdx = findColumn(headers, "completed", "done", "status", "complete");

  return rows
    .filter((r) => r[nameIdx]?.trim())
    .map((r) => {
      let completed = false;
      if (completedIdx !== -1) {
        const val = r[completedIdx]?.toLowerCase() || "";
        completed = val === "true" || val === "1" || val === "yes" || val === "done" || val === "completed" || val === "complete";
      }
      return {
        title: r[nameIdx].trim(),
        completed,
        dueDate: dueDateIdx !== -1 ? normalizeDate(r[dueDateIdx]) : undefined,
      };
    });
}

export type DetectedFormat = "foci" | "google-tasks" | "todoist" | "asana" | "notion" | "csv" | "unknown";

export function detectAndParse(
  text: string,
  fileName: string,
): { format: DetectedFormat; tasks: ParsedTask[] } {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "json" || text.trimStart().startsWith("{") || text.trimStart().startsWith("[")) {
    const foci = parseFociJSON(text);
    if (foci) return { format: "foci", tasks: foci };
    const google = parseGoogleTasksJSON(text);
    if (google) return { format: "google-tasks", tasks: google };
  }

  if (ext === "csv" || text.includes(",")) {
    const { headers, rows } = parseCSV(text);
    if (headers.length === 0) return { format: "unknown", tasks: [] };

    const todoist = parseTodoistCSV(headers, rows);
    if (todoist && todoist.length > 0) return { format: "todoist", tasks: todoist };

    const asana = parseAsanaCSV(headers, rows);
    if (asana && asana.length > 0) return { format: "asana", tasks: asana };

    const notion = parseNotionCSV(headers, rows);
    if (notion && notion.length > 0) return { format: "notion", tasks: notion };

    const generic = parseGenericCSV(headers, rows);
    if (generic && generic.length > 0) return { format: "csv", tasks: generic };
  }

  return { format: "unknown", tasks: [] };
}

export const FORMAT_LABELS: Record<DetectedFormat, string> = {
  foci: "Foci",
  "google-tasks": "Google Tasks",
  todoist: "Todoist",
  asana: "Asana",
  notion: "Notion",
  csv: "CSV",
  unknown: "Unknown",
};
