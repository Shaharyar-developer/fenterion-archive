import {
  WorkStatus,
  WorkType,
  ChapterStatus,
  Work,
  Chapter,
} from "@/db/schema";

export type WorkOverviewWork = Work & {
  coverUrl: string | null;
};
export type WorkOverviewChapter = Chapter;

export interface WorkOverviewProps {
  work: WorkOverviewWork;
  chapters: WorkOverviewChapter[];
}
