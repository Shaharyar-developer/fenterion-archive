import { WorkType } from "@/db/schema";

export const GENERAL_TAGS: string[] = [
  "adventure",
  "drama",
  "romance",
  "mystery",
  "fantasy",
  "science fiction",
  "comedy",
  "slice of life",
  "horror",
  "suspense",
  "satire",
  "love",
  "nature",
];

// Collect all type-specific tags into a Set for fast lookup
const typeSpecificTagSet = new Set(
  Object.values({
    [WorkType.STORY]: ["coming of age", "historical", "tragedy"],
    [WorkType.SHORT_STORY]: [
      "flash fiction",
      "twist ending",
      "experimental",
      "realism",
    ],
    [WorkType.POEM]: [
      "lyric",
      "narrative",
      "haiku",
      "sonnet",
      "free verse",
      "epic",
    ],
    [WorkType.FANFICTION]: [
      "alternate universe",
      "canon divergence",
      "crossover",
      "fix-it",
      "shipping",
      "missing scenes",
      "character study",
      "episode rewrite",
    ],
  }).flat()
);

// Remove any tags from GENERAL_TAGS that are present in typeSpecificTagSet
const GENERAL_TAGS_NO_OVERLAP = GENERAL_TAGS.filter(
  (tag) => !typeSpecificTagSet.has(tag)
);

export const TYPE_SPECIFIC_TAGS: Record<WorkType, string[]> = {
  [WorkType.STORY]: ["coming of age", "historical", "tragedy"],
  [WorkType.SHORT_STORY]: [
    "flash fiction",
    "twist ending",
    "experimental",
    "realism",
  ],
  [WorkType.POEM]: [
    "lyric",
    "narrative",
    "haiku",
    "sonnet",
    "free verse",
    "epic",
  ],
  [WorkType.FANFICTION]: [
    "alternate universe",
    "canon divergence",
    "crossover",
    "fix-it",
    "shipping",
    "missing scenes",
    "character study",
    "episode rewrite",
  ],
};

export const TAGS: {
  general: string[];
} & Record<WorkType, string[]> = {
  general: GENERAL_TAGS_NO_OVERLAP,
  [WorkType.STORY]: TYPE_SPECIFIC_TAGS[WorkType.STORY],
  [WorkType.SHORT_STORY]: TYPE_SPECIFIC_TAGS[WorkType.SHORT_STORY],
  [WorkType.POEM]: TYPE_SPECIFIC_TAGS[WorkType.POEM],
  [WorkType.FANFICTION]: TYPE_SPECIFIC_TAGS[WorkType.FANFICTION],
};
export const FLAT_TAGS = Object.values(TAGS).flat();
