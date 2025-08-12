"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export function UserProfile({
  user,
  children,
}: {
  user: User | null;
  children?: React.ReactNode;
}) {
  if (!user) {
    return (
      <Button asChild>
        <Link href={ROUTES.auth.signIn}>Sign In</Link>
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger title={user.name} asChild>
        {children ? (
          children
        ) : (
          <Avatar className="cursor-pointer">
            <AvatarImage src={user.image || ""} alt="User Avatar" />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end">
        <DropdownMenuLabel>User Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href={ROUTES.profile} className="w-full">
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            toast.warning("Are you sure you want to sign out?", {
              action: {
                onClick: () => authClient.signOut(),
                label: "Sign Out",
              },
            })
          }
        >
          Sign Out
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            toast.warning("Are you sure you want to delete your account?", {
              action: {
                onClick: async () => {
                  await authClient.deleteUser();
                  await authClient.signOut();
                  toast.success(
                    "Account deletion request sent successfully. Please check your email"
                  );
                },
                label: "Delete Account",
              },
            })
          }
        >
          Delete Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
