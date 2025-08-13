import { WorkStatus, WorkType, ChapterStatus } from "@/db/schema";

export interface WorkOverviewWork {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  description: string | null;
  status: WorkStatus;
  type: WorkType;
  wordCount: number | null;
  coverKey: string | null;
  coverUrl: string | null;
  tags: Record<string, string[]> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOverviewChapter {
  id: string;
  title: string;
  slug: string;
  position: number;
  status: ChapterStatus;
  published: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOverviewProps {
  work: WorkOverviewWork;
  chapters: WorkOverviewChapter[];
}
