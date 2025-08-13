"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { useLocalStorage } from "@uidotdev/usehooks";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rows2Icon, Rows3Icon, Rows4Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Settings2,
  X,
  LayoutList,
  ListFilter,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const storageKey = "worksTableState:v1";
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [density, setDensity] = useLocalStorage<
    "compact" | "standard" | "comfortable"
  >("worksTableDensity:v1", "standard");

  // Load persisted state (except density)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.sorting) setSorting(parsed.sorting);
        if (parsed.columnFilters) setColumnFilters(parsed.columnFilters);
        if (parsed.columnVisibility)
          setColumnVisibility(parsed.columnVisibility);
      }
    } catch {}
  }, []);

  // Persist state (except density, which is handled by useLocalStorage)
  React.useEffect(() => {
    const toStore = JSON.stringify({
      sorting,
      columnFilters,
      columnVisibility,
    });
    try {
      localStorage.setItem(storageKey, toStore);
    } catch {}
  }, [sorting, columnFilters, columnVisibility]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      const v = String(row.getValue(columnId) ?? "").toLowerCase();
      return v.includes(filterValue.toLowerCase());
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Apply global filter across a subset of columns (title, status, type, tags)
  React.useEffect(() => {
    table.setGlobalFilter(globalFilter);
  }, [globalFilter, table]);

  function clearAll() {
    setSorting([]);
    setColumnFilters([]);
    setRowSelection({});
    setColumnVisibility({});
    setGlobalFilter("");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search works..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-8 w-[220px]"
          />
          {globalFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGlobalFilter("")}
            >
              {" "}
              <X className="size-4" />{" "}
            </Button>
          )}
        </div>
        {/* Density Dropdown */}
        <Select value={density} onValueChange={(v) => setDensity(v as any)}>
          <SelectTrigger className="" size="sm" aria-label="Density select">
            <SelectValue placeholder="Density" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Density</SelectLabel>
              <SelectItem value="compact">
                <div className="flex items-center gap-2">
                  <Rows4Icon className="h-4 w-4" />
                  Compact
                </div>
              </SelectItem>
              <SelectItem value="standard">
                <div className="flex items-center gap-2">
                  <Rows3Icon className="h-4 w-4" />
                  Standard
                </div>
              </SelectItem>
              <SelectItem value="comfortable">
                <div className="flex items-center gap-2">
                  <Rows2Icon className="h-4 w-4" />
                  Comfortable
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size={"sm"} className="gap-1">
              <Settings2 className="size-4" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-auto">
            {table
              .getAllLeafColumns()
              .filter((c) => c.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) => column.toggleVisibility(!!v)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        {(sorting.length || columnFilters.length || globalFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="gap-1"
          >
            <ListFilter className="size-4" /> Reset
          </Button>
        )}
        <div className="ml-auto text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} row(s)
          {Object.keys(rowSelection).length > 0 && (
            <span className="ml-2">
              {Object.keys(rowSelection).length} selected
            </span>
          )}
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table
          className={
            density === "compact"
              ? "[&_td]:py-px [&_th]:py-px"
              : density === "standard"
                ? "[&_td]:py-1 [&_th]:py-1"
                : "[&_td]:py-2 [&_th]:py-2"
          }
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    density === "compact"
                      ? "h-8"
                      : density === "standard"
                        ? "h-10"
                        : "h-12"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
