"use client";
import { WorkDraftContext } from "@/lib/context";
import { useContext } from "react";

export const useWorkDraft = () => {
  const ctx = useContext(WorkDraftContext);
  if (!ctx)
    throw new Error("useWorkDraft must be used within WorkDraftProvider");
  return ctx;
};
