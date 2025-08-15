"use client";

import React, { useMemo } from "react";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chapter, ChapterStatus, ChapterVersion } from "@/db/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  Pencil,
  Save,
  Send,
  Archive,
  Loader2,
  AlignHorizontalSpaceAround,
  HelpCircle,
  History,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "motion/react";
import { client } from "@/lib/orpc.client";
import { toast } from "sonner";
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
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useChapter } from "@/hooks/use-chapter";
import { useQueryClient } from "@tanstack/react-query";
import { VirtualizedCombobox } from "@/components/ui/virtualized-combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface ChapterHeaderProps {
  chapter: Chapter;
  dirty?: boolean;
  saving?: boolean;
  lastSavedAt?: Date | null;
  onSave?: () => void | Promise<void>;
  saveMode?: "overwrite" | "new-version";
  onChangeSaveMode?: (mode: "overwrite" | "new-version") => void;
  workSlug: string;
}

export function ChapterHeader({
  chapter,
  dirty,
  saving,
  lastSavedAt,
  onSave,
  saveMode = "overwrite",
  onChangeSaveMode,
  workSlug,
}: ChapterHeaderProps) {
  const [title, setTitle] = useState(chapter?.title);
  const [status, setStatus] = useState<ChapterStatus | undefined>(
    chapter?.status
  );
  // fallback to DRAFT if status is undefined for safe access
  const safeStatus: ChapterStatus = status ?? ChapterStatus.DRAFT;
  const [editingTitle, setEditingTitle] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [_, __, fetch] = useBreadcrumbs();
  const [pendingStatus, setPendingStatus] = useState<ChapterStatus | null>(
    null
  );
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [confirmStatusInput, setConfirmStatusInput] = useState("");
  const [statusProgress, setStatusProgress] = useState(0); // 0-100
  const [statusProgressDone, setStatusProgressDone] = useState(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const {
    setChapter,
    currentChapterVersion,
    setCurrentChapterVersion,
    prevChapterVersions,
    setPrevChapterVersions,
  } = useChapter();
  const queryClient = useQueryClient();

  useEffect(() => {
    setTitle(chapter.title);
    setStatus(chapter.status);
  }, [chapter.id, chapter.title, chapter.status]);

  // Improved persistTitle to queue saves if user types fast
  const persistTitle = useCallback(
    async (overrideTitle?: string) => {
      const currentTitle = overrideTitle ?? title;
      if (currentTitle.trim() === "" || currentTitle === chapter.title) {
        setEditingTitle(false);
        setTitle((t) => t || chapter.title);
        setPendingTitle(null);
        return;
      }
      if (savingTitle) {
        setPendingTitle(currentTitle);
        return;
      }
      setSavingTitle(true);
      try {
        await client.chapter.update({
          id: chapter.id,
          title: currentTitle.trim(),
          workId: chapter.workId,
        });
        toast.success("Chapter title saved.");
        await fetch();
        // Optimistically update context & invalidate queries
        setChapter((prev) =>
          prev ? { ...prev, title: currentTitle.trim() } : prev
        );
        queryClient.invalidateQueries({
          queryKey: ["chapterAndVersions", chapter.slug],
        });
      } catch (error) {
        toast.error("Failed to save chapter title.");
        setTitle(chapter.title);
      }
      setSavingTitle(false);
      setEditingTitle(false);
      // If a new title was queued while saving, persist it now
      if (pendingTitle && pendingTitle !== currentTitle) {
        const next = pendingTitle;
        setPendingTitle(null);
        void persistTitle(next);
      } else {
        setPendingTitle(null);
      }
    },
    [
      title,
      chapter.title,
      chapter.id,
      chapter.workId,
      savingTitle,
      fetch,
      pendingTitle,
    ]
  );

  const statusMeta: Record<ChapterStatus, { label: string; variant: string }> =
    {
      [ChapterStatus.DRAFT]: { label: "Draft", variant: "outline" },
      [ChapterStatus.PUBLISHED]: { label: "Published", variant: "primary" },
      [ChapterStatus.ARCHIVED]: { label: "Archived", variant: "secondary" },
    } as const;

  const requestStatusChange = (next: ChapterStatus) => {
    if (next === status || changingStatus) return;
    setPendingStatus(next);
    setConfirmStatusOpen(true);
    setConfirmStatusInput("");
  };

  const executeStatusChange = async () => {
    if (!pendingStatus || pendingStatus === status) {
      setConfirmStatusOpen(false);
      return;
    }
    const next = pendingStatus;
    const label = statusMeta[next].label;

    const perform = async () => {
      setChangingStatus(true);
      setStatusProgress(0);
      setStatusProgressDone(false);
      const startTime = performance.now();
      const minTotalDuration = 2200; // ms – faked longer than API call
      const rampAfterDoneDelay = 300; // delay before final 100%

      // artificial progress (capped at 85% until request finishes)
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        setStatusProgress((prev) => {
          const cap = statusProgressDone ? 100 : 85;
          if (prev >= cap) return prev;
          const increment = Math.random() * 7 + 4; // 4-11%
          return Math.min(cap, prev + increment);
        });
      }, 220);

      let success = false;
      try {
        if (
          chapter.status === ChapterStatus.PUBLISHED &&
          next !== ChapterStatus.PUBLISHED
        ) {
          await client.chapter.unpublish({
            chapterId: chapter.id,
            workId: chapter.workId,
          });
        }
        if (next === ChapterStatus.PUBLISHED) {
          await client.chapter.publish({
            chapterId: chapter.id,
            workId: chapter.workId,
          });
        } else {
          await client.chapter.update({
            id: chapter.id,
            workId: chapter.workId,
            status: next,
          });
        }
        setStatus(next);
        // Update context & invalidate to refetch hydrated content / status
        setChapter((prev) => (prev ? { ...prev, status: next } : prev));
        queryClient.invalidateQueries({
          queryKey: ["chapterAndVersions", chapter.slug],
        });
        success = true;
      } catch (error) {
        success = false;
      }

      setStatusProgressDone(true);
      const elapsed = performance.now() - startTime;
      const remainingTotal = minTotalDuration - elapsed;
      if (remainingTotal > 0) {
        await new Promise((r) => setTimeout(r, remainingTotal));
      }
      setStatusProgress((prev) => (prev < 90 ? 90 : prev));
      await new Promise((r) => setTimeout(r, rampAfterDoneDelay));
      setStatusProgress(100);
      await new Promise((r) => setTimeout(r, 350));

      // cleanup visual state
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setChangingStatus(false);
      setConfirmStatusOpen(false);
      setPendingStatus(null);
      setConfirmStatusInput("");
      setTimeout(() => {
        setStatusProgress(0);
        setStatusProgressDone(false);
      }, 400);

      if (!success) throw new Error(`Failed to set status to ${label}.`);
      return { label };
    };

    toast.promise(perform(), {
      loading: `Changing status to ${label}…`,
      success: ({ label }) => `${label} status applied`,
      error: (err) => err.message || `Failed to change status`,
    });
  };

  // Reset typed confirmation when dialog closes without action
  useEffect(() => {
    if (!confirmStatusOpen) {
      setConfirmStatusInput("");
    }
  }, [confirmStatusOpen]);

  // Cleanup any running interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Keyboard UX for title edit
  useEffect(() => {
    if (!editingTitle) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTitle(chapter.title);
        setEditingTitle(false);
      }
      if (e.key === "Enter" && !e.metaKey) {
        e.preventDefault();
        void persistTitle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingTitle, chapter.title, persistTitle]);

  const statusColor: Record<ChapterStatus, string> = {
    [ChapterStatus.DRAFT]: "bg-amber-500/70",
    [ChapterStatus.PUBLISHED]: "bg-emerald-500/80",
    [ChapterStatus.ARCHIVED]: "bg-slate-400/70 dark:bg-slate-500/60",
  } as const;

  const saveStateLabel = dirty
    ? "Unsaved changes"
    : saving
      ? "Saving…"
      : lastSavedAt
        ? `Saved at ${lastSavedAt.toLocaleTimeString()}`
        : "Loaded";

  // Build version list (current first, then previous) for selector
  // Build unified version list ensuring current always included and others unique.
  const versions = useMemo(() => {
    const others = prevChapterVersions
      .filter((v) => v.id !== currentChapterVersion?.id)
      .sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0));
    return [
      ...(currentChapterVersion ? [currentChapterVersion] : []),
      ...others,
    ];
  }, [currentChapterVersion, prevChapterVersions]);
  const versionOptions = versions.map((v, idx) => ({
    value: v.id,
    label: `v${v?.versionNumber ?? "?"}`,
    meta: {
      versionNumber: v.versionNumber,
      updatedAt: v.updatedAt,
      createdAt: v.createdAt,
      wordCount: chapter.wordCount, // chapter wordCount corresponds to current; per-version count not stored unless embedded; fallback
      isCurrent: v.id === currentChapterVersion?.id,
    },
  }));
  const currentSelectedVersionId = currentChapterVersion?.id || "";

  const handleSelectVersion = (id: string) => {
    if (!id) return; // ignore clearing for now
    const selected = versions.find((v) => v.id === id);
    if (!selected) return;
    if (selected.id === currentChapterVersion?.id) return;
    // Move old current into prev list if not already there
    if (currentChapterVersion) {
      setPrevChapterVersions((prev) => {
        const withoutSelected = prev.filter((v) => v.id !== selected.id);
        const already = withoutSelected.some(
          (v) => v.id === currentChapterVersion.id
        );
        return already
          ? withoutSelected
          : [currentChapterVersion, ...withoutSelected];
      });
    }
    // Remove selected from prev list and set as current
    setPrevChapterVersions((prev) => prev.filter((v) => v.id !== selected.id));
    setCurrentChapterVersion(selected);
  };

  return (
    <div>
      <motion.div
        layout
        variants={{
          readable: { paddingLeft: 0, paddingRight: 0 },
          "max-width": { paddingLeft: 0, paddingRight: 0 },
        }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className={cn(
          "sticky top-12  z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70",
          "bg-background/80",
          "shadow-sm"
        )}
      >
        <div className="flex flex-col gap-1 px-3 py-2 md:px-6 md:py-3">
          {/* Top row: left (title), right (actions: save, status, position, view mode) */}
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-0 relative flex-1">
              <AnimatePresence mode="wait" initial={false}>
                <div className="flex items-center justify-center max-h-max">
                  {editingTitle ? (
                    <motion.form
                      key="title-edit"
                      layout
                      onSubmit={(e) => {
                        e.preventDefault();
                        void persistTitle();
                      }}
                      className="flex items-center gap-2 min-w-0"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.18,
                          ease: [0.25, 0.1, 0.25, 1],
                        },
                      }}
                      exit={{
                        opacity: 0,
                        y: -4,
                        transition: { duration: 0.12 },
                      }}
                    >
                      <motion.div layout className="min-w-0">
                        <Input
                          ref={titleInputRef}
                          autoFocus
                          value={title}
                          aria-label="Chapter title"
                          onChange={(e) => setTitle(e.target.value)}
                          onBlur={() => void persistTitle()}
                          className={cn(
                            "h-10 text-lg font-semibold px-3",
                            "focus-visible:ring-0 focus-visible:outline-none",
                            "border-transparent bg-transparent focus:border-primary/40 focus:ring-0 transition-[width,font-size] duration-200"
                          )}
                        />
                      </motion.div>
                      <motion.div layout>
                        <Button
                          size="sm"
                          variant="outline"
                          type="submit"
                          disabled={savingTitle}
                          aria-label="Save chapter title"
                          className="h-9 px-3 gap-1"
                        >
                          {savingTitle ? (
                            <Loader2 className="animate-spin size-4" />
                          ) : (
                            <Save className="size-4" />
                          )}
                          <span className="sr-only">Save title</span>
                        </Button>
                      </motion.div>
                    </motion.form>
                  ) : (
                    <motion.button
                      key="title-display"
                      layout
                      onClick={() => setEditingTitle(true)}
                      aria-label="Edit chapter title"
                      className="group text-left px-1 -mx-1 rounded-md hover:bg-accent/50 flex items-center gap-2 min-w-0"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.18,
                          ease: [0.25, 0.1, 0.25, 1],
                        },
                      }}
                      exit={{
                        opacity: 0,
                        y: -4,
                        transition: { duration: 0.12 },
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <motion.h1
                        layout
                        className="text-xl md:text-2xl font-semibold tracking-tight leading-none truncate max-w-[clamp(16ch,60vw,720px)] transition-[font-size] duration-200"
                      >
                        {title || "Untitled Chapter"}
                      </motion.h1>
                      <Pencil className="size-4 opacity-0 group-hover:opacity-70 transition-opacity" />
                    </motion.button>
                  )}
                  {/* Version selector row */}
                  {chapter.status !== ChapterStatus.PUBLISHED &&
                    versionOptions.length > 1 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size={"sm"}
                                aria-label="Version details"
                              >
                                Versions <History className="size-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-xs p-3 space-y-2"
                              align="start"
                            >
                              <div className="text-sm font-medium">
                                Version details
                              </div>
                              <div className="max-h-80 overflow-auto pr-1 space-y-2 text-xs">
                                {versions.map((v) => {
                                  const isCurrent =
                                    v.id === currentChapterVersion?.id;
                                  const meta = versionOptions.find(
                                    (o) => o.value === v.id
                                  )?.meta;
                                  return (
                                    <div
                                      key={v.id}
                                      className="border rounded-md p-2 bg-muted/40 flex flex-col gap-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold">
                                          v
                                          {meta?.versionNumber ??
                                            v.versionNumber ??
                                            "?"}
                                        </span>
                                        {isCurrent && (
                                          <Badge
                                            variant="outline"
                                            className="text-[10px]"
                                          >
                                            current
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 gap-x-2 gap-y-[2px]">
                                        <span className="text-muted-foreground">
                                          Created
                                        </span>
                                        <span>
                                          {v.createdAt
                                            ? format(
                                                new Date(v.createdAt),
                                                "LLL do hh:mm:ss"
                                              )
                                            : "—"}
                                        </span>
                                        <span className="text-muted-foreground">
                                          Updated
                                        </span>
                                        <span>
                                          {v.updatedAt
                                            ? format(
                                                new Date(v.updatedAt),
                                                "LLL do hh:mm:ss"
                                              )
                                            : "—"}
                                        </span>
                                      </div>
                                      {!isCurrent && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-6 mt-1 text-[11px] px-2"
                                          onClick={() =>
                                            handleSelectVersion(v.id)
                                          }
                                        >
                                          View this version
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Selecting a version switches the editor content.
                                Only the current version can be edited; others
                                are read-only until promoted by saving a new
                                version.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    )}
                </div>
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 md:gap-3 pl-2">
              <AnimatePresence initial={false}>
                {dirty && (
                  <motion.div
                    key="save-btn"
                    layout
                    initial={{ opacity: 0, scale: 0.9, x: 8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: 0,
                      transition: { duration: 0.16 },
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      x: 8,
                      transition: { duration: 0.12 },
                    }}
                    className="flex"
                  >
                    <Button
                      disabled={saving}
                      size={"default"}
                      variant={"outline"}
                      className="rounded-r-none w-20"
                      onClick={() => {
                        if (onSave) void onSave();
                      }}
                    >
                      Save
                      {saving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={saving}
                          className="hover:shadow transition-shadow flex items-center rounded-l-none justify-cente"
                        >
                          <ChevronDown className="size-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuItem
                          onClick={() => onChangeSaveMode?.("overwrite")}
                          className="flex items-center gap-2 text-xs"
                        >
                          {saveMode === "overwrite" && (
                            <Check className="size-3" />
                          )}
                          <span>Save & Overwrite (default)</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onChangeSaveMode?.("new-version")}
                          className="flex items-center gap-2 text-xs"
                        >
                          {saveMode === "new-version" && (
                            <Check className="size-3" />
                          )}
                          <span>Save as New Version</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                )}
              </AnimatePresence>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={"ghost"}
                    aria-label="Change chapter status"
                    className={cn(
                      "h-9 px-2 gap-2 relative",
                      changingStatus && "pointer-events-none opacity-70"
                    )}
                  >
                    <motion.span
                      key={changingStatus ? "changing" : status}
                      layoutId="chapter-status-dot"
                      className={cn(
                        "size-2 rounded-full",
                        changingStatus
                          ? "bg-primary animate-pulse"
                          : statusColor[safeStatus],
                        "shadow-inner"
                      )}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        transition: {
                          type: "spring",
                          stiffness: 260,
                          damping: 18,
                        },
                      }}
                    />
                    <motion.span layout className="flex">
                      <Badge
                        variant={statusMeta[safeStatus].variant as any}
                        className={cn(
                          "text-[11px] px-2 py-0.5 border bg-transparent leading-none flex items-center gap-1",
                          safeStatus === ChapterStatus.DRAFT &&
                            "border-amber-500/40 text-amber-700 dark:text-amber-300",
                          safeStatus === ChapterStatus.ARCHIVED && "opacity-70"
                        )}
                      >
                        {changingStatus ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            Updating…
                          </>
                        ) : (
                          statusMeta[safeStatus].label
                        )}
                      </Badge>
                    </motion.span>
                    <ChevronDown className="size-3 opacity-60" />
                    {changingStatus && (
                      <motion.span
                        layoutId="status-progress-overlay"
                        className="absolute inset-0 rounded-md ring-2 ring-primary/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {Object.values(ChapterStatus).map((s) => (
                    <DropdownMenuItem
                      key={s}
                      disabled={changingStatus || s === status}
                      className="flex items-center gap-2"
                      onClick={() => requestStatusChange(s as ChapterStatus)}
                    >
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          statusColor[s as ChapterStatus]
                        )}
                      />
                      {s === status && <Check className="size-3" />}
                      <span className="capitalize flex-1">
                        {s.toLowerCase()}
                      </span>
                      {pendingStatus === s && confirmStatusOpen && (
                        <Loader2 className="size-3 animate-spin" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 h-6 flex items-center"
                    aria-label={`Chapter position ${chapter.position}`}
                  >
                    Position {chapter.position}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Chapter order position</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80 px-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "flex items-center gap-1",
                    dirty && "text-amber-600 dark:text-amber-400",
                    saving && "text-muted-foreground animate-pulse"
                  )}
                >
                  <motion.span
                    key={dirty ? "dirty" : saving ? "saving" : "clean"}
                    className={cn(
                      "size-2 rounded-full",
                      dirty
                        ? "bg-amber-500"
                        : saving
                          ? "bg-primary/70"
                          : "bg-emerald-500/70"
                    )}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  />
                  {saveStateLabel}
                </span>
              </TooltipTrigger>
              <TooltipContent>{saveStateLabel}</TooltipContent>
            </Tooltip>
            {!dirty && !saving && lastSavedAt && (
              <span className="hidden md:inline text-[11px] text-muted-foreground/60">
                Updated {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          {/* status change progress bar */}
          <AnimatePresence>
            {changingStatus && (
              <motion.div
                key="status-progress-bar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative h-1 overflow-hidden rounded bg-primary/10 mx-0 mt-1"
                aria-label="Status change progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(statusProgress)}
              >
                <motion.div
                  key="status-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${statusProgress}%` }}
                  transition={{
                    type: "tween",
                    ease: "easeOut",
                    duration: 0.25,
                  }}
                  className={cn(
                    "h-full bg-primary relative",
                    statusProgressDone && statusProgress >= 100 && "bg-primary"
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      {/* Confirm status change dialog */}
      <AlertDialog open={confirmStatusOpen} onOpenChange={setConfirmStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change chapter status</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus
                ? `This will change the status to ${statusMeta[pendingStatus].label}. This action may take a few moments while we process background tasks.`
                : "Select a status."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingStatus && (
            <div className="space-y-2 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Type{" "}
                <span className="font-semibold">
                  {statusMeta[pendingStatus].label}
                </span>{" "}
                below to confirm.
              </p>
              <Input
                autoFocus
                placeholder={statusMeta[pendingStatus].label}
                value={confirmStatusInput}
                onChange={(e) => setConfirmStatusInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    confirmStatusInput.trim().toLowerCase() ===
                      statusMeta[pendingStatus].label.toLowerCase() &&
                    !changingStatus
                  ) {
                    e.preventDefault();
                    void executeStatusChange();
                  }
                }}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingStatus}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                changingStatus ||
                !pendingStatus ||
                confirmStatusInput.trim().toLowerCase() !==
                  statusMeta[pendingStatus].label.toLowerCase()
              }
              onClick={() => void executeStatusChange()}
            >
              {changingStatus && (
                <Loader2 className="size-4 animate-spin mr-2" />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
