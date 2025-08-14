"use client";

import { useCallback, useEffect, useState } from "react";
import { client } from "@/lib/orpc.client";
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
  const [saveMode, setSaveMode] = useState<"overwrite" | "new-version">(
    "overwrite"
  );
  const [viewMode, setViewMode] = useLocalStorage<"readable" | "max-width">(
    "editorView:v1",
    "max-width"
  );
  const compute = () => {
    const text = content || "";
    const normalized = text.replace(/\s+/g, " ").trim();
    const words = normalized ? normalized.split(" ").filter(Boolean).length : 0;
    return words;
  };
  const save = useCallback(async () => {
    if (saving || !chapter || typeof content !== "string") return;
    setSaving(true);
    const wordCount = compute();
    try {
      if (saveMode === "overwrite" && currentChapterVersion) {
        await client.chapter.updateVersion({
          id: currentChapterVersion.id,
          content,
          wordCount,
        });
      } else if (saveMode === "new-version") {
        await client.chapter.createVersion({
          chapterId: chapter.id,
          content,
          wordCount,
        });
      }
      setDirty(false);
      setLastSavedAt(new Date());
      // TODO: optionally invalidate query to refresh versions
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setSaving(false);
    }
  }, [saving, chapter, content, saveMode, currentChapterVersion]);

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
        saveMode={saveMode}
        onChangeSaveMode={setSaveMode}
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
