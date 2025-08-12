import { WorkDraftProvider } from "@/providers/work-draft";
import { CreateWorkForm } from "./form";
import { WorkPreview } from "@/components/blocks/works/preview";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  return (
    <WorkDraftProvider>
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        <div className="flex flex-col h-full">
          <CreateWorkForm />
        </div>
        <Separator className="mt-12 lg:hidden" />
        <div className="bg-sidebar border-l h-full w-full">
          <WorkPreview />
        </div>
      </div>
    </WorkDraftProvider>
  );
}
