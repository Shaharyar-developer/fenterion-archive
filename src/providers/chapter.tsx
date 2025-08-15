"use client";

import { ChapterContext } from "@/lib/context";
import type { Chapter, ChapterVersion } from "@/db/schema";
import { useEffect, useState } from "react";
import { useChapterAndVersionsQuery } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";

export const ChapterProvider = ({
  children,
  chapterSlug,
}: {
  children: React.ReactNode;
  chapterSlug: string;
}) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [currentChapterVersion, setCurrentChapterVersion] =
    useState<ChapterVersion | null>(null);
  const [prevChapterVersions, setPrevChapterVersions] = useState<
    ChapterVersion[]
  >([]);
  const [previewChapterVersion, setPreviewChapterVersion] =
    useState<ChapterVersion | null>(null);
  const { data, isPending } = useChapterAndVersionsQuery(chapterSlug);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isPending && data) {
      setChapter(data.chapter);
      setCurrentChapterVersion(
        data.versions.find((v) => v.id === data.chapter.currentVersionId) ||
          null
      );
      setPrevChapterVersions(
        data.versions.filter((v) => v.id !== data.chapter.currentVersionId)
      );
    }
  }, [isPending, data]);

  // When status changes externally (publish/unpublish) ensure a fresh refetch for hydration.
  useEffect(() => {
    if (chapter?.status === undefined) return;
    queryClient.invalidateQueries({
      queryKey: ["chapterAndVersions", chapterSlug],
    });
  }, [chapter?.status, chapterSlug, queryClient]);

  useEffect(() => {
    console.log("ChapterProvider: chapter", currentChapterVersion);
  }, [currentChapterVersion]);

  return (
    <ChapterContext.Provider
      value={{
        chapter,
        currentChapterVersion,
        prevChapterVersions,
        setChapter,
        setCurrentChapterVersion,
        setPrevChapterVersions,
        previewChapterVersion,
        setPreviewChapterVersion,
        isPending: isPending,
      }}
    >
      {children}
    </ChapterContext.Provider>
  );
};
