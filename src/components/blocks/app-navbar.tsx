"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { authClient, getInitials } from "@/lib/utils";
import { Session } from "@/lib/auth";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { ChevronDown, Layout, Library } from "lucide-react";
import { userQuery } from "@/lib/queries";
import { User, UserRole } from "@/db/schema";
import { UserProfile } from "./user-profile";

// Left section: Logo/Title
function NavbarBrand() {
  return (
    <h1>
      <Link href={ROUTES.home} className="lg:text-xl font-bold">
        Fenterion Archive
      </Link>
    </h1>
  );
}

// Right section: User actions
function NavbarActions({
  user,
  isPending,
}: {
  user: User | null;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {isPending ? (
        <>
          <Skeleton className="w-20 h-8 rounded-3xl" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </>
      ) : (
        <>
          {/* Large screens: show Library and Dashboard buttons directly */}
          {user && user.role !== UserRole.READER && (
            <div className="hidden lg:flex gap-2">
              <Button size="sm" variant="secondary" asChild>
                <Link href={ROUTES.library}>
                  <Library /> Library
                </Link>
              </Button>
              <Button size="sm" variant="default" asChild>
                <Link href={ROUTES.dashboard.root}>
                  <Layout /> Dashboard
                </Link>
              </Button>
            </div>
          )}
          {/* Large screens: show Library button for READER */}
          {user && user.role === UserRole.READER && (
            <div className="hidden lg:flex">
              <Button size="sm" variant="secondary" asChild>
                <Link href={ROUTES.library}>
                  <Library /> Library
                </Link>
              </Button>
            </div>
          )}
          {/* Small screens: show dropdown for Library/Dashboard */}
          {user && (
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={"ghost"} size="sm">
                    Menu <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Link href={ROUTES.library}>Library</Link>
                  </DropdownMenuItem>
                  {user.role !== UserRole.READER && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Link href={ROUTES.dashboard.root}>Dashboard</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <UserProfile user={user} />
        </>
      )}
    </div>
  );
}

export const Navbar = () => {
  const { data, isPending } = userQuery();
  const pathname = usePathname();
  if (pathname.includes("auth") || pathname.includes("dashboard")) {
    return null;
  }

  return (
    <header className="between border-b bg-background/75 backdrop-blur-xl w-full">
      <nav className="flex items-center p-2 justify-between container mx-auto w-full">
        <NavbarBrand />
        <NavbarActions user={data || null} isPending={isPending} />
      </nav>
    </header>
  );
};
