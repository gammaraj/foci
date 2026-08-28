import { describe, expect, it } from "vitest";
import { UPSERT_CHUNK_SIZE, chunkArray } from "@/lib/storage/chunk";
import { appendAccountSharedProjects } from "@/lib/storage/shared-projects";

describe("chunkArray", () => {
  it("returns empty for empty input", () => {
    expect(chunkArray([])).toEqual([]);
  });

  it("keeps a small array as a single chunk", () => {
    expect(chunkArray([1, 2, 3], 200)).toEqual([[1, 2, 3]]);
  });

  it("splits into fixed-size chunks", () => {
    const items = Array.from({ length: 5 }, (_, i) => i);
    expect(chunkArray(items, 2)).toEqual([[0, 1], [2, 3], [4]]);
  });

  it("uses the default upsert chunk size", () => {
    const items = Array.from({ length: UPSERT_CHUNK_SIZE + 1 }, (_, i) => i);
    const chunks = chunkArray(items);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(UPSERT_CHUNK_SIZE);
    expect(chunks[1]).toHaveLength(1);
  });
});

describe("appendAccountSharedProjects", () => {
  it("batches owner projects without duplicating project-level shares", () => {
    const result = appendAccountSharedProjects(
      [
        {
          id: "p1",
          name: "Already shared",
          createdAt: 1,
          _isShared: true,
          _ownerId: "owner-a",
          _ownerEmail: "a@example.com",
          _myRole: "viewer",
          _shareSource: "project",
        },
      ],
      [
        {
          owner_id: "owner-a",
          role: "editor",
          ownerEmail: "a@example.com",
          ownerName: "Ada",
        },
        {
          owner_id: "owner-b",
          role: "viewer",
          ownerEmail: "b@example.com",
        },
      ],
      [
        { id: "p1", user_id: "owner-a", name: "Already shared", created_at: 1 },
        { id: "p2", user_id: "owner-a", name: "Extra A", created_at: 2 },
        { id: "p3", user_id: "owner-b", name: "From B", created_at: 3 },
      ],
    );

    expect(result).toHaveLength(3);
    expect(result.find((p) => p.id === "p1")?._shareSource).toBe("project");
    expect(result.find((p) => p.id === "p2")).toMatchObject({
      name: "Extra A",
      _ownerId: "owner-a",
      _myRole: "editor",
      _shareSource: "account",
      _ownerName: "Ada",
    });
    expect(result.find((p) => p.id === "p3")).toMatchObject({
      name: "From B",
      _ownerId: "owner-b",
      _myRole: "viewer",
      _shareSource: "account",
    });
  });
});
