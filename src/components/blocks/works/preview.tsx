"use client";
import { useEffect, useMemo, useState } from "react";
import { useWorkDraft } from "@/hooks/use-work-draft";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WorkType, WorkStatus } from "@/db/schema";
import {
  BookOpen,
  FileText,
  Heart,
  Zap,
  Eye,
  EyeOff,
  Calendar,
  Hash,
  Tag,
  Hash as HashIcon,
  FileText as FileIcon,
} from "lucide-react";

export const WorkPreview = () => {
  const { workDraft } = useWorkDraft();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Create an object URL for the cover File if present
  useEffect(() => {
    if (workDraft.cover) {
      const url = URL.createObjectURL(workDraft.cover);
      setCoverUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCoverUrl(null);
    }
  }, [workDraft.cover]);

  const getWorkTypeIcon = (type: WorkType) => {
    switch (type) {
      case WorkType.STORY:
        return <BookOpen className="h-4 w-4" />;
      case WorkType.SHORT_STORY:
        return <FileText className="h-4 w-4" />;
      case WorkType.POEM:
        return <Heart className="h-4 w-4" />;
      case WorkType.FANFICTION:
        return <Zap className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: WorkStatus) => {
    switch (status) {
      case WorkStatus.DRAFT:
        return "secondary";
      case WorkStatus.PUBLISHED:
        return "default";
      case WorkStatus.ARCHIVED:
        return "outline";
      default:
        return "secondary";
    }
  };

  const getWorkTypeLabel = (type: WorkType) => {
    switch (type) {
      case WorkType.STORY:
        return "Story";
      case WorkType.SHORT_STORY:
        return "Short Story";
      case WorkType.POEM:
        return "Poetry";
      case WorkType.FANFICTION:
        return "Fanfiction";
      default:
        return "Story";
    }
  };

  const formatStatus = (status: WorkStatus) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  const paragraphs = useMemo(() => {
    if (!workDraft.description) return [];
    return workDraft.description.trim().split(/\n{2,}/g);
  }, [workDraft.description]);

  const tagEntries = useMemo(() => {
    if (!workDraft.tags) return [] as [string, string[]][];
    return Object.entries(workDraft.tags).filter(([, v]) => v.length);
  }, [workDraft.tags]);

  if (
    !workDraft.title &&
    !workDraft.slug &&
    !workDraft.type &&
    !workDraft.description
  ) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground max-w-sm">
          <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Preview Your Work</h3>
          <p className="text-sm leading-relaxed">
            Begin entering a title, description or upload a cover to see a live
            reader-facing preview of your work.
          </p>
        </div>
      </div>
    );
  }

  const status = workDraft.status || WorkStatus.DRAFT;
  const typeLabel = workDraft.type ? getWorkTypeLabel(workDraft.type) : "Story";

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero / Cover */}
      <div className="relative w-full aspect-[16/6] bg-muted border-b overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={workDraft.title || "Cover image"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <BookOpen className="h-10 w-10 opacity-40" />
            <span className="text-xs">No cover uploaded</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-background/10" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {workDraft.type && (
              <span className="inline-flex items-center gap-1">
                {getWorkTypeIcon(workDraft.type)} {typeLabel}
              </span>
            )}
            <Separator orientation="vertical" className="h-4" />
            <Badge
              variant={getStatusColor(status)}
              className="text-[10px] uppercase tracking-wide"
            >
              {formatStatus(status)}
            </Badge>
            {workDraft.slug && (
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3 w-3" />
                <code className="text-[11px] font-mono">{workDraft.slug}</code>
              </span>
            )}
            {workDraft.wordCount != null && (
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {workDraft.wordCount.toLocaleString()} words
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date().toLocaleDateString()}
            </span>
            <span className="inline-flex items-center gap-1">
              {status === WorkStatus.PUBLISHED ? (
                <Eye className="h-3 w-3 text-green-600" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
              {status === WorkStatus.PUBLISHED ? "Public" : "Private"}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight drop-shadow">
            {workDraft.title || "Untitled Work"}
          </h1>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-8 max-w-3xl mx-auto">
        {paragraphs.length > 0 && (
          <div className="space-y-4 leading-relaxed text-sm text-muted-foreground">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {/* Tags */}
        {tagEntries.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium">
              <Tag className="h-4 w-4" /> Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {tagEntries.flatMap(([category, tags]) =>
                tags.map((t) => (
                  <Badge
                    key={category + ":" + t}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {t}
                  </Badge>
                ))
              )}
            </div>
          </div>
        )}

        {/* Technical meta (optional developer view) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-10 border rounded-md p-4 bg-muted/30">
            <h3 className="text-xs font-semibold mb-2 text-muted-foreground tracking-wide uppercase">
              Debug Info
            </h3>
            <pre className="text-[10px] leading-snug overflow-auto max-h-72 text-muted-foreground">
              {JSON.stringify(workDraft, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
