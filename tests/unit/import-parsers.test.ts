import { describe, it, expect } from "vitest";
import {
  parseCSVRow,
  normalizeDate,
  detectAndParse,
  parseTodoistCSV,
  parseCSV,
} from "@/lib/import-parsers";

describe("import-parsers", () => {
  it("parseCSVRow handles quoted commas", () => {
    expect(parseCSVRow('"Hello, world",done')).toEqual(["Hello, world", "done"]);
  });

  it("normalizeDate parses ISO and US formats", () => {
    expect(normalizeDate("2026-5-3")).toBe("2026-05-03");
    expect(normalizeDate("5/3/2026")).toBe("2026-05-03");
  });

  it("detectAndParse recognizes Todoist CSV", () => {
    const csv = `Type,Content,Due Date,Is Completed
task,Write tests,2026-05-20,0
task,Deploy,2026-05-21,1`;
    const { format, tasks } = detectAndParse(csv, "todoist.csv");
    expect(format).toBe("todoist");
    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe("Write tests");
    expect(tasks[0].dueDate).toBe("2026-05-20");
  });

  it("parseTodoistCSV skips non-task rows", () => {
    const { headers, rows } = parseCSV(`Type,Content
section,Work
task,Real task`);
    const parsed = parseTodoistCSV(headers, rows);
    expect(parsed).toHaveLength(1);
    expect(parsed![0].title).toBe("Real task");
  });

  it("detectAndParse recognizes Foci JSON", () => {
    const json = JSON.stringify({
      tasks: [{ id: "1", title: "Backup task", projectId: "general", sessions: 0, timeSpent: 0, completed: false }],
    });
    const { format, tasks } = detectAndParse(json, "foci.json");
    expect(format).toBe("foci");
    expect(tasks[0].title).toBe("Backup task");
  });
});
