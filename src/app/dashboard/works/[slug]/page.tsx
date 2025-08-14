import { db } from "@/db";
import { ROUTES } from "@/lib/routes";
import { getCoverUrl } from "@/lib/utils";
import { redirect } from "next/navigation";
import { chapters, works } from "@/db/schema";
import WorkOverview from "@/components/works/work-overview";
import { eq } from "drizzle-orm";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const work = await db.query.works.findFirst({
    where(fields, operators) {
      return operators.eq(fields.slug, slug);
    },
    columns: {
      id: true,
      authorId: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      type: true,
      wordCount: true,
      coverKey: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!work) {
    redirect(ROUTES.dashboard.root);
  }

  const workChapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.workId, work.id))
    .orderBy(chapters.position);

  const coverUrl = work.coverKey ? getCoverUrl(work.coverKey) : null;

  return (
    <WorkOverview
      work={{ ...work, coverUrl, content: "" }}
      chapters={workChapters}
    />
  );
}
