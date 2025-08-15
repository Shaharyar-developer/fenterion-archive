"use client";

import { useCallback, useEffect, useState } from "react";
import { client } from "@/lib/orpc.client";
import { ChapterStatus, ChapterVersion } from "@/db/schema";
import { ChapterContent } from "@/components/blocks/editor/chapter-content";
import { ChapterHeader } from "@/components/blocks/editor/chapter-header";
import { useLocalStorage } from "@uidotdev/usehooks";
import { cn } from "@/lib/utils";
import { useChapter } from "@/hooks/use-chapter";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function ChapterEditorView(props: { workSlug: string }) {
  const router = useRouter();
  // Centralized editor state & save logic so header owns interactions
  const [content, setContent] = useState<ChapterVersion["content"] | null>(
    null
  );
  const {
    isPending,
    chapter,
    currentChapterVersion,
    setCurrentChapterVersion,
    prevChapterVersions,
    setPrevChapterVersions,
  } = useChapter();
  const queryClient = useQueryClient();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveMode, setSaveMode] = useState<"overwrite" | "new-version">(
    "overwrite"
  );
  const [readOnly, setReadOnly] = useState(true);
  const [readOnlyReason, setReadOnlyReason] = useState<string | null>(null);
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
    if (readOnly) return; // Prevent saving in read-only mode
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
        const { id: newId } = await client.chapter.createVersion({
          chapterId: chapter.id,
          content,
          wordCount,
        });
        // Move previous current into prev list; set fresh current
        setPrevChapterVersions((prev) =>
          currentChapterVersion ? [currentChapterVersion, ...prev] : prev
        );
        setCurrentChapterVersion({
          id: newId,
          chapterId: chapter.id,
          content,
          createdAt: new Date(),
          updatedAt: new Date(),
          versionNumber: (currentChapterVersion?.versionNumber || 0) + 1,
        } as any);
      }
      setDirty(false);
      setLastSavedAt(new Date());
      queryClient.invalidateQueries({
        queryKey: ["chapterAndVersions", chapter.slug],
      });
      // TODO: optionally invalidate query to refresh versions
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setSaving(false);
    }
  }, [
    readOnly,
    saving,
    chapter,
    content,
    saveMode,
    currentChapterVersion,
    setCurrentChapterVersion,
    setPrevChapterVersions,
    queryClient,
  ]);

  useEffect(() => {
    if (
      typeof currentChapterVersion?.content !== "undefined" &&
      !content &&
      !isPending
    ) {
      setContent(currentChapterVersion.content);
    }
  }, [isPending, currentChapterVersion]);

  // Reactively toggle read-only:
  // 1. Always read-only if chapter is published.
  // 2. Read-only if user is viewing a historical (non-latest) version.
  useEffect(() => {
    if (!chapter || !currentChapterVersion) return;
    const allVersions = [currentChapterVersion, ...prevChapterVersions];
    const maxVersionNumber = allVersions.reduce(
      (m, v) => Math.max(m, v.versionNumber || 0),
      0
    );
    const isHistorical =
      (currentChapterVersion.versionNumber || 0) < maxVersionNumber;
    if (chapter.status === ChapterStatus.PUBLISHED) {
      setReadOnly(true);
      setReadOnlyReason("Published (read-only)");
    } else if (isHistorical) {
      setReadOnly(true);
      setReadOnlyReason(
        `Viewing historical version v${currentChapterVersion.versionNumber} (read-only)`
      );
    } else {
      setReadOnly(false);
      setReadOnlyReason(null);
    }
  }, [
    chapter?.status,
    currentChapterVersion?.id,
    currentChapterVersion?.versionNumber,
    prevChapterVersions,
  ]);

  // If current chapter version content re-hydrates (e.g. after publish/unpublish) update local editor state when not dirty
  useEffect(() => {
    if (
      !dirty &&
      currentChapterVersion?.content &&
      currentChapterVersion.content !== content
    ) {
      setContent(currentChapterVersion.content);
    }
  }, [currentChapterVersion?.content, dirty]);

  const handleContentChange = useCallback(
    (val: string) => {
      if (readOnly) return; // Ignore edits in read-only mode (belt & suspenders)
      setContent(val);
      if (!dirty) setDirty(true);
    },
    [dirty, readOnly]
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
        workSlug={props.workSlug}
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
        readOnly={readOnly}
        readOnlyReason={readOnlyReason || undefined}
      />
    </div>
  );
}

export default ChapterEditorView;
