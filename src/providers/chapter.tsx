"use client";

import { ChapterContext } from "@/lib/context";
import type { Chapter, ChapterVersion } from "@/db/schema";
import { useEffect, useState } from "react";
import { useChapterAndVersionsQuery } from "@/lib/queries";

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
  const { data: chapterData, isPending: dataIsPending } =
    useChapterAndVersionsQuery(chapterSlug);

  useEffect(() => {
    if (!dataIsPending && chapterData) {
      setChapter(chapterData.chapter);
      setCurrentChapterVersion(
        chapterData.versions.find(
          (v) => v.id === chapterData.chapter.currentVersionId
        ) || null
      );
    }
  }, [dataIsPending, chapterData]);

  return (
    <ChapterContext.Provider
      value={{
        chapter,
        currentChapterVersion,
        setChapter,
        setCurrentChapterVersion,
        isPending: dataIsPending,
      }}
    >
      {children}
    </ChapterContext.Provider>
  );
};
