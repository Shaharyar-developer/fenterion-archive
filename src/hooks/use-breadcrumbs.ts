"use client";
import { useContext } from "react";
import { BreadcrumbsContext } from "@/lib/context";

export function useBreadcrumbs() {
  const ctx = useContext(BreadcrumbsContext);
  if (!ctx) {
    throw new Error("useBreadcrumbs must be used within a BreadcrumbsProvider");
  }
  const { isPending, breadcrumbs, refetchBreadcrumbs } = ctx;
  return [isPending, breadcrumbs, refetchBreadcrumbs] as const;
}
