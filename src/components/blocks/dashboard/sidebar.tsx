"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { DashboardCommandMenu } from "./command";
import { Separator } from "../../ui/separator";
import { DashboardFooter } from "./footer";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Home, Library } from "lucide-react";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import * as m from "motion/react";
import Link from "next/link";

const items = [
  {
    title: "Home",
    url: ROUTES.dashboard.root,
    icon: Home,
  },
  {
    title: "Works",
    url: ROUTES.dashboard.works.root,
    icon: Library,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isPending, crumbs] = useBreadcrumbs();

  // Derive the deepest breadcrumb that still has an href (represents the
  // closest navigable parent of the current page). This lets us highlight
  // the appropriate sidebar entry without needing the pathname directly.
  const activeHref = React.useMemo(() => {
    for (let i = crumbs.length - 1; i >= 0; i--) {
      if (crumbs[i]?.href) return crumbs[i]!.href as string;
    }
    // Fallback to dashboard root if nothing else matches.
    return ROUTES.dashboard.root;
  }, [crumbs]);

  return (
    <>
      <Sidebar
        className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
        {...props}
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DashboardCommandMenu />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <Separator />
        <SidebarContent className="py-8">
          {items.map((item) => {
            const isActive = item.url === activeHref;
            return (
              <SidebarMenuItem className="px-1 relative" key={item.title}>
                <div
                  className={cn(
                    "absolute h-full w-1 bg-primary left-0 rounded-r-3xl",
                    !isActive && "hidden"
                  )}
                />
                <SidebarMenuButton
                  size={"lg"}
                  isActive={isActive}
                  disabled={isActive}
                  asChild={!isActive}
                  className={cn(
                    "transition-all rounded-3xl bg-secondary/25",
                    isActive &&
                      "pointer-events-none cursor-default rounded-l-none"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive ? (
                    <>
                      <item.icon />
                      <span>{item.title}</span>
                    </>
                  ) : (
                    <Link prefetch href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarContent>
        <Separator />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DashboardFooter />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
