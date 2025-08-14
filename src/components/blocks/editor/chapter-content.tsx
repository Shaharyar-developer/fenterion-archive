"use client";

import MDEditor from "@/components/blocks/editor/main";
import { ChapterMetaFooter } from "@/components/blocks/editor/chapter-meta-footer";
import { useState } from "react";
import { Editor } from "@tiptap/react";
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/components/ui/spinner";

interface ChapterContentProps {
  content: string | null;
  onChange: (value: string) => void;
  viewMode: "readable" | "max-width";
  setViewMode: (mode: "readable" | "max-width") => void;
}

// Pure presentational editor surface: all interaction (saving, status, etc.) lives in header.
export function ChapterContent({
  content,
  onChange,
  viewMode,
  setViewMode,
}: ChapterContentProps) {
  const [editor, setEditor] = useState<Editor | null>(null);

  return (
    <div className="flex flex-col bg-card/75 rounded-t-3xl w-full h-full">
      <div className="relative h-full overflow-auto w-full">
        {content === null ? (
          <div className="flex items-center justify-center h-full">
            <Spinner className="size-20" />
          </div>
        ) : (
          <MDEditor
            className="h-full"
            content={content}
            onChange={onChange}
            onReady={(e) => setEditor(e)}
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
