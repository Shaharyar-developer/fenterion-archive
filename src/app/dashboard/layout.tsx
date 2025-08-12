import { SiteHeader } from "@/components/blocks/dashboard/navbar";
import { AppSidebar } from "@/components/blocks/dashboard/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/db";
import { UserRole } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(ROUTES.auth.signIn);
  }
  const user = await db.query.user.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, session.user.id);
    },
  });
  if (
    !user ||
    (user.role !== UserRole.AUTHOR && user.role !== UserRole.ADMIN)
  ) {
    redirect(ROUTES.auth.signIn);
  }

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
