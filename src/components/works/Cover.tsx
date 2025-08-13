import { BookText } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkOverviewWork } from "./types";

export function Cover({
  work,
  initials,
}: {
  work: WorkOverviewWork;
  initials: string;
}) {
  if (work.coverUrl) {
    return (
      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border bg-muted relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={work.coverUrl}
          alt={`Cover image for ${work.title}`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "aspect-[3/4] w-full rounded-lg border flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary/5 via-muted to-background",
        "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_1px_1px,oklch(var(--foreground)_/_0.12)_1px,transparent_0)] before:[background-size:22px_22px]"
      )}
    >
      <BookText
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 -z-10 text-muted"
        aria-hidden
      />
      <span className="text-6xl font-semibold tracking-tight text-muted-foreground select-none">
        {initials}
      </span>
    </div>
  );
}
