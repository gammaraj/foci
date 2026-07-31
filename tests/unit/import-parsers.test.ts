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
      projects: [{ id: "p1", name: "Trip", createdAt: 1 }],
    });
    const { format, tasks } = detectAndParse(json, "foci.json");
    expect(format).toBe("foci");
    expect(tasks[0].title).toBe("Backup task");
  });

  it("detectAndParse maps Foci JSON projectId to projectName", () => {
    const json = JSON.stringify({
      tasks: [
        {
          id: "1",
          title: "Pack",
          projectId: "p1",
          sessions: 0,
          timeSpent: 0,
          completed: false,
        },
      ],
      projects: [{ id: "p1", name: "India Trip", createdAt: 1 }],
    });
    const { tasks } = detectAndParse(json, "foci.json");
    expect(tasks[0].projectName).toBe("India Trip");
  });

  it("detectAndParse reads Project column on generic CSV", () => {
    const csv = `Title,Project
Pack shirts,India Trip
Buy tickets,India Trip
Inbox note,`;
    const { tasks } = detectAndParse(csv, "packing.csv");
    expect(tasks).toHaveLength(3);
    expect(tasks[0].projectName).toBe("India Trip");
    expect(tasks[2].projectName).toBeUndefined();
  });

  it("detectAndParse ignores Project ID column when naming projects", () => {
    const csv = `Title,Project ID
Old export,__general__`;
    const { tasks } = detectAndParse(csv, "old.csv");
    expect(tasks[0].projectName).toBeUndefined();
  });

  it("detectAndParse reads Project + Task + Notes packing-list CSV", () => {
    const csv = `Project,Task,Notes
India Trip Packing,Lightweight shirts,Cotton/linen, mix short & long sleeve
India Trip Packing,Rain jacket,Monsoon season`;
    const { format, tasks } = detectAndParse(csv, "india_trip_packing_checklist.csv");
    expect(format).toBe("notion");
    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe("Lightweight shirts");
    expect(tasks[0].projectName).toBe("India Trip Packing");
    expect(tasks[0].description).toBe("Cotton/linen, mix short & long sleeve");
    expect(tasks[1].description).toBe("Monsoon season");
  });
});
