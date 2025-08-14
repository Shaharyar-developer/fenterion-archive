"use client";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { userQuery } from "@/lib/queries";
import { ROUTES } from "@/lib/routes";
import { Cog, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { UserProfile } from "../user-profile";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { useEffect } from "react";

export function DashboardFooter() {
  const { isPending, data } = userQuery();
  const router = useRouter();
  useEffect(() => {
  if (!isPending && !data) {
    router.push(ROUTES.auth.signIn);
  }
}, [isPending, data, router]);
  if (isPending) {
    return (
      <div className="space-y-2">
        <SidebarMenuButton size="lg" asChild>
          <Skeleton className="h-10 w-full" />
        </SidebarMenuButton>
        <SidebarMenuButton size="lg" asChild>
          <Skeleton className="h-10 w-full" />
        </SidebarMenuButton>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-2">
      <SidebarMenuButtonWrapper
        href={ROUTES.dashboard.works.new}
        icon={<Plus className="size-4" />}
        activePath={ROUTES.dashboard.root}
      >
        Create Work
      </SidebarMenuButtonWrapper>

      <UserProfile user={data}>
        <SidebarMenuButton size="lg" asChild>
          <div>
            <div className="bg-secondary text-secondary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Cog className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{data.name}</span>
              <span className="truncate text-muted-foreground text-xs">
                {data.email}
              </span>
            </div>
          </div>
        </SidebarMenuButton>
      </UserProfile>
    </div>
  );
}

function SidebarMenuButtonWrapper({
  href,
  children,
  icon,
  activePath,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  activePath: string;
}) {
  const segments = useSelectedLayoutSegments();

  const normalizedActivePath = activePath.replace(/^\/dashboard/, "");
  const activeSegments = normalizedActivePath.split("/").filter(Boolean);
  const isActive =
    (activeSegments.length === 0 && segments.length === 0) ||
    (segments.length === activeSegments.length &&
      segments.every((seg, i) => seg === activeSegments[i]));

  return (
    <SidebarMenuButton
      size="lg"
      className={`border text-secondary-foreground transition-all dark:hover:bg-secondary/50 cursor-pointer ${!isActive && "hidden"}`}
      asChild
    >
      <Link href={href}>
        <div className="bg-secondary text-secondary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
          {icon}
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{children}</span>
        </div>
      </Link>
    </SidebarMenuButton>
  );
}
