"use client";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { WORK_STATUS_META } from "@/constants/work-status-meta";
import { Work, WorkStatus, WorkType } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Tag as TagIcon,
  Link2,
  Cog,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ROUTES } from "@/lib/routes";

export function TitleCell({ work }: { work: Work }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Link
        href={`/book/${work.id}`}
        className="font-medium text-sm hover:underline truncate max-w-[240px]"
        title={work.title}
      >
        {work.title}
      </Link>
      <Link
        href={`/book/${work.id}`}
        className="text-muted-foreground opacity-0 group-hover:opacity-100 transition"
        aria-label="Open work"
      >
        <ExternalLink className="size-3" />
      </Link>
    </div>
  );
}

export function StatusBadge({ status }: { status: WorkStatus }) {
  const meta = WORK_STATUS_META[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-normal px-1.5 py-0 text-[11px] tracking-wide",
        meta.className
      )}
    >
      {meta.label}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: WorkType }) {
  const label = type
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return (
    <Badge
      variant="secondary"
      className="font-normal px-1.5 py-0 text-[11px] tracking-wide capitalize"
    >
      {label}
    </Badge>
  );
}

export function TagsCell({ tags }: { tags: Record<string, string[]> }) {
  const entries = Object.entries(tags || {});
  if (!entries.length)
    return <span className="text-muted-foreground/60">—</span>;
  const flat: string[] = [];
  for (const [, vals] of entries) flat.push(...vals);
  const shown = flat.slice(0, 3);
  const hidden = flat.length - shown.length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex flex-wrap gap-1 max-w-[260px] cursor-pointer">
          {shown.map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="border-border/50 bg-muted/40 text-[11px] font-normal px-1.5 py-0"
            >
              <TagIcon className="size-3" /> {t}
            </Badge>
          ))}
          {hidden > 0 && (
            <Badge
              variant="outline"
              className="border-dashed border-border/50 bg-muted/40 text-[11px] font-normal px-1.5 py-0"
              title={flat.slice(3).join(", ")}
            >
              +{hidden} more
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 max-w-max">
        <div className="flex flex-col">
          {flat.map((t, idx) => (
            <div
              key={idx}
              className="border-b last:border-b-0 py-2 px-2 pr-20 text-xs"
            >
              {t}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DateCell({ date }: { date: Date | string | null }) {
  if (!date) return <span className="text-muted-foreground/60">—</span>;
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    <time
      dateTime={d.toISOString()}
      title={d.toISOString()}
      className="text-xs tabular-nums"
    >
      {format(d, "MMM d, yyyy")}
    </time>
  );
}

export function WordCountCell({ count }: { count: number | null }) {
  if (count == null) return <span className="text-muted-foreground/60">—</span>;
  return <span className="tabular-nums">{count.toLocaleString()}</span>;
}

export function RowActions({ work }: { work: Work }) {
  return (
    <Button variant={"ghost"} asChild>
      <Link href={ROUTES.dashboard.works.bySlug(work.slug)}>
        <Settings />
      </Link>
    </Button>
  );
}
