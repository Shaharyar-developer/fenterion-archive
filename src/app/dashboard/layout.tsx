import AuthorApplicationDialog from "@/components/blocks/author-application";
import { SiteHeader } from "@/components/blocks/dashboard/navbar";
import { AppSidebar } from "@/components/blocks/dashboard/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/db";
import { UserRole } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

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
  const author = user?.id
    ? await db.query.authors.findFirst({
        where(fields, operators) {
          return operators.eq(fields.userId, user.id);
        },
      })
    : null;

  if (!user) {
    redirect(ROUTES.auth.signIn);
  }

  if (author && user.role !== UserRole.AUTHOR && user.role !== UserRole.ADMIN) {
    return (
      <div className="max-w-xl flex items-center justify-center h-screen w-full mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Author Application Pending</CardTitle>
            <CardDescription>
              Your application is under review. Please wait for approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Thank you for your interest in becoming an author!</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href={ROUTES.home}>Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (user.role !== UserRole.AUTHOR && user.role !== UserRole.ADMIN) {
    return (
      <>
        <AuthorApplicationDialog />
      </>
    );
  }

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <Suspense>
        <SidebarProvider className="flex flex-col">
          <SiteHeader />
          <div className="flex flex-1">
            <AppSidebar />
            <SidebarInset>{children}</SidebarInset>
          </div>
        </SidebarProvider>
      </Suspense>
    </div>
  );
}
