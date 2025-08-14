"use client";
import React, { createContext, useContext, useState } from "react";
import type {
  Work,
  WorkType,
  WorkStatus,
  Chapter,
  ChapterVersion,
} from "@/db/schema";

type WorkDraftData = {
  title?: string;
  slug?: string;
  description?: string | null;
  type?: WorkType;
  status?: WorkStatus;
  tags?: Record<string, string[]> | null;
  cover?: File;
  wordCount?: number | null;
};

type WorkDraftContextType = {
  workDraft: WorkDraftData;
  setWorkDraft: React.Dispatch<React.SetStateAction<WorkDraftData>>;
};

export const WorkDraftContext = createContext<WorkDraftContextType | undefined>(
  undefined
);

type ChapterContextType = {
  chapter: Chapter | null;
  currentChapterVersion: ChapterVersion | null;
  setChapter: React.Dispatch<React.SetStateAction<Chapter | null>>;
  setCurrentChapterVersion: React.Dispatch<
    React.SetStateAction<ChapterVersion | null>
  >;
  isPending?: boolean;
};

export const ChapterContext = createContext<ChapterContextType | undefined>(
  undefined
);