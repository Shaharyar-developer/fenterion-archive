"use client";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
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

function UserProfile({ session }: { session: Session | null }) {
  if (!session) {
    return (
      <Button asChild>
        <Link href={ROUTES.auth.signIn}>Sign In</Link>
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger title={session.user.name} asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={session.user.image || ""} alt="User Avatar" />
          <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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
                  toast.success("Account deleted successfully.");
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

export const Navbar = () => {
  const { data, isPending } = authClient.useSession();
  const pathname = usePathname();
  if (pathname.includes("auth")) {
    return null; // Hide navbar on auth pages
  }
  return (
    <header className="between border-b bg-background/75 backdrop-blur-xl w-full">
      <nav className="flex items-center p-2 justify-between container mx-auto w-full">
        <h1>
          <Link href={ROUTES.home} className="text-xl font-bold">
            Fenterion Archive
          </Link>
        </h1>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink>Link</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex items-center gap-2">
          {isPending ? (
            <>
              <Button>
                <Skeleton className="w-12" />
              </Button>
              <Skeleton className="w-8 h-8 rounded-full" />
            </>
          ) : (
            <>
              {data && <Button variant={"outline"}>Library</Button>}
              <UserProfile
                session={
                  data ? { session: data.session, user: data.user } : null
                }
              />
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
