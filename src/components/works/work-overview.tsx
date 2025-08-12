"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Plus,
  Upload,
  Loader2,
  BookOpen,
  Check,
  ArchiveRestore,
  GripVertical,
  Tags as TagsIcon,
  Info,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { WorkStatus, WorkType, ChapterStatus } from "@/db/schema";
import { cn } from "@/lib/utils";

// simple boolean hook
function useBoolean(initial = false) {
  const [value, setValue] = useState(initial);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  return { value, setTrue, setFalse } as const;
}

// generic async action helper
function useAsyncAction() {
  const actionRef = useRef<null | string>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const run = useCallback(
    async (label: string, fn: () => Promise<void> | void) => {
      actionRef.current = label;
      setLoading(label);
      const id = toast.loading(`${label}...`);
      try {
        await fn();
        toast.success(`${label} complete`);
      } catch (e) {
        toast.error(`${label} failed`);
      } finally {
        toast.dismiss(id);
        setLoading(null);
      }
    },
    []
  );
  return { run, loading } as const;
}

// status style helpers
const WORK_STATUS_META: Record<
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

const CHAPTER_STATUS_META: Record<
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

// Types expected from server
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

interface Props {
  work: WorkOverviewWork;
  chapters: WorkOverviewChapter[];
}

export default function WorkOverview({ work, chapters }: Props) {
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
          <aside className="w-full lg:w-96 flex flex-col gap-4 lg:sticky lg:top-24 self-start">
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

function Cover({
  work,
  initials,
}: {
  work: WorkOverviewWork;
  initials: string;
}) {
  if (work.coverUrl) {
    return (
      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border bg-muted relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={work.coverUrl}
          alt={`Cover image for ${work.title}`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "aspect-[3/4] w-full rounded-lg border flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary/5 via-muted to-background",
        "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_1px_1px,oklch(var(--foreground)_/_0.12)_1px,transparent_0)] before:[background-size:22px_22px]"
      )}
    >
      <BookOpen
        className="absolute -top-6 -right-6 h-40 w-40 text-foreground/5"
        aria-hidden
      />
      <span className="text-4xl font-semibold tracking-tight text-foreground/30 select-none">
        {initials}
      </span>
    </div>
  );
}

function StatusStrip({
  work,
  publishable,
  unpublishable,
}: {
  work: WorkOverviewWork;
  publishable: boolean;
  unpublishable: boolean;
}) {
  const meta = WORK_STATUS_META[work.status];
  const { run, loading } = useAsyncAction();
  const publishing = loading === "Publish";
  const deleting = loading === "Delete";
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Badge
        variant="secondary"
        className="uppercase tracking-wide px-2 py-1 text-[10px]"
      >
        {work.type.replace(/_/g, " ")}
      </Badge>
      <span
        className={cn(
          "text-[11px] font-medium px-2 py-1 rounded-md inline-flex items-center gap-1",
          meta.className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" /> {meta.label}
      </span>
      <span className="text-xs text-muted-foreground ml-auto">
        Updated {work.updatedAt.toLocaleDateString()}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className=" ml-1"
            aria-label="Work actions"
          >
            Actions <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenuItem
                  className="gap-2"
                  disabled={!publishable || publishing}
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!publishable || publishing) return;
                    run(
                      "Publish",
                      async () => await new Promise((r) => setTimeout(r, 800))
                    );
                  }}
                >
                  {publishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Publish
                </DropdownMenuItem>
              </div>
            </TooltipTrigger>
            {!publishable && (
              <TooltipContent side="left" className="max-w-xs">
                {work.status === WorkStatus.PUBLISHED
                  ? "Already published"
                  : work.status === WorkStatus.ARCHIVED
                    ? "Archived works cannot be published"
                    : "Add at least one chapter before publishing."}
              </TooltipContent>
            )}
          </Tooltip>
          <DropdownMenuItem
            className="gap-2"
            onSelect={(e) => e.preventDefault()}
          >
            <Upload className="h-4 w-4" /> Cover
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onSelect={(e) => e.preventDefault()}
          >
            <Edit className="h-4 w-4" /> Edit
          </DropdownMenuItem>
          {unpublishable && (
            <DropdownMenuItem
              className="gap-2"
              onSelect={(e) => e.preventDefault()}
            >
              <ArchiveRestore className="h-4 w-4" /> Unpublish
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="gap-2"
            onSelect={(e) => e.preventDefault()}
          >
            <BookOpen className="h-4 w-4" /> Preview
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              setDeleteOpen(true);
            }}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete work?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the
              work and its chapters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                run(
                  "Delete",
                  async () => await new Promise((r) => setTimeout(r, 800))
                )
              }
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stats({
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

function Header({ work }: { work: WorkOverviewWork }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-semibold leading-tight tracking-tight">
        {work.title}
      </h1>
      <div className="text-muted-foreground text-sm">/{work.slug}</div>
    </div>
  );
}

function MetadataCard({ work }: { work: WorkOverviewWork }) {
  const tagsEmpty = !work.tags || Object.keys(work.tags).length === 0;
  const tagEntries = useMemo(
    () =>
      work.tags
        ? Object.entries(work.tags).flatMap(([group, vals]) =>
            vals.map((value) => ({ group, value }))
          )
        : [],
    [work.tags]
  );
  return (
    <Card className="w-3xl h-full">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between pr-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4" /> Metadata
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <div className="text-xs font-semibold mb-2">Description</div>
          {work.description ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
                {work.description}
              </p>
            </div>
          ) : (
            <div className="border border-dashed rounded-md p-4 text-sm flex items-center justify-between text-muted-foreground">
              <span>No description added yet.</span>
              <Button size="sm" variant="ghost" className="h-7 px-2">
                Add
              </Button>
            </div>
          )}
        </div>
        <div>
          <div className="text-xs font-semibold mb-2">Tags</div>
          {tagsEmpty ? (
            <div className="border border-dashed rounded-md p-4 text-sm flex items-center justify-between text-muted-foreground">
              <span>No tags</span>
              <Button size="sm" variant="ghost" className="h-7 px-2">
                Add
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tagEntries.map((t) => (
                <Badge
                  key={`${t.group}:${t.value}`}
                  variant="outline"
                  className="gap-1"
                >
                  <span className="text-muted-foreground">{t.group}:</span>{" "}
                  {t.value}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ChapterList({
  work,
  chapters,
}: {
  work: WorkOverviewWork;
  chapters: WorkOverviewChapter[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between pr-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Chapters
        </CardTitle>
        <Button size="sm">
          <Plus className="h-4 w-4" /> <span className="ml-1">Add</span>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {chapters.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground flex flex-col gap-4 items-start">
            <div>
              <p className="font-medium text-foreground mb-1">
                No chapters yet
              </p>
              <p className="text-xs leading-relaxed max-w-sm">
                Start by creating your first chapter. Once you have content you
                can publish the work.
              </p>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />{" "}
              <span className="ml-1">Create first chapter</span>
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {chapters.map((ch) => (
              <ChapterRow key={ch.id} work={work} chapter={ch} />
            ))}
          </ul>
        )}
      </CardContent>
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
        "flex items-center gap-3 px-4 py-3 group relative",
        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5",
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
        <div className="text-xs text-muted-foreground">
          /{work.slug}/{chapter.slug}
        </div>
      </div>
      <ChapterActions />
    </li>
  );
}

function ChapterActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Chapter actions"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="gap-2">
          <Edit className="h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Eye className="h-4 w-4" /> Preview
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
