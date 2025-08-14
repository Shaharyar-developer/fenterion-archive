"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChapterVersion } from "@/db/schema";
import { ChapterContent } from "@/components/blocks/editor/chapter-content";
import { ChapterHeader } from "@/components/blocks/editor/chapter-header";
import { useLocalStorage } from "@uidotdev/usehooks";
import { cn } from "@/lib/utils";
import { useChapter } from "@/hooks/use-chapter";
import { useRouter } from "next/navigation";

export function ChapterEditorView() {
  const router = useRouter();
  // Centralized editor state & save logic so header owns interactions
  const [content, setContent] = useState<ChapterVersion["content"] | null>(
    null
  );
  const { isPending, chapter, currentChapterVersion } = useChapter();
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

  useEffect(() => {
    if (
      typeof currentChapterVersion?.content !== "undefined" &&
      !content &&
      !isPending
    ) {
      setContent(currentChapterVersion.content);
    }
  }, [isPending, currentChapterVersion]);

  const handleContentChange = useCallback(
    (val: string) => {
      setContent(val);
      if (!dirty) setDirty(true);
    },
    [dirty]
  );

  useEffect(() => {
    if (!isPending && !chapter) {
    }
  }, [isPending, chapter, router]);

  if (!isPending && !chapter) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col mx-auto h-full w-full",
        viewMode === "readable" ? "max-w-prose" : "w-full"
      )}
    >
      <ChapterHeader
        chapter={chapter || undefined}
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
