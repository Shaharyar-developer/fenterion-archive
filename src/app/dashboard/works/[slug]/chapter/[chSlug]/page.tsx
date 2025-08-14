import { db } from "@/db";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; chSlug: string }>;
}) {
  const { slug, chSlug } = await params;
  const work = await db.query.chapters.findFirst({
    where(fields, operators) {
      return operators.eq(fields.slug, chSlug);
    },
  });
  return (
    <div>
      {slug} {chSlug}
    </div>
  );
}
