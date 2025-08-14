"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, GripVertical, Edit, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkOverviewWork, WorkOverviewChapter } from "./types";
import { CHAPTER_STATUS_META } from "@/constants/work-status-meta";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { CreateDraftForm, formSchema } from "../forms/create-draft";
import z from "zod";
import { useAsyncAction } from "@/hooks/use-async-action";
import { client } from "@/lib/orpc.client";
import { useRouter } from "next/navigation";
import { userChaptersQuery } from "@/lib/queries";
import { Skeleton } from "../ui/skeleton";

export function ChapterList({
  work,
  chapters,
}: {
  work: WorkOverviewWork;
  chapters: WorkOverviewChapter[];
}) {
  const { loading, run } = useAsyncAction();
  const router = useRouter();
  const { data, isPending } = userChaptersQuery(work.id);

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const title = data.title.trim();
    await run("Create Chapter Draft", async () => {
      await client.chapter.createDraft({
        workId: work.id,
        title,
      });
    });
  };

  return (
    <Card className="h-full">
      <Popover>
        <CardHeader className="pb-2 flex flex-row items-center justify-between pr-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Chapters
          </CardTitle>
          {chapters.length > 0 && (
            <PopoverTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> <span className="">Add</span>
              </Button>
            </PopoverTrigger>
          )}
        </CardHeader>
        {isPending ? (
          <>
            <Skeleton className="h-full w-full" />
          </>
        ) : (
          <CardContent className="p-0">
            {chapters.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground flex flex-col gap-4 items-start">
                <div>
                  <p className="font-medium text-foreground mb-1">
                    No chapters yet
                  </p>
                  <p className="text-xs leading-relaxed max-w-sm">
                    Start by creating your first chapter. Once you have content
                    you can publish the work.
                  </p>
                </div>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                    <span className="">Create first chapter</span>
                  </Button>
                </PopoverTrigger>
              </div>
            ) : (
              <ul className="divide-y">
                {chapters.map((ch) => (
                  <ChapterRow key={ch.id} work={work} chapter={ch} />
                ))}
              </ul>
            )}
          </CardContent>
        )}
        <PopoverContent className="w-full">
          <CreateDraftForm onSubmit={handleSubmit} loading={!!loading} />
        </PopoverContent>
      </Popover>
    </Card>
  );
}

function ChapterRow({
  work,
  chapter,
}: {
  work: WorkOverviewWork;
  chapter: WorkOverviewChapter;
}) {
  const meta = CHAPTER_STATUS_META[chapter.status];
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-1 group relative",
        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 border-b last:border-b-0",
        meta.border
      )}
    >
      <span className="text-xs w-6 text-muted-foreground tabular-nums">
        {chapter.position}
      </span>
      <GripVertical
        className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate flex items-center gap-2">
          {chapter.title}
          <span
            className={cn(
              "h-4 px-1 text-[10px] rounded-sm inline-flex items-center",
              meta.badge
            )}
          >
            {meta.short}
          </span>
        </div>
        <div className="text-xs text-muted-foreground flex gap-2">
          <span>
            Created:{" "}
            {chapter.createdAt
              ? new Date(chapter.createdAt).toLocaleDateString()
              : "—"}
          </span>
          <span>
            Updated:{" "}
            {chapter.updatedAt
              ? new Date(chapter.updatedAt).toLocaleDateString()
              : "—"}
          </span>
        </div>
      </div>
      <ChapterActions />
    </li>
  );
}

function ChapterActions() {
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Chapter actions"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
      >
        <span className="sr-only">Actions</span>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </Button>
      {/* Implement dropdown menu for actions if needed */}
    </div>
  );
}
