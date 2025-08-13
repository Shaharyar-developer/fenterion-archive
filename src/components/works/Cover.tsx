import { WorkOverviewWork } from "./types";
import { DefaultCover } from "./DefaultCover";

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
  return <DefaultCover title={work.title} initials={initials} />;
}
