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
import { motion as m } from "motion/react";
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
              <SidebarMenuItem className="px-2 relative" key={item.title}>
                {isActive && (
                  <m.div
                    layoutId="sidebar-accent"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-1 bg-primary rounded-r-3xl"
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  />
                )}
                <m.div
                  whileHover={!isActive ? { x: 2 } : undefined}
                  whileTap={!isActive ? { scale: 0.97 } : undefined}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                  }}
                >
                  <SidebarMenuButton
                    size={"lg"}
                    isActive={isActive}
                    disabled={isActive}
                    asChild={!isActive}
                    className={cn(
                      "relative transition-colors rounded-3xl overflow-hidden",
                      isActive && "pointer-events-none cursor-default shadow-sm"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isActive ? (
                      <>
                        <m.span
                          key="icon-active"
                          layout
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                        >
                          <item.icon />
                        </m.span>
                        <m.span
                          key="text-active"
                          layout
                          initial={{ y: 4, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 26,
                          }}
                        >
                          {item.title}
                        </m.span>
                      </>
                    ) : (
                      <Link
                        prefetch
                        href={item.url}
                        className="flex items-center gap-2"
                      >
                        <m.span
                          key="icon-inactive"
                          layout
                          initial={false}
                          whileHover={{ rotate: 2 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 18,
                          }}
                        >
                          <item.icon />
                        </m.span>
                        <m.span
                          key="text-inactive"
                          layout
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 24,
                          }}
                        >
                          {item.title}
                        </m.span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </m.div>
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
