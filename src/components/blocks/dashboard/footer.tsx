import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { userQuery } from "@/lib/queries";
import { ROUTES } from "@/lib/routes";
import { Cog, Plus, PlusSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { UserProfile } from "../user-profile";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function DashboardFooter() {
  const { isPending, data } = userQuery();
  const router = useRouter();

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
    router.push(ROUTES.auth.signIn);
    return null;
  }

  return (
    <div className="space-y-2">
      <SidebarMenuButton
        size="lg"
        className="border text-secondary-foreground transition-all hover:bg-secondary/50 cursor-pointer"
        asChild
      >
        <Link href={ROUTES.dashboard.works.new}>
          <div className="bg-secondary text-secondary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Plus className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Create Work</span>
          </div>
        </Link>
      </SidebarMenuButton>
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
