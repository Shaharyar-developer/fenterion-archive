"use client";

import { motion } from "framer-motion";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Minus,
  Underline,
  FileText,
  AlignHorizontalSpaceAround,
  Ellipsis,
  Wand2,
  Superscript,
  Subscript,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FontPicker from "../font-picker";
import { toZalgo, fromZalgo } from "@/lib/utils";
import TableInsertPopover from "./table-insert-popover";

interface ChapterMetaFooterProps {
  editor: Editor | null;
  viewMode: "readable" | "max-width";
  setViewMode: (mode: "readable" | "max-width") => void;
}

// Sticky, subtly elevated footer with formatting controls and live stats.

export function ChapterMetaFooter({
  editor,
  viewMode,
  setViewMode,
}: ChapterMetaFooterProps) {
  // All hooks must be called unconditionally and in the same order
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0, readingMinutes: 0 });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!editor) return;
    const compute = () => {
      const text = editor.getText();
      const normalized = text.replace(/\s+/g, " ").trim();
      const words = normalized
        ? normalized.split(" ").filter(Boolean).length
        : 0;
      const chars = normalized.replace(/\s/g, "").length;
      const readingMinutes = words / 200;
      setStats((prev) =>
        prev.words === words && prev.chars === chars
          ? prev
          : { words, chars, readingMinutes }
      );
    };
    compute();
    editor.on("update", compute);
    editor.on("create", compute);
    return () => {
      editor.off("update", compute);
      editor.off("create", compute);
    };
  }, [editor]);

  if (!editor) return null;

  const btnBase =
    "h-8 w-8 p-0 flex items-center justify-center rounded-md transition-colors";
  const run = (cb: () => void) => () => {
    if (editor) cb();
  };

  return (
    <TooltipProvider delayDuration={150}>
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={mounted ? { y: 0, opacity: 1 } : {}}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={cn("sticky bottom-0 z-30 w-full", "pointer-events-none")}
      >
        <motion.div layout className="flex justify-center pb-2 px-2">
          <motion.div
            layout
            animate={viewMode}
            variants={{
              readable: { scale: 0.98 },
              "max-width": { scale: 1 },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={cn(
              "pointer-events-auto flex items-center justify-between gap-3 rounded-xl border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
              "shadow-lg shadow-black/5 dark:shadow-black/30 px-3 py-1 w-full max-w-max"
            )}
          >
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Bold (Ctrl+B)"
                    className={cn(
                      btnBase,
                      editor.isActive("bold") &&
                        "bg-primary/10 text-primary dark:bg-primary/20"
                    )}
                    onClick={run(() =>
                      editor.chain().focus().toggleBold().run()
                    )}
                  >
                    <Bold className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-bold">
                  Bold
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Italic (Ctrl+I)"
                    className={cn(
                      btnBase,
                      editor.isActive("italic") &&
                        "bg-primary/10 text-primary dark:bg-primary/20"
                    )}
                    onClick={run(() =>
                      editor.chain().focus().toggleItalic().run()
                    )}
                  >
                    <Italic className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="italic">
                  Italic
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Underline (Ctrl+U)"
                    className={cn(
                      btnBase,
                      editor.isActive("underline") &&
                        "bg-primary/10 text-primary dark:bg-primary/20"
                    )}
                    onClick={run(() =>
                      editor.chain().focus().toggleUnderline().run()
                    )}
                  >
                    <Underline className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="underline">
                  Underline
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Superscript"
                    className={cn(
                      btnBase,
                      editor.isActive("superscript") &&
                        "bg-primary/10 text-primary dark:bg-primary/20"
                    )}
                    onClick={run(() =>
                      editor
                        .chain()
                        .focus()
                        .toggleSuperscript()
                        .unsetSubscript() // keep exclusive
                        .run()
                    )}
                  >
                    <Superscript className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Superscript
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Subscript"
                    className={cn(
                      btnBase,
                      editor.isActive("subscript") &&
                        "bg-primary/10 text-primary dark:bg-primary/20"
                    )}
                    onClick={run(() =>
                      editor
                        .chain()
                        .focus()
                        .toggleSubscript()
                        .unsetSuperscript() // keep exclusive
                        .run()
                    )}
                  >
                    <Subscript className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Subscript
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Toggle Zalgo (glitch)"
                    className={btnBase}
                    onClick={run(() => {
                      const { state } = editor;
                      const { from, to } = state.selection;
                      if (from === to) return; // require a selection
                      const selected = state.doc.textBetween(from, to, " ");
                      const hasZalgo = /[\u0300-\u036F\u0489]/.test(selected);
                      const transformed = hasZalgo
                        ? fromZalgo(selected)
                        : toZalgo(selected, 6);
                      editor
                        .chain()
                        .focus()
                        .insertContentAt({ from, to }, transformed)
                        .run();
                    })}
                  >
                    <Wand2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Apply / remove Zalgo effect on selected text
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Insert horizontal rule"
                    className={btnBase}
                    onClick={run(() =>
                      editor.chain().focus().setHorizontalRule().run()
                    )}
                  >
                    <Minus className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Horizontal rule</TooltipContent>
              </Tooltip>
              {/* Table insert popover */}
              <TableInsertPopover editor={editor} />
            </div>
            <div className="mx-1 h-5 w-px bg-border" />
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "group flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium tracking-wide",
                    "bg-muted/50 hover:bg-muted cursor-default transition-colors",
                    "border border-transparent hover:border-border/70"
                  )}
                  aria-label={`${stats.words} words, ~${Math.max(1, Math.ceil(stats.readingMinutes))} min read`}
                >
                  <FileText className="size-3.5 opacity-70 group-hover:opacity-90" />
                  <motion.span
                    key={stats.words}
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="tabular-nums"
                  >
                    {stats.words}
                  </motion.span>
                  <span className="text-muted-foreground/70">words</span>
                  <span className="hidden sm:inline text-muted-foreground/50">
                    ·
                  </span>
                  <span className="hidden sm:inline tabular-nums">
                    ~{Math.max(1, Math.ceil(stats.readingMinutes))}m
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs space-y-0.5">
                <div>
                  <strong>{stats.words}</strong> words
                </div>
                <div>
                  <strong>{stats.chars}</strong> characters
                </div>
                <div>
                  ~{Math.max(1, Math.ceil(stats.readingMinutes))} minute read
                </div>
              </TooltipContent>
            </Tooltip>
            <div className="mx-1 h-5 w-px bg-border" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"ghost"} size={"icon"}>
                  <Ellipsis />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="text-sm flex flex-col gap-1.5 w-xs">
                <Tooltip>
                  <TooltipTrigger className="flex items-center" asChild>
                    <div>
                      <span className="grow">Editor Mode</span>
                      <Button
                        size={"sm"}
                        variant="outline"
                        aria-label={
                          viewMode === "readable"
                            ? "Switch to full width mode"
                            : "Switch to readable mode"
                        }
                        onClick={() =>
                          setViewMode(
                            viewMode === "readable" ? "max-width" : "readable"
                          )
                        }
                        className="px-2 gap-1 w-[150px] justify-between"
                      >
                        {viewMode === "readable" ? "max-width" : "readable"}
                        <AlignHorizontalSpaceAround className="text-muted-foreground" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {viewMode === "readable"
                      ? "Switch to full width mode"
                      : "Switch to readable mode"}
                  </TooltipContent>
                </Tooltip>
                <Separator className="" />
                <Tooltip>
                  <TooltipTrigger className="flex items-center" asChild>
                    <div>
                      <span className="grow">Editor Font</span>
                      <FontPicker
                        className="w-[150px]"
                        targetClass="md-editor"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {viewMode === "readable"
                      ? "Switch to full width mode"
                      : "Switch to readable mode"}
                  </TooltipContent>
                </Tooltip>
              </PopoverContent>
            </Popover>
          </motion.div>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}

export default ChapterMetaFooter;
