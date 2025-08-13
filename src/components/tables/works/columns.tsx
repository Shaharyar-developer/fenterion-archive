"use client";
import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import type { Work } from "@/db/schema";
import {
  TitleCell,
  StatusBadge,
  TypeBadge,
  TagsCell,
  DateCell,
  WordCountCell,
  RowActions,
} from "./cells";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const columns: ColumnDef<Work>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[1px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[1px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 32,
    minSize: 32,
    maxSize: 32,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 font-semibold"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title <ArrowUpDown className="ml-1 size-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="group">
        <TitleCell work={row.original} />
      </div>
    ),
    sortingFn: "alphanumeric",
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Type <ArrowUpDown className="ml-1 size-3.5" />
      </Button>
    ),
    cell: ({ row }) => <TypeBadge type={row.original.type} />,
    sortingFn: "alphanumeric",
    filterFn: (row, id, value: string[]) => {
      if (!value?.length) return true;
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status <ArrowUpDown className="ml-1 size-3.5" />
      </Button>
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    sortingFn: "alphanumeric",
    filterFn: (row, id, value: string[]) => {
      if (!value?.length) return true;
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "wordCount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Words <ArrowUpDown className="ml-1 size-3.5" />
      </Button>
    ),
    cell: ({ row }) => <WordCountCell count={row.original.wordCount ?? null} />,
    sortingFn: "basic",
    size: 100,
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => <TagsCell tags={row.original.tags || {}} />,
    enableSorting: false,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Updated <ArrowUpDown className="ml-1 size-3.5" />
      </Button>
    ),
    cell: ({ row }) => <DateCell date={row.original.updatedAt as any} />,
    sortingFn: "datetime",
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created <ArrowUpDown className="ml-1 size-3.5" />
      </Button>
    ),
    cell: ({ row }) => <DateCell date={row.original.createdAt as any} />,
    sortingFn: "datetime",
    enableHiding: true,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <RowActions work={row.original} />,
    enableSorting: false,
    enableHiding: false,
    size: 48,
    minSize: 48,
    maxSize: 64,
  },
];
