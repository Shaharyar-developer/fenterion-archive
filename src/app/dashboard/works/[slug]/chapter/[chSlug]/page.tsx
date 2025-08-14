import { db } from "@/db";
import ChapterEditorView from "./ChapterEditorView";
import { notFound } from "next/navigation";
import { ClientOnly } from "@/components/ui/client-only";

// NOTE: Interactive editor UI moved to client component below

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; chSlug: string }>;
}) {
  const { chSlug } = await params;

  const chapter = await db.query.chapters.findFirst({
    where(fields, operators) {
      return operators.eq(fields.slug, chSlug);
    },
    columns: {
      id: true,
      title: true,
      slug: true,
      content: true,
      status: true,
      position: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!chapter) {
    notFound();
  }

  return (
    <ClientOnly>
      <ChapterEditorView chapter={chapter} />
    </ClientOnly>
  );
}

// client view imported above

