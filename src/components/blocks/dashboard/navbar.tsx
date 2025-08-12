"use client";

import { SidebarIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const [isPending, crumbs] = useBreadcrumbs();
  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          {isPending ? (
            <>
              <BreadcrumbList>
                {Array.from({ length: 3 }).map((_, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        <Skeleton className="h-4 w-32" />
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                    {index < 2 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </>
          ) : (
            <BreadcrumbList>
              {crumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem key={index}>
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < crumbs.length - 1 && (
                    <BreadcrumbSeparator key={`separator-${index}`} />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          )}
        </Breadcrumb>
      </div>
    </header>
  );
}
