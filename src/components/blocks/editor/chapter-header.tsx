"use client";

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

interface ChapterHeaderProps {
  chapter?: Chapter;
  dirty?: boolean;
  saving?: boolean;
  lastSavedAt?: Date | null;
  onSave?: () => void | Promise<void>;
  viewMode?: "readable" | "max-width";
  setViewMode?: (mode: "readable" | "max-width") => void;
}

export function ChapterHeader({
  chapter,
  dirty,
  saving,
  lastSavedAt,
  onSave,
  viewMode,
  setViewMode,
}: ChapterHeaderProps) {
  // If chapter is undefined, render a skeleton/loading state
  if (!chapter) {
    return (
      <div className="sticky top-12 z-30 w-full bg-background/80 shadow-sm px-3 py-2 md:px-6 md:py-3 animate-pulse">
        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="h-7 w-2/3 bg-muted rounded mb-2" />
            </div>
            <div className="flex items-center gap-2 md:gap-3 pl-2">
              <div className="h-6 w-16 bg-muted rounded" />
              <div className="h-6 w-16 bg-muted rounded" />
              <div className="h-6 w-10 bg-muted rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80 px-1 mt-1">
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  const [title, setTitle] = useState(chapter?.title);
  const [status, setStatus] = useState<ChapterStatus | undefined>(
    chapter?.status
  );

  // fallback to DRAFT if status is undefined for safe access
  const safeStatus: ChapterStatus = status ?? ChapterStatus.DRAFT;
  const [editingTitle, setEditingTitle] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitle(chapter.title);
    setStatus(chapter.status);
  }, [chapter.id, chapter.title, chapter.status]);

  const persistTitle = useCallback(async () => {
    if (title.trim() === "" || title === chapter.title) {
      setEditingTitle(false);
      setTitle((t) => t || chapter.title);
      return;
    }
    setSavingTitle(true);
    await client.chapter.update({
      id: chapter.id,
      title: title.trim(),
      workId: chapter.workId,
    });
    setSavingTitle(false);
    setEditingTitle(false);
  }, [title, chapter.title]);

  const statusMeta: Record<ChapterStatus, { label: string; variant: string }> =
    {
      [ChapterStatus.DRAFT]: { label: "Draft", variant: "outline" },
      [ChapterStatus.PUBLISHED]: { label: "Published", variant: "primary" },
      [ChapterStatus.ARCHIVED]: { label: "Archived", variant: "secondary" },
    } as const;

  const changeStatus = async (next: ChapterStatus) => {
    if (next === status) return;
    setStatus(next);
    // TODO: mutation to persist status
  };

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

  return (
    <TooltipProvider delayDuration={150}>
      <motion.div
        layout
        data-viewmode={viewMode}
        animate={viewMode}
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
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
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
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
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
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => {
                        if (onSave) void onSave();
                      }}
                      className="h-9 px-3 gap-1 shadow-sm hover:shadow transition-shadow"
                    >
                      {saving ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Save className="size-3" />
                      )}
                      <span className="text-xs font-medium">Save</span>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={"ghost"}
                    aria-label="Change chapter status"
                    className="h-9 px-2 gap-2"
                  >
                    <motion.span
                      key={status}
                      layoutId="chapter-status-dot"
                      className={cn(
                        "size-2 rounded-full",
                        statusColor[safeStatus],
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
                          "text-[11px] px-2 py-0.5 border bg-transparent leading-none",
                          safeStatus === ChapterStatus.DRAFT &&
                            "border-amber-500/40 text-amber-700 dark:text-amber-300",
                          safeStatus === ChapterStatus.ARCHIVED && "opacity-70"
                        )}
                      >
                        {statusMeta[safeStatus].label}
                      </Badge>
                    </motion.span>
                    <ChevronDown className="size-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {Object.values(ChapterStatus).map((s) => (
                    <DropdownMenuItem
                      key={s}
                      className="flex items-center gap-2"
                      onClick={() => changeStatus(s)}
                    >
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          statusColor[s as ChapterStatus]
                        )}
                      />
                      {s === status && <Check className="size-3" />}
                      <span className="capitalize">{s.toLowerCase()}</span>
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
                    Pos {chapter.position}
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
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
