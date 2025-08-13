import { WorkOverviewWork } from "./types";

export function Header({ work }: { work: WorkOverviewWork }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-semibold leading-tight tracking-tight">
        {work.title}
      </h1>
      <div className="text-muted-foreground text-sm">/{work.slug}</div>
    </div>
  );
}
