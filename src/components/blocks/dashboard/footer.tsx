import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { userQuery } from "@/lib/queries";
import { ROUTES } from "@/lib/routes";
import { Cog } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { UserProfile } from "../user-profile";

export function DashboardFooter() {
  const { isPending, data } = userQuery();
  const router = useRouter();

  if (isPending) {
    return (
      <SidebarMenuButton size="lg" asChild>
        <Skeleton className="h-full w-full" />
      </SidebarMenuButton>
    );
  }

  if (!data) {
    router.push(ROUTES.auth.signIn);
    return null;
  }

  return (
    <>
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
    </>
  );
}
