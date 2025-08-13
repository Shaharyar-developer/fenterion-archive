import { columns } from "@/components/tables/works/columns";
import { Work } from "@/db/schema";
import { DataTable } from "@/components/tables/works/data-table";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

async function getData(userId: string): Promise<Work[]> {
  const res = await db.query.works.findMany({
    where: (work, { eq }) => eq(work.authorId, userId),
  });
  return res;
}

export default async function DemoPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return redirect(ROUTES.home);
  const data = await getData(session.user.id);

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
