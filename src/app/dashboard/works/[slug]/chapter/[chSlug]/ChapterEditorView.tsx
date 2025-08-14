"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChapterStatus } from "@/db/schema";
import { ChapterContent } from "@/components/blocks/editor/chapter-content";
import { ChapterHeader } from "@/components/blocks/editor/chapter-header";
import { useLocalStorage } from "@uidotdev/usehooks";
import { cn } from "@/lib/utils";

interface ChapterEditorViewProps {
  chapter: {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: ChapterStatus;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function ChapterEditorView({ chapter }: ChapterEditorViewProps) {
  // Centralized editor state & save logic so header owns interactions
  const [content, setContent] = useState(chapter.content);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [viewMode, setViewMode] = useLocalStorage<"readable" | "max-width">(
    "editorView:v1",
    "max-width"
  );

  const save = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    // TODO: mutation to persist (chapter.id, content)
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setDirty(false);
    setLastSavedAt(new Date());
  }, [saving, content]);

  // Autosave after inactivity
  useEffect(() => {
    if (!dirty) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void save();
    }, 5000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [dirty, content, save]);

  const handleContentChange = useCallback(
    (val: string) => {
      setContent(val);
      if (!dirty) setDirty(true);
    },
    [dirty]
  );

  return (
    <div
      className={cn(
        "flex flex-col mx-auto h-full w-full",
        viewMode === "readable" ? "max-w-prose" : "w-full"
      )}
    >
      <ChapterHeader
        chapter={chapter}
        dirty={dirty}
        saving={saving}
        lastSavedAt={lastSavedAt}
        onSave={save}
      />
      <ChapterContent
        viewMode={viewMode}
        setViewMode={setViewMode}
        content={content}
        onChange={handleContentChange}
      />
    </div>
  );
}

export default ChapterEditorView;
