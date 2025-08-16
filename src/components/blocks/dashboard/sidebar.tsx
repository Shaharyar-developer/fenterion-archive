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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { DashboardCommandMenu } from "./command";
import { Separator } from "../../ui/separator";
import { DashboardFooter } from "./footer";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Home, Library, ChevronRight, FileText } from "lucide-react";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { motion as m } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { workChaptersBySlugQuery } from "@/lib/queries";

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
  const params = useParams();
  const workSlug = React.useMemo(() => {
    // Only consider if we are somewhere under /dashboard/works/[slug]
    // Find a breadcrumb with an href like /dashboard/works/{slug}
    const workCrumb = crumbs.find((c) =>
      /^\/dashboard\/works\/[^/]+$/.test(c.href || "")
    );
    if (workCrumb) {
      const parts = workCrumb.href!.split("/");
      return parts[parts.length - 1];
    }
    // Fallback: attempt from next/navigation params if present
    const slugParam = (params as any)?.slug;
    if (typeof slugParam === "string") return slugParam;
    if (Array.isArray(slugParam)) return slugParam[0];
    return undefined;
  }, [crumbs, JSON.stringify(params)]);

  const { data: workAndChapters } = workChaptersBySlugQuery(workSlug);

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
        <SidebarContent className="py-2">
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

          {/* Chapters list for active work */}
          {workAndChapters?.work && (
            <Collapsible
              key={workAndChapters.work.id}
              defaultOpen
              className="group/collapsible"
            >
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel
                  asChild
                  className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm px-2"
                >
                  <CollapsibleTrigger asChild className="">
                    <SidebarMenuButton
                      size={"lg"}
                      className={cn(
                        "relative transition-colors rounded-3xl overflow-hidden h-12"
                      )}
                    >
                      <span
                        className="truncate max-w-[14ch]"
                        title={workAndChapters.work.title}
                      >
                        {workAndChapters.work.title || "Work"}
                      </span>
                      <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {workAndChapters.chapters
                        .slice()
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                        .map((ch) => {
                          const chUrl = `${ROUTES.dashboard.works.root}/${workAndChapters.work.slug}/chapter/${ch.slug}`;
                          const isActiveChapter = activeHref === chUrl;
                          return (
                            <SidebarMenuItem
                              key={ch.id}
                              className="px-2 relative"
                            >
                              {isActiveChapter && (
                                <m.div
                                  layoutId="sidebar-accent"
                                  className="absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-1 bg-primary rounded-r-3xl"
                                  transition={{
                                    type: "spring",
                                    stiffness: 320,
                                    damping: 30,
                                  }}
                                />
                              )}
                              <m.div
                                whileHover={
                                  !isActiveChapter ? { x: 2 } : undefined
                                }
                                whileTap={
                                  !isActiveChapter ? { scale: 0.97 } : undefined
                                }
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 30,
                                  mass: 0.8,
                                }}
                              >
                                <SidebarMenuButton
                                  size={"sm"}
                                  isActive={isActiveChapter}
                                  disabled={isActiveChapter}
                                  asChild={!isActiveChapter}
                                  className={cn(
                                    "relative transition-colors overflow-hidden gap-2 justify-start",
                                    isActiveChapter &&
                                      "pointer-events-none cursor-default shadow-sm"
                                  )}
                                  aria-current={
                                    isActiveChapter ? "page" : undefined
                                  }
                                >
                                  {isActiveChapter ? (
                                    <>
                                      <m.span
                                        key={`chapter-icon-active-${ch.id}`}
                                        layout
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 300,
                                          damping: 25,
                                        }}
                                      >
                                        <FileText className="size-4" />
                                      </m.span>
                                      <m.span
                                        key={`chapter-text-active-${ch.id}`}
                                        layout
                                        initial={{ y: 4, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 300,
                                          damping: 26,
                                        }}
                                        className="truncate"
                                        title={ch.title}
                                      >
                                        {ch.title || "Chapter"}
                                      </m.span>
                                    </>
                                  ) : (
                                    <Link
                                      prefetch
                                      href={chUrl}
                                      className="flex items-center gap-2 w-full"
                                    >
                                      <m.span
                                        key={`chapter-icon-inactive-${ch.id}`}
                                        layout
                                        initial={false}
                                        whileHover={{ rotate: 2 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 260,
                                          damping: 18,
                                        }}
                                      >
                                        <FileText className="size-4" />
                                      </m.span>
                                      <m.span
                                        key={`chapter-text-inactive-${ch.id}`}
                                        layout
                                        initial={false}
                                        transition={{
                                          type: "spring",
                                          stiffness: 260,
                                          damping: 24,
                                        }}
                                        className="truncate"
                                        title={ch.title}
                                      >
                                        {ch.title || "Chapter"}
                                      </m.span>
                                    </Link>
                                  )}
                                </SidebarMenuButton>
                              </m.div>
                            </SidebarMenuItem>
                          );
                        })}
                      {!workAndChapters.chapters?.length && (
                        <div className="text-xs text-muted-foreground px-4 py-1">
                          No chapters yet
                        </div>
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )}
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
