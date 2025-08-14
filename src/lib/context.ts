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
  prevChapterVersions: ChapterVersion[];

  isPending?: boolean;
};

export const ChapterContext = createContext<ChapterContextType | undefined>(
  undefined
);

type BreadcrumbsContextType = {
  breadcrumbs: { label: string; href?: string }[];
  setBreadcrumbs: React.Dispatch<
    React.SetStateAction<{ label: string; href?: string }[]>
  >;
  refetchBreadcrumbs: () => Promise<void>;
  isPending?: boolean;
};

export const BreadcrumbsContext = createContext<
  BreadcrumbsContextType | undefined
>(undefined);