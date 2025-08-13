import { WorkStatus, ChapterStatus } from "@/db/schema";

export const WORK_STATUS_META: Record<
  WorkStatus,
  { label: string; className: string }
> = {
  [WorkStatus.DRAFT]: {
    label: "Draft",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 ring-1 ring-amber-300/40 dark:ring-amber-400/30",
  },
  [WorkStatus.PUBLISHED]: {
    label: "Published",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 ring-1 ring-emerald-300/40 dark:ring-emerald-400/30",
  },
  [WorkStatus.ARCHIVED]: {
    label: "Archived",
    className:
      "bg-muted text-muted-foreground ring-1 ring-border/60 dark:ring-border/40",
  },
};

export const CHAPTER_STATUS_META: Record<
  ChapterStatus,
  { short: string; border: string; badge: string }
> = {
  [ChapterStatus.DRAFT]: {
    short: "draft",
    border: "before:bg-amber-400/80",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  [ChapterStatus.PUBLISHED]: {
    short: "pub",
    border: "before:bg-emerald-500/80",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  [ChapterStatus.ARCHIVED]: {
    short: "arch",
    border: "before:bg-muted-foreground/40",
    badge:
      "bg-muted text-muted-foreground dark:bg-muted/40 dark:text-muted-foreground/80",
  },
};
