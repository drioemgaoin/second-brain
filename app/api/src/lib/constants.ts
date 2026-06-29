export const AREAS = [
  "ai-learning",
  "quantum-physics",
  "hiring",
  "others",
] as const;

export type Area = (typeof AREAS)[number];
