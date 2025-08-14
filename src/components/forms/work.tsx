import * as z from "zod";
import { distance as levenshteinDistance } from "fastest-levenshtein";
import { useFormContext, UseFormReturn } from "react-hook-form";
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
import { Work, WorkStatus, WorkType } from "@/db/schema";
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
import { Button } from "../ui/button";
import { slugify } from "@/lib/utils";

const CustomTagsSelect = (props: { isDisabled?: boolean }) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { watch, setValue } = useFormContext();
  const workType = watch("type") as WorkType;
  const selectedValues: string[] = watch("tags") || [];
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
  const maxShownItems = 2;
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
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={props.isDisabled}
            className="h-auto w-full justify-between bg-secondary/40"
          >
            <div className="flex flex-wrap items-center gap-1 pe-2.5">
              {selectedValues.length > 0 ? (
                <>
                  {visibleItems.map((val) => {
                    const tag = generalTags
                      .concat(typeTags)
                      .find((t) => t.value === val);
                    return tag ? (
                      <Badge key={val} variant="outline">
                        {tag.label}
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
                    ) : null;
                  })}
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

interface GenericWorkFormProps {
  isPending?: boolean;
  loading?: boolean;
  onSubmit: (data: any) => void;
  form: UseFormReturn<{
    title: string;
    slug: string;
    type: WorkType;
    status: WorkStatus;
    description?: string | undefined;
    cover?: File | undefined;
    tags?: string[] | undefined;
  }>;
  submitLabel?: string;
  hideFields?: string[];
  readOnlyFields?: string[];
}

export const GenericWorkForm = ({
  isPending,
  loading,
  onSubmit,
  form,
  submitLabel = "Submit",
  hideFields = [],
  readOnlyFields = [],
}: GenericWorkFormProps) => {
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const titleValue = form.watch("title");
  const [titleError, setTitleError] = useState<string | null>(null);
  // Store the initial title for edit mode
  const [initialTitle] = useState(() => form.getValues("title"));
  // Set max allowed Levenshtein distances
  const MAX_TITLE_DISTANCE = 8;
  const MAX_TITLE_DISTANCE_IF_CONTAINS = 18;
  useEffect(() => {
    if (!isSlugManuallyEdited) {
      if (titleValue) {
        const generatedSlug = slugify(titleValue);
        form.setValue("slug", generatedSlug);
      } else {
        form.setValue("slug", "");
      }
    }
    // If editing, check Levenshtein distance
    if (initialTitle && titleValue !== initialTitle) {
      const dist = levenshteinDistance(initialTitle, titleValue);
      const containsOriginal = titleValue
        .toLowerCase()
        .includes(initialTitle.toLowerCase());
      const allowedDistance = containsOriginal
        ? MAX_TITLE_DISTANCE_IF_CONTAINS
        : MAX_TITLE_DISTANCE;
      if (dist > allowedDistance) {
        setTitleError(
          containsOriginal
            ? `Title is too different from the original, Please keep changes minimal (max distance: ${MAX_TITLE_DISTANCE_IF_CONTAINS}).`
            : `Title is too different from the original. Please keep changes minimal (max distance: ${MAX_TITLE_DISTANCE}).`
        );
      } else {
        setTitleError(null);
      }
    } else {
      setTitleError(null);
    }
  }, [titleValue, isSlugManuallyEdited, form, initialTitle]);
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col py-2 lg:py-5 w-full mx-auto rounded-md gap-2"
      >
        {hideFields.includes("title") ? null : (
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
                    disabled={
                      isPending || loading || readOnlyFields.includes("title")
                    }
                    autoFocus
                    value={field.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val);
                    }}
                    readOnly={readOnlyFields.includes("title")}
                  />
                </FormControl>
                {titleError && (
                  <div className="text-destructive text-xs mt-1">
                    {titleError}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {hideFields.includes("slug") ? null : (
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
                    disabled
                    readOnly
                  />
                </FormControl>
                <FormDescription>
                  Immutable identifier for your work (auto-generated from title)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {hideFields.includes("description") ? null : (
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
        )}
        {hideFields.includes("type") ? null : (
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
        )}
        {hideFields.includes("status") ? null : (
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
        )}
        {hideFields.includes("cover") ? null : (
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
        )}
        {hideFields.includes("tags") ? null : (
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
        )}
        <div className="py-3 w-full">
          <Separator />
        </div>
        <div className="flex justify-end grow items-center w-full pt-3 px-2 lg:px-4">
          <Button
            disabled={isPending || loading}
            className="w-full"
            type="submit"
          >
            {isPending || loading ? "Loading..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};
