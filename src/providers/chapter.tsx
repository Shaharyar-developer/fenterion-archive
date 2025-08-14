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
  const [prevChapterVersions, setPrevChapterVersions] = useState<
    ChapterVersion[]
  >([]);
  const { data, isPending } = useChapterAndVersionsQuery(chapterSlug);

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
        isPending: isPending,
      }}
    >
      {children}
    </ChapterContext.Provider>
  );
};
