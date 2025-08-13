"use client";

import { useMemo } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Cover } from "./Cover";
import { StatusStrip } from "./StatusStrip";
import { Stats } from "./Stats";
import { Header } from "./Header";
import { MetadataCard } from "./MetadataCard";
import { ChapterList } from "./ChapterList";
import { WorkStatus, ChapterStatus } from "@/db/schema";
import { WorkOverviewProps } from "./types";

export default function WorkOverview({ work, chapters }: WorkOverviewProps) {
  const publishable =
    chapters.length > 0 &&
    work.status !== WorkStatus.PUBLISHED &&
    work.status !== WorkStatus.ARCHIVED;
  const unpublishable = work.status === WorkStatus.PUBLISHED;

  const publishedChapters = chapters.filter(
    (c) => c.status === ChapterStatus.PUBLISHED
  ).length;

  const initials = useMemo(
    () =>
      work.title
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase(),
    [work.title]
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-8 p-4 lg:p-6 mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:max-w-md flex flex-col gap-4 lg:sticky lg:top-24 self-start">
            <Cover work={work} initials={initials} />
            <StatusStrip
              work={work}
              publishable={publishable}
              unpublishable={unpublishable}
            />
            <Stats
              work={work}
              chapters={chapters}
              publishedChapters={publishedChapters}
            />
          </aside>
          <main className="flex-1 flex flex-col gap-6 max-w-5xl">
            <Header work={work} />
            <MetadataCard work={work} />
            <ChapterList work={work} chapters={chapters} />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
