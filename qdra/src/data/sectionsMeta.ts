import type { SectionMeta } from "../types";

export const TOTAL_SECTIONS = 250

function pad3(n: number) {
  return n.toString().padStart(3, "0");
}

export const sectionsMeta: SectionMeta[] = Array.from(
  { length: TOTAL_SECTIONS },
  (_, i) => {
    const id = i + 1;

    return {
      id,
      name: `القسم ${id}`,
      category: "",
      fileId: pad3(id),
    };
  }
);

export function getSectionMetaById(id: number) {
  return sectionsMeta.find((s) => s.id === id);
}