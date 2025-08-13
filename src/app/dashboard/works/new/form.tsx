import { TAGS } from "@/constants/tags";
import { ROUTES } from "@/lib/routes";
import { client } from "@/lib/orpc.client";
import { nanoid } from "nanoid";
("use client");
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  extractExtension,
  fileToBase64,
  getCoverKey,
  transformSlug,
} from "@/lib/utils";
import { WorkStatus, WorkType } from "@/db/schema";
import { useForm } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { useWorkDraft } from "@/hooks/use-work-draft";
import { userQuery } from "@/lib/queries";
import { useRouter } from "next/navigation";
import { GenericWorkForm } from "@/components/forms/work";
import { toast } from "sonner";
import { getQueryClient } from "@/lib/query-client";
import { uploadToR2 } from "@/lib/minio";
import { BUCKET_NAME } from "@/constants/misc";

export const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message:
        "Slug must be lowercase and can only contain letters, numbers, and hyphens",
    })
    .min(3, "Slug must be at least 3 characters long"),
  description: z.string().optional(),
  type: z.enum(WorkType),
  status: z.enum(WorkStatus),
  cover: z
    .custom<File>()
    .optional()
    .refine((file) => !file || file.size <= 2.5 * 1024 * 1024, {
      error: "Cover image must be less than 2.5MB",
    })
    .refine((file) => !file || file.type.startsWith("image/"), {
      error: "Cover image must be an image file",
    }),
  tags: z.array(z.string()).optional(),
});

export type WorkDraftData = z.infer<typeof formSchema>;

export function CreateWorkForm(props: {
  defaultValues?: Partial<z.infer<typeof formSchema>>;
}) {
  const { setWorkDraft } = useWorkDraft();
  const { isPending: _isPending, data: userData } = userQuery();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const queryClient = getQueryClient();

  const invalidateWorks = () => {
    queryClient.invalidateQueries({
      queryKey: ["userWorks"],
    });
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: props.defaultValues || {
      title: "",
      slug: "",
      description: "",
      type: WorkType.STORY,
      status: WorkStatus.DRAFT,
    },
  });

  useEffect(() => {
    const subscription = form.watch((values) => {
      const workType = values.type;
      const allTags = values.tags || [];
      if (!workType || allTags.length === 0) {
        setWorkDraft({
          ...values,
          tags: null,
        });
        return;
      }
      const groupedTags: Record<string, string[]> = {
        general: [],
        [workType]: [],
      };
      allTags.forEach((tag) => {
        if (!tag) return;
        if (TAGS.general.includes(tag)) {
          groupedTags.general.push(tag);
        } else if (TAGS[workType]?.includes(tag)) {
          groupedTags[workType].push(tag);
        }
      });
      // Only include categories that have tags
      const finalTags: Record<string, string[]> = {};
      if (groupedTags.general.length > 0) {
        finalTags.general = groupedTags.general;
      }
      if (groupedTags[workType].length > 0) {
        finalTags[workType] = groupedTags[workType];
      }
      setWorkDraft({
        ...values,
        tags: Object.keys(finalTags).length > 0 ? finalTags : null,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, setWorkDraft]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!userData?.id || typeof userData === "undefined") {
      router.push(ROUTES.auth.signIn);
      return;
    }
    setLoading(true);
    const groupedTags: Record<string, string[]> = {};
    if (data.tags) {
      groupedTags.general = [];
      Object.values(WorkType).forEach((type) => {
        groupedTags[type] = [];
      });
      for (const tag of data.tags) {
        if (TAGS.general.includes(tag)) {
          groupedTags.general.push(tag);
        } else {
          for (const type of Object.values(WorkType)) {
            if (TAGS[type].includes(tag)) {
              groupedTags[type].push(tag);
            }
          }
        }
      }
    }
    const coverKey = data.cover
      ? getCoverKey(data.cover, data.slug, userData.id)
      : null;
    try {
      if (coverKey && data.cover) {
        const url = await client.upload.file({
          bucketName: BUCKET_NAME,
          objectName: coverKey,
        });
        console.log("Uploading cover image to:", url);
        try {
          await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": data.cover.type,
            },
            body: data.cover,
          });
        } catch (error) {
          console.error("Error uploading cover image:", error);
          toast.error("Failed to upload cover image. Please try again.");
          return;
        }
      }
      await client.work.create({
        ...data,
        authorId: userData.id,
        slug: data.slug,
        id: nanoid(),
        tags: data.tags ? groupedTags : null,
        coverKey,
      });
    } catch (error) {
      console.error("Error creating work:", error);
      toast.error("Failed to create work. Please try again.");
    } finally {
      setLoading(false);
    }
    invalidateWorks();
    router.push(
      ROUTES.dashboard.works.bySlug(transformSlug(data.slug, userData.id))
    );
  }
  const isPending = _isPending;
  return (
    <div>
      <GenericWorkForm
        isPending={isPending}
        loading={loading}
        onSubmit={onSubmit}
        form={form}
        submitLabel="Submit"
      />
    </div>
  );
}
