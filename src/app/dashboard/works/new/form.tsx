"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useForm, useFormContext } from "react-hook-form";
import React, { useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { WorkStatus, WorkType } from "@/db/schema";
import { authorQuery, userQuery, userWorksQuery } from "@/lib/queries";
import { useId } from "react";

import { CheckIcon, ChevronDown, XIcon } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { TAGS } from "@/constants/tags";
import { useWorkDraft } from "@/hooks/use-work-draft";
import { client } from "@/lib/orpc.client";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { fileToBase64, transformSlug } from "@/lib/utils";
import { toast } from "sonner";
import { getQueryClient } from "@/lib/query-client";

// Utility function to convert title to slug
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
}

const CustomTagsSelect = (props: { isDisabled?: boolean }) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Get form context to access selected work type and tags
  const { watch, setValue } = useFormContext();
  const workType = watch("type") as WorkType;
  const selectedValues: string[] = watch("tags") || [];

  // Build tag groups
  const generalTags = TAGS.general.map((tag) => ({
    value: tag,
    label: tag,
    group: "General",
  }));
  const typeTags =
    TAGS[workType]?.map((tag) => ({
      value: tag,
      label: tag,
      group: workType,
    })) || [];

  // Combine for rendering
  const tagGroups = [
    { label: "General Tags", tags: generalTags },
    {
      label: `${workType[0].toUpperCase() + workType.slice(1)} Tags`,
      tags: typeTags,
    },
  ];

  const toggleSelection = (value: string) => {
    if (selectedValues.includes(value)) {
      setValue(
        "tags",
        selectedValues.filter((v: string) => v !== value)
      );
    } else {
      setValue("tags", [...selectedValues, value]);
    }
  };

  const removeSelection = (value: string) => {
    setValue(
      "tags",
      selectedValues.filter((v: string) => v !== value)
    );
  };

  const maxShownItems = 5;
  const visibleItems = expanded
    ? selectedValues
    : selectedValues.slice(0, maxShownItems);
  const hiddenCount = selectedValues.length - visibleItems.length;

  return (
    <div className="w-full space-y-2">
      <Label htmlFor={id}>Tags</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            disabled={props.isDisabled}
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-8 w-full justify-between dark:bg-secondary/40 border"
          >
            <div className="flex flex-wrap items-center gap-1 pe-2.5">
              {selectedValues.length > 0 ? (
                <>
                  {visibleItems.map((val) => (
                    <Badge key={val} variant="outline">
                      {val}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelection(val);
                        }}
                        asChild
                      >
                        <span>
                          <XIcon className="size-3" />
                        </span>
                      </Button>
                    </Badge>
                  ))}
                  {hiddenCount > 0 || expanded ? (
                    <Badge
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((prev) => !prev);
                      }}
                    >
                      {expanded ? "Show Less" : `+${hiddenCount} more`}
                    </Badge>
                  ) : null}
                </>
              ) : (
                <span className="text-muted-foreground">Select tags</span>
              )}
            </div>
            <ChevronDown
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tag found.</CommandEmpty>
              {tagGroups.map((group, idx) => (
                <React.Fragment key={group.label}>
                  <CommandGroup heading={group.label}>
                    {group.tags.map((tag) => (
                      <CommandItem
                        key={tag.value}
                        value={tag.value}
                        onSelect={() => toggleSelection(tag.value)}
                      >
                        <span className="truncate">{tag.label}</span>
                        {selectedValues.includes(tag.value) && (
                          <CheckIcon size={16} className="ml-auto" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {idx < tagGroups.length - 1 && <CommandSeparator />}
                </React.Fragment>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

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

export function CreateWorkForm() {
  const { setWorkDraft } = useWorkDraft();
  const { isPending: _isPending, data: userData } = userQuery();
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
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
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      type: WorkType.STORY,
      status: WorkStatus.DRAFT,
    },
  });

  // Watch title changes and auto-update slug if not manually edited
  const titleValue = form.watch("title");

  useEffect(() => {
    if (!isSlugManuallyEdited && titleValue) {
      const generatedSlug = titleToSlug(titleValue);
      form.setValue("slug", generatedSlug);
    }
  }, [titleValue, isSlugManuallyEdited, form]);

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
      // Initialize keys
      groupedTags.general = [];
      Object.values(WorkType).forEach((type) => {
        groupedTags[type] = [];
      });

      // Categorize tags
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

    let cover: Buffer | null = null;
    if (data.cover instanceof File) {
      const arrBuffer = await data.cover.arrayBuffer();
      cover = Buffer.from(arrBuffer);
    }

    await client.work
      .create({
        ...data,
        authorId: userData.id,
        slug: data.slug,
        id: nanoid(),
        tags: data.tags ? groupedTags : null,
        cover,
      })
      .catch((error) => {
        console.error("Error creating work:", error);
        toast.error("Failed to create work. Please try again.");
      });
    invalidateWorks();
    router.push(
      ROUTES.dashboard.works.bySlug(transformSlug(data.slug, userData.id))
    );
    setLoading(false);
  }
  const isPending = _isPending;
  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col py-2 lg:py-5 w-full mx-auto rounded-md gap-2"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="w-full p-2 lg:px-4">
                <FormLabel>Title*</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g: Time Dilation"
                    type={"text"}
                    disabled={isPending || loading}
                    autoFocus
                    value={field.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem className="w-full p-2 lg:px-4">
                <FormLabel>Slug*</FormLabel>
                <FormControl>
                  <Input
                    placeholder="auto-generated from title"
                    type={"text"}
                    value={field.value}
                    disabled={isPending || loading}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val);
                      // Mark as manually edited when user types
                      setIsSlugManuallyEdited(true);
                    }}
                    onFocus={() => {
                      // Mark as manually edited when user focuses on the field
                      setIsSlugManuallyEdited(true);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Immutable identifier for your work (auto-generated from title)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-fulld p-2 lg:px-4">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    disabled={isPending || loading}
                    placeholder="The sky was blue, but the sun was orange..."
                    className="resize-none"
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => {
              const options = [
                { value: WorkType.STORY, label: "Story" },
                { value: WorkType.SHORT_STORY, label: "Short Story" },
                { value: WorkType.POEM, label: "Poetry" },
                { value: WorkType.FANFICTION, label: "Fanfiction" },
              ];
              return (
                <FormItem className="w-full p-2 lg:px-4">
                  <FormLabel>Type*</FormLabel>
                  <Select
                    disabled={isPending || loading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options.map(({ label, value }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => {
              const options = [
                { value: WorkStatus.DRAFT, label: "Draft" },
                { value: WorkStatus.PUBLISHED, label: "Published" },
              ];
              return (
                <FormItem className="w-full p-2 lg:px-4">
                  <FormLabel>Initial Status*</FormLabel>
                  <Select
                    disabled={isPending || loading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options.map(({ label, value }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="cover"
            render={({ field }) => {
              return (
                <FormItem className="w-full p-2 lg:px-4">
                  <FormLabel>Cover Image</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isPending || loading}
                      type="file"
                      accept="image/*"
                      className=""
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file);
                        } else {
                          field.onChange(undefined);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="tags"
            render={() => (
              <FormItem className="w-full p-2 lg:px-4">
                <CustomTagsSelect isDisabled={isPending || loading} />
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="py-3 w-full">
            <Separator />
          </div>
          <div className="flex justify-end grow items-center w-full pt-3 px-2 lg:px-4">
            <Button
              disabled={isPending || loading}
              className="rounded-lg w-full"
              size="sm"
            >
              {isPending ? "Loading..." : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
