"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, GripVertical, Ellipsis, Trash2 } from "lucide-react";
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
import { chaptersQuery } from "@/lib/queries";
import { Skeleton } from "../ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { Chapter, Work } from "@/db/schema";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

// Utility: lightweight relative time (minutes, hours, days, months)
function formatRelativeTime(date: Date | null | undefined) {
  if (!date) return "—";
  const now = Date.now();
  const diffMs = date.getTime() - now; // negative if in past
  const absMs = Math.abs(diffMs);
  const mins = Math.round(absMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.round(months / 12);
  return `${years}y ago`;
}

export function ChapterList({
  work,
  chapters,
}: {
  work: Work;
  chapters: Chapter[];
}) {
  const { loading, run } = useAsyncAction();
  const router = useRouter();

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const title = data.title.trim();
    await run("Create Chapter Draft", async () => {
      const slug = await client.chapter.createDraft({
        workId: work.id,
        title,
      });
      router.push(ROUTES.dashboard.works.bySlugChapter(work.slug, slug));
    });
  };

  const isPending = loading;

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
              // Wrap list in TooltipProvider so individual items can show tooltips
              <TooltipProvider delayDuration={150}>
                <ul className="divide-y">
                  {chapters.map((ch) => (
                    <ChapterRow key={ch.id} work={work} chapter={ch} />
                  ))}
                </ul>
              </TooltipProvider>
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

function ChapterRow({ work, chapter }: { work: Work; chapter: Chapter }) {
  const meta = CHAPTER_STATUS_META[chapter.status];
  const createdAt = chapter.createdAt ? new Date(chapter.createdAt) : null;
  const updatedAt = chapter.updatedAt ? new Date(chapter.updatedAt) : null;
  const createdRel = formatRelativeTime(createdAt);
  const updatedRel = formatRelativeTime(updatedAt);
  const statusLabel =
    chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1);
  const aria = `Chapter ${chapter.position} ${chapter.title}, status ${statusLabel}, created ${createdRel}${updatedRel !== createdRel ? `, updated ${updatedRel}` : ""}`;

  return (
    <Link href={ROUTES.dashboard.works.bySlugChapter(work.slug, chapter.slug)}>
      <li
        aria-label={aria}
        className={cn(
          "flex items-center gap-3 px-4 py-2 group relative transition-colors", // slightly taller for extra metadata
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 border-b last:border-b-0",
          meta.border,
          "hover:bg-muted/30"
        )}
      >
        <span className="text-xs w-6 text-muted-foreground tabular-nums">
          {chapter.position}
        </span>
        <GripVertical
          className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
          aria-hidden
        />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="font-medium text-sm truncate flex items-center gap-2">
            <span className="truncate" title={chapter.title}>
              {chapter.title}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "h-4 px-1 text-[10px] rounded-sm inline-flex items-center cursor-default select-none",
                    meta.badge
                  )}
                >
                  {meta.short}
                  <span className="sr-only">Status: {statusLabel}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {statusLabel}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-[11px] leading-relaxed text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  title={createdAt ? createdAt.toLocaleString() : undefined}
                  className="inline-flex items-center text-xs gap-1.5"
                >
                  <span className="uppercase tracking-wide text-muted-foreground/70">
                    Created
                  </span>
                  {createdRel}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Created {createdAt?.toLocaleString()}
              </TooltipContent>
            </Tooltip>
            {updatedAt && updatedAt.getTime() !== createdAt?.getTime() && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    title={updatedAt.toLocaleString()}
                    className="inline-flex items-center text-xs gap-1.5"
                  >
                    <span className="uppercase tracking-wide text-muted-foreground/70">
                      Updated
                    </span>
                    {updatedRel}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Updated {updatedAt.toLocaleString()}
                </TooltipContent>
              </Tooltip>
            )}
            {chapter.wordCount > 0 && (
              <span className="text-xs text-muted-foreground">
                | {chapter.wordCount} words
              </span>
            )}
          </div>
        </div>
        <ChapterActions work={work} chapter={chapter} />
      </li>
    </Link>
  );
}

function ChapterActions({ work, chapter }: { work: Work; chapter: Chapter }) {
  const { loading, run } = useAsyncAction();
  const router = useRouter();
  const [open, setOpen] = useState(false); // alert dialog open
  const [confirmTitle, setConfirmTitle] = useState("");
  const matched = confirmTitle.trim() === chapter.title.trim();

  const handleDelete = async () => {
    await run("Delete Chapter", async () => {
      await client.chapter.delete({ workId: work.id, chapterId: chapter.id });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          variant="ghost"
          size="icon"
          aria-label="Chapter actions"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onClick={(e) => {
          // keep menu interactions from triggering parent link
          e.stopPropagation();
        }}
        align="end"
        className="w-48"
      >
        <DropdownMenuItem asChild>
          <Link
            href={ROUTES.dashboard.works.bySlugChapter(work.slug, chapter.slug)}
            className="cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            Open
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent
            onClick={(e) => e.stopPropagation()}
            className="max-w-md"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete chapter</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm">
                  <p>
                    This will permanently delete the chapter
                    <span className="font-medium"> “{chapter.title}”</span>
                    {chapter.status === "published" && (
                      <>
                        {" "}
                        and its published archive (all versions) from storage
                      </>
                    )}
                    . This action cannot be undone.
                  </p>
                  <div className="space-y-1">
                    <p>
                      Type <span className="font-bold">{chapter.title}</span> to
                      confirm deletion:
                    </p>
                    <Input
                      autoFocus
                      placeholder="Chapter title"
                      value={confirmTitle}
                      onChange={(e) => setConfirmTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && matched && !loading) {
                          e.preventDefault();
                          handleDelete();
                        }
                      }}
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setConfirmTitle("");
                }}
              >
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={!matched || !!loading}
                onClick={handleDelete}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
