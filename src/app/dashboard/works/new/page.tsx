import { WorkDraftProvider } from "@/providers/work-draft";
import { CreateWorkForm } from "./form";
import { WorkPreview } from "@/components/blocks/works/preview";

export default function Page() {
  return (
    <WorkDraftProvider>
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        <div className="flex flex-col h-full">
          <CreateWorkForm />
        </div>
        <div className="bg-sidebar border-l h-full w-full">
          <WorkPreview />
        </div>
      </div>
    </WorkDraftProvider>
  );
}
