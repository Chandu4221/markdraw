/**
 * MarkDraw Deterministic Short ID Generator
 * Generates stable, short base36 IDs (e.g. "k2p", "w-a3f") from shape IDs.
 * Collision-checked against existing IDs within the document.
 */

export function fnv1a32(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

/**
 * Generates a short, readable base36 ID from a tldraw shape ID.
 * e.g. "shape:V1stGXR8_Z5jdHi6B-myT" -> "a3f"
 * Guaranteed collision-free within the provided `existing` Set.
 */
export function generateShortId(shapeId: string, existing?: Set<string>): string {
  // Clean prefix if present
  const raw = shapeId.startsWith('shape:') ? shapeId.slice(6) : shapeId;
  
  // 32-bit FNV-1a hash formatted in base36
  const hashVal = fnv1a32(raw);
  const baseStr = (hashVal % 46656).toString(36).padStart(3, '0'); // 36^3 = 46,656
  
  let candidate = baseStr;
  let counter = 2;

  if (existing) {
    while (existing.has(candidate)) {
      candidate = `${baseStr}_${counter}`;
      counter++;
    }
    existing.add(candidate);
  }

  return candidate;
}
