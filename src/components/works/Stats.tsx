"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WORK_STATUS_META } from "@/constants/work-status-meta";
import { WorkOverviewWork, WorkOverviewChapter } from "./types";
import { useChapter } from "@/hooks/use-chapter";

export function Stats({
  work,
  chapters,
  publishedChapters,
}: {
  work: WorkOverviewWork;
  chapters: WorkOverviewChapter[];
  publishedChapters: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Stats</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <Stat label="Chapters" value={chapters.length} />
        <Stat label="Published" value={publishedChapters} />
        <Stat label="Words" value={work.wordCount ?? 0} />
        <Stat label="Status" value={WORK_STATUS_META[work.status].label} />
        <Stat label="Created" value={work.createdAt.toLocaleDateString()} />
        <Stat label="Updated" value={work.updatedAt.toLocaleDateString()} />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-[10px] uppercase tracking-wide font-medium">
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
