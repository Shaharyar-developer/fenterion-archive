import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { Input } from "../ui/input";
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
  X,
} from "lucide-react";
import { WorkOverviewWork } from "./types";
import { TAGS } from "@/constants/tags";
import { useForm } from "react-hook-form";
import { GenericWorkForm } from "@/components/forms/work";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "@/app/dashboard/works/new/form";

// EditWorkDialog: AlertDialog with GenericWorkForm for editing a work
function EditWorkDialog({
  open,
  onOpenChange,
  work,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  work: WorkOverviewWork;
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: work.title,
      slug: work.slug,
      description: work.description || "",
      type: work.type,
      status: work.status,
      tags: Array.isArray(work.tags)
        ? work.tags
        : work.tags
          ? Object.values(work.tags).flat()
          : [],
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset({
        title: work.title,
        slug: work.slug,
        description: work.description || "",
        type: work.type,
        status: work.status,
        tags: Array.isArray(work.tags)
          ? work.tags
          : work.tags
            ? Object.values(work.tags).flat()
            : [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(data: any) {
    if (loading) return;
    setLoading(true);
    try {
      // Regroup tags into object shape for backend
      let groupedTags: Record<string, string[]> | null = null;
      if (Array.isArray(data.tags)) {
        // Ensure data.type is WorkType
        const workType = data.type as keyof typeof TAGS;
        groupedTags = { general: [], [workType]: [] };
        for (const tag of data.tags as string[]) {
          if (TAGS.general.includes(tag)) {
            (groupedTags.general as string[]).push(tag);
          } else if (TAGS[workType]?.includes(tag)) {
            (groupedTags[workType] as string[]).push(tag);
          }
        }
        // Remove empty groups
        Object.keys(groupedTags).forEach((k) => {
          if (!(groupedTags as Record<string, string[]>)[k].length)
            delete (groupedTags as Record<string, string[]>)[k];
        });
        if (Object.keys(groupedTags).length === 0) groupedTags = null;
      }
      await client.work.update({
        id: work.id,
        ...data,
        tags: groupedTags,
      });
      toast.success("Work updated successfully");
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to update work");
    } finally {
      setLoading(false);
      window.location.reload();
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader className="relative">
          <AlertDialogTitle>Edit Work</AlertDialogTitle>
          <AlertDialogDescription>
            Update the details for this work. Changes will be saved immediately.
          </AlertDialogDescription>
          <AlertDialogCancel
            className="absolute right-0 -top-2"
            disabled={loading}
          >
            Cancel <X />
          </AlertDialogCancel>
        </AlertDialogHeader>
        <GenericWorkForm
          isPending={false}
          loading={loading}
          onSubmit={onSubmit}
          form={form}
          submitLabel="Save Changes"
          hideFields={["cover", "slug"]}
          readOnlyFields={["title"]}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}
import { useAsyncAction } from "@/hooks/use-async-action";
import { WORK_STATUS_META } from "@/constants/work-status-meta";
import { WorkStatus } from "@/db/schema";
import { client } from "@/lib/orpc.client";
import { cn, getCoverKey, sleep } from "@/lib/utils";
import { ImageIcon, XCircleIcon } from "lucide-react";
import Image from "next/image";
import Dropzone from "react-dropzone";
import { toast } from "sonner";
import { BUCKET_NAME } from "@/constants/misc";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

function CoverChangeDialog({
  open,
  onOpenChange,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => Promise<unknown> | void;
}) {
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const ImagePreview = ({
    url,
    onRemove,
  }: {
    url: string;
    onRemove: () => void;
  }) => (
    <div className="relative aspect-square w-32 h-32">
      <button
        className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2"
        onClick={onRemove}
        type="button"
        aria-label="Remove image"
      >
        <XCircleIcon className="h-5 w-5 fill-primary text-primary-foreground" />
      </button>
      <Image
        src={url}
        height={500}
        width={500}
        alt="Cover preview"
        className="border border-border h-full w-full rounded-md object-cover"
      />
    </div>
  );

  const handleSave = async () => {
    if (!coverFile) return;
    setUploading(true);
    try {
      await onUpload(coverFile);
      onOpenChange(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Cover</AlertDialogTitle>
          <AlertDialogDescription>
            Select a new cover image for this work.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 items-center justify-center py-4 w-full">
          <div className="mt-2 w-full max-w-40 flex justify-center">
            {coverImage ? (
              <ImagePreview
                url={coverImage}
                onRemove={() => {
                  setCoverImage(null);
                  setCoverFile(null);
                }}
              />
            ) : (
              <Dropzone
                onDrop={(acceptedFiles) => {
                  const file = acceptedFiles[0];
                  if (file) {
                    const imageUrl = URL.createObjectURL(file);
                    setCoverImage(imageUrl);
                    setCoverFile(file);
                  }
                }}
                accept={{
                  "image/png": [".png", ".jpg", ".jpeg", ".webp"],
                }}
                onDropRejected={(props) => {
                  if (props.length > 1)
                    return toast.error("Only one file can be uploaded");
                  if (props[0].file.size > 2.5 * 1024 * 1024)
                    return toast.error("File size must be less than 2.5MB");
                }}
                maxSize={2.5 * 1024 * 1024}
                maxFiles={1}
              >
                {({
                  getRootProps,
                  getInputProps,
                  isDragActive,
                  isDragAccept,
                  isDragReject,
                }) => (
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border border-dashed flex items-center justify-center aspect-square size-full rounded-md focus:outline-none focus:border-primary",
                      {
                        "border-primary bg-secondary":
                          isDragActive && isDragAccept,
                        "border-destructive bg-destructive/20":
                          isDragActive && isDragReject,
                      }
                    )}
                  >
                    <input {...getInputProps()} id="cover-image" />
                    <ImageIcon className="h-16 w-16" strokeWidth={1.25} />
                  </div>
                )}
              </Dropzone>
            )}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={uploading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!coverFile || uploading}
            onClick={handleSave}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
function DeleteWorkDialog({
  open,
  onOpenChange,
  deleting,
  onDelete,
  workTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleting: boolean;
  onDelete: () => void;
  workTitle: string;
}) {
  const [input, setInput] = useState("");
  const requiredPhrase = `delete ${workTitle}`;
  const valid = input.trim() === requiredPhrase;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete work?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove the work
            and its chapters.
            <br />
            To confirm, type{" "}
            <span className="font-mono font-semibold">
              {requiredPhrase}
            </span>{" "}
            below.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={requiredPhrase}
          disabled={deleting}
          className="mt-2"
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting || !valid}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              if (valid) onDelete();
            }}
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    run("Delete", async () => {
      await client.work.delete({
        id: work.id,
      });
    });
    await sleep(1000);
    router.push(ROUTES.dashboard.root);
  };

  const handlePublish = async () => {
    run("Publish", async () => {
      await client.work.update({
        id: work.id,
        status: WorkStatus.PUBLISHED,
      });
    });
  };

  const handleCoverUpload = async (file: File) => {
    console.log("handleCoverUpload called with file:", file);
    const coverKey = getCoverKey(file, work.slug, work.id);
    console.log("Generated coverKey:", coverKey);
    if (!coverKey) {
      toast.error("Invalid cover file");
      console.error("Invalid cover file or coverKey generation failed");
      return;
    }
    await run("Upload Cover", async () => {
      const url = await client.upload.file({
        bucketName: BUCKET_NAME,
        objectName: coverKey,
      });
      console.log("Received upload URL:", url);
      if (!url) {
        toast.error("Failed to get upload URL");
        console.error("Failed to get upload URL");
        return;
      }
      try {
        await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });
        console.log("Cover image uploaded successfully");

        await client.work.update({
          id: work.id,
          coverKey,
        });
        await sleep(1000);
        window.location.reload();
      } catch (error) {
        console.error("Error uploading cover image:", error);
        toast.error("Failed to upload cover image. Please try again.");
        return;
      }
    });
  };

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
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenuItem
                  className="gap-2"
                  disabled={!publishable || publishing}
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!publishable || publishing) return;
                    handlePublish();
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
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2"
            onSelect={(e) => {
              e.preventDefault();
              setCoverDialogOpen(true);
            }}
          >
            <Upload className="h-4 w-4" /> Cover
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onSelect={(e) => {
              e.preventDefault();
              setEditDialogOpen(true);
            }}
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
            variant="destructive"
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
        onDelete={handleDelete}
        workTitle={work.title}
      />
      <CoverChangeDialog
        open={coverDialogOpen}
        onOpenChange={setCoverDialogOpen}
        onUpload={handleCoverUpload}
      />
      <EditWorkDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        work={work}
      />
    </div>
  );
}
