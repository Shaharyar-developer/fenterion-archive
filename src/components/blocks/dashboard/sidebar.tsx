"use client";

import * as React from "react";
import { Command, Command as CommandIcon, Plus } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { DashboardCommandMenu } from "./command";
import { Separator } from "../../ui/separator";
import { DashboardFooter } from "./footer";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <SidebarContent></SidebarContent>
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
