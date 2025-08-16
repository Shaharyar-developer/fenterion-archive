"use client";

import React, { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

/**
 * TableInsertPopover
 * Popover to visually choose a table size (up to 5x5 quick grid)
 * or specify custom rows / columns (max 20x20) and insert into TipTap.
 */
export function TableInsertPopover({
  editor,
  defaultWithHeader = true,
}: {
  editor: Editor | null;
  defaultWithHeader?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const maxQuick = 5;
  const maxCustom = 20;

  const dimensionLabel = hover
    ? `${hover.r + 1} × ${hover.c + 1}`
    : `${rows} × ${cols}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Insert table"
          className="h-8 w-8 p-0"
        >
          <Table className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 space-y-3 text-xs" align="start">
        <div className="flex flex-col items-start gap-2">
          <span className="font-medium text-[11px] uppercase tracking-wide text-muted-foreground">
            Table size
          </span>
          <div
            className="grid gap-1 max-w-max mx-auto"
            style={{ gridTemplateColumns: `repeat(${maxQuick}, 1fr)` }}
            onMouseLeave={() => setHover(null)}
          >
            {Array.from({ length: maxQuick }).map((_, r) =>
              Array.from({ length: maxQuick }).map((_, c) => {
                const active = hover && r <= hover.r && c <= hover.c;
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    aria-label={`${r + 1} by ${c + 1} table`}
                    onMouseEnter={() => setHover({ r, c })}
                    onClick={() => {
                      const newRows = r + 1;
                      const newCols = c + 1;
                      setRows(newRows);
                      setCols(newCols);
                      if (editor) {
                        editor
                          .chain()
                          .focus()
                          .insertTable({
                            rows: newRows,
                            cols: newCols,
                            withHeaderRow: defaultWithHeader,
                          })
                          .run();
                      }
                      setOpen(false);
                    }}
                    className={cn(
                      "size-6 rounded border flex items-center justify-center transition-colors",
                      active
                        ? "bg-primary/15 border-primary/50"
                        : "bg-muted/30 hover:bg-muted border-border/40"
                    )}
                  >
                    <span className="sr-only">
                      {r + 1}×{c + 1}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <div className="text-[11px] font-medium tabular-nums text-muted-foreground min-h-[1rem]">
            {dimensionLabel}
          </div>
        </div>
        <div className="relative max-h-px">
          <Separator />
          <div className="absolute -top-1.5 bg-popover px-2 left-1/2 -translate-x-1/2 text-muted-foreground">
            OR
          </div>
        </div>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (editor) {
              editor
                .chain()
                .focus()
                .insertTable({
                  rows,
                  cols,
                  withHeaderRow: defaultWithHeader,
                })
                .run();
            }
            setOpen(false);
          }}
        >
          <div className="flex items-center gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                Rows
              </span>
              <Input
                type="number"
                min={1}
                max={maxCustom}
                value={rows}
                onChange={(e) =>
                  setRows(
                    Math.min(
                      maxCustom,
                      Math.max(1, Number(e.target.value) || 1)
                    )
                  )
                }
                className="w-20 h-8 text-xs"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                Columns
              </span>
              <Input
                type="number"
                min={1}
                max={maxCustom}
                value={cols}
                onChange={(e) =>
                  setCols(
                    Math.min(
                      maxCustom,
                      Math.max(1, Number(e.target.value) || 1)
                    )
                  )
                }
                className="w-20 h-8 text-xs"
              />
            </label>
          </div>
          <Button
            size="sm"
            type="submit"
            variant="outline"
            className="h-8 text-xs"
            aria-label="Insert custom size table"
          >
            Insert {rows}×{cols}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export default TableInsertPopover;
