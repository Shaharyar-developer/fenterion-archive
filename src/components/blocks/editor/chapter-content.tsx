"use client";

import MDEditor from "@/components/blocks/editor/main";
import { ChapterMetaFooter } from "@/components/blocks/editor/chapter-meta-footer";
import { useState } from "react";
import { Editor } from "@tiptap/react";
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface ChapterContentProps {
  content: string | null;
  onChange: (value: string) => void;
  viewMode: "readable" | "max-width";
  setViewMode: (mode: "readable" | "max-width") => void;
  readOnly?: boolean;
}

// Pure presentational editor surface: all interaction (saving, status, etc.) lives in header.
export function ChapterContent({
  content,
  onChange,
  viewMode,
  setViewMode,
  readOnly = false,
}: ChapterContentProps) {
  const [editor, setEditor] = useState<Editor | null>(null);

  return (
    <div className="flex flex-col bg-card/75 rounded-t-3xl w-full h-full">
      <div className="relative h-full overflow-auto w-full">
        {readOnly && (
          <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700 px-3 py-1 rounded-full text-xs font-medium shadow">
            Published (read-only)
          </div>
        )}
        {content === null ? (
          <div className="flex items-center justify-center h-full">
            <Spinner className="size-20" />
          </div>
        ) : (
          <MDEditor
            className={cn("h-full")}
            content={content}
            onChange={onChange}
            onReady={(e) => setEditor(e)}
            readOnly={readOnly}
          />
        )}
      </div>
      <ChapterMetaFooter
        viewMode={viewMode}
        setViewMode={setViewMode}
        editor={editor}
      />
    </div>
  );
}
