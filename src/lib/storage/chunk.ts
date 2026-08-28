/** PostgREST / gateway payload safety for bulk upserts. */
export const UPSERT_CHUNK_SIZE = 200;

export function chunkArray<T>(items: T[], size: number = UPSERT_CHUNK_SIZE): T[][] {
  if (size <= 0) {
    throw new Error("chunk size must be positive");
  }
  if (items.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
