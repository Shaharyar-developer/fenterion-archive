import { db } from "@/db";
import { ROUTES } from "@/lib/routes";
import { getCoverUrl } from "@/lib/utils";
import { redirect } from "next/navigation";
import { chapters, works } from "@/db/schema";
import WorkOverview from "@/components/works/work-overview";
import { eq } from "drizzle-orm";
import { ChapterProvider } from "@/providers/chapter";
import { getQueryClient } from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { chapterAndVersionOptions } from "@/lib/queries";
import { useChapter } from "@/hooks/use-chapter";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { chapter } = useChapter();
  const { slug } = await params;
  const queryClient = getQueryClient();
  void (await queryClient.prefetchQuery(chapterAndVersionOptions(slug)));
  const work = await db.query.works.findFirst({
    where(fields, operators) {
      return operators.eq(fields.slug, slug);
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
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ChapterProvider chapterSlug={slug}>
        <WorkOverview
          work={{ ...work, coverUrl, content: "" }}
          chapters={workChapters}
        />
      </ChapterProvider>
    </HydrationBoundary>
  );
}
