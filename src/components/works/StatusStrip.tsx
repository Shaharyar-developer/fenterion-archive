import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function DeleteWorkDialog({
  open,
  onOpenChange,
  deleting,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete work?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove the work
            and its chapters.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onDelete}
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Upload,
  Loader2,
  BookOpen,
  Check,
  ArchiveRestore,
} from "lucide-react";
import { WorkOverviewWork } from "./types";
import { useAsyncAction } from "@/hooks/use-async-action";
import { WORK_STATUS_META } from "@/constants/work-status-meta";
import { WorkStatus } from "@/db/schema";
import { cn } from "@/lib/utils";

export function StatusStrip({
  work,
  publishable,
  unpublishable,
}: {
  work: WorkOverviewWork;
  publishable: boolean;
  unpublishable: boolean;
}) {
  const meta = WORK_STATUS_META[work.status];
  const { run, loading } = useAsyncAction();
  const publishing = loading === "Publish";
  const deleting = loading === "Delete";
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Badge
        variant="secondary"
        className="uppercase tracking-wide px-2 py-1 text-[10px]"
      >
        {work.type.replace(/_/g, " ")}
      </Badge>
      <span
        className={cn(
          "text-[11px] font-medium px-2 py-1 rounded-md inline-flex items-center gap-1",
          meta.className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" /> {meta.label}
      </span>
      <span className="text-xs text-muted-foreground ml-auto">
        Updated {work.updatedAt.toLocaleDateString()}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className=" ml-1"
            aria-label="Work actions"
          >
            Actions <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenuItem
                  className="gap-2"
                  disabled={!publishable || publishing}
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!publishable || publishing) return;
                    run(
                      "Publish",
                      async () => await new Promise((r) => setTimeout(r, 800))
                    );
                  }}
                >
                  {publishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Publish
                </DropdownMenuItem>
              </div>
            </TooltipTrigger>
            {!publishable && (
              <TooltipContent side="left" className="max-w-xs">
                {work.status === WorkStatus.PUBLISHED
                  ? "Already published"
                  : work.status === WorkStatus.ARCHIVED
                    ? "Archived works cannot be published"
                    : "Add at least one chapter before publishing."}
              </TooltipContent>
            )}
          </Tooltip>
          <DropdownMenuItem
            className="gap-2"
            onSelect={(e) => e.preventDefault()}
          >
            <Upload className="h-4 w-4" /> Cover
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onSelect={(e) => e.preventDefault()}
          >
            <Edit className="h-4 w-4" /> Edit
          </DropdownMenuItem>
          {unpublishable && (
            <DropdownMenuItem
              className="gap-2"
              onSelect={(e) => e.preventDefault()}
            >
              <ArchiveRestore className="h-4 w-4" /> Unpublish
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="gap-2"
            onSelect={(e) => e.preventDefault()}
          >
            <BookOpen className="h-4 w-4" /> Preview
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              setDeleteOpen(true);
            }}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteWorkDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        deleting={deleting}
        onDelete={() =>
          run(
            "Delete",
            async () => await new Promise((r) => setTimeout(r, 800))
          )
        }
      />
    </div>
  );
}
