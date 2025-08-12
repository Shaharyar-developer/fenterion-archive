"use client";
import { WorkDraftContext } from "@/lib/context";
import { useState } from "react";

type WorkDraftData = {
  title?: string;
  slug?: string;
  description?: string | null;
  type?: any; // WorkType from schema
  status?: any; // WorkStatus from schema
  tags?: Record<string, string[]> | null;
  cover?: File;
  wordCount?: number | null;
};

export const WorkDraftProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [workDraft, setWorkDraft] = useState<WorkDraftData>({});
  return (
    <WorkDraftContext.Provider value={{ workDraft, setWorkDraft }}>
      {children}
    </WorkDraftContext.Provider>
  );
};
