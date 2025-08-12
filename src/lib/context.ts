"use client";
import React, { createContext, useContext, useState } from "react";
import type { Work, WorkType, WorkStatus } from "@/db/schema";

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
