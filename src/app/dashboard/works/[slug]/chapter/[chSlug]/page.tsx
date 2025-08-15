import { db } from "@/db";
import ChapterEditorView from "./ChapterEditorView";
import { notFound } from "next/navigation";
import { ClientOnly } from "@/components/ui/client-only";
import { ChapterProvider } from "@/providers/chapter";

// NOTE: Interactive editor UI moved to client component below

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; chSlug: string }>;
}) {
  const { chSlug, slug } = await params;

  return (
    <ChapterProvider chapterSlug={chSlug}>
      <ClientOnly>
        <ChapterEditorView workSlug={slug} />
      </ClientOnly>
    </ChapterProvider>
  );
}