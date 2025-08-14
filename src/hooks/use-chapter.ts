"use client";
import { ChapterContext } from "@/lib/context";
import { useContext } from "react";

export const useChapter = () => {
  const ctx = useContext(ChapterContext);
  if (!ctx) throw new Error("useChapter must be used within ChapterProvider");
  return ctx;
};
