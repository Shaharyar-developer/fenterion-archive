import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { WorkOverviewWork } from "./types";

export function MetadataCard({ work }: { work: WorkOverviewWork }) {
  const tagsEmpty = !work.tags || Object.keys(work.tags).length === 0;
  const tagEntries = useMemo(
    () =>
      work.tags
        ? Object.entries(work.tags).flatMap(([group, vals]) =>
            vals.map((value) => ({ group, value }))
          )
        : [],
    [work.tags]
  );
  return (
    <Card className="w-3xl h-full">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between pr-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4" /> Metadata
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <div className="text-xs font-semibold mb-2">Description</div>
          {work.description ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
                {work.description}
              </p>
            </div>
          ) : (
            <div className="border border-dashed rounded-md p-4 text-sm flex items-center justify-between text-muted-foreground">
              <span>No description added yet.</span>
              <Button size="sm" variant="ghost" className="h-7 px-2">
                Add
              </Button>
            </div>
          )}
        </div>
        <div>
          <div className="text-xs font-semibold mb-2">Tags</div>
          {tagsEmpty ? (
            <div className="border border-dashed rounded-md p-4 text-sm flex items-center justify-between text-muted-foreground">
              <span>No tags</span>
              <Button size="sm" variant="ghost" className="h-7 px-2">
                Add
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tagEntries.map((t) => (
                <Badge
                  key={`${t.group}:${t.value}`}
                  variant="outline"
                  className="gap-1"
                >
                  <span className="text-muted-foreground">{t.group}:</span>{" "}
                  {t.value}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
