"use client";
import React, { useEffect } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SidebarMenuButton } from "../../ui/sidebar";
import { CommandIcon } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { userQuery, userWorksQuery } from "@/lib/queries";
import { Work } from "@/db/schema";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";

export function DashboardCommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [works, setWorks] = React.useState<Work[]>([]);
  const [isRateLimited, setIsRateLimited] = React.useState(false);
  const { isPending, data } = userQuery();
  const {
    isPending: isWorksPending,
    data: worksData,
    refetch: refetchWorks,
  } = userWorksQuery();
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);

    return () => {
      document.removeEventListener("keydown", down);
    };
  }, []);

  useEffect(() => {
    if (!isPending && data?.id && !isWorksPending) {
      console.log(worksData);
      setWorks(worksData || []);
    }
  }, [isPending, isWorksPending]);

  const routes = ROUTES.dashboard;

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => {
                router.push(routes.root);
                setOpen(false);
              }}
              value="Dashboard Home"
            >
              <span className="font-medium">Dashboard Home</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push(routes.works.root);
                setOpen(false);
              }}
              value="Works"
            >
              <span className="font-medium">Works</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push(routes.works.new);
                setOpen(false);
              }}
              value="New Work"
            >
              <span className="font-medium">New Work</span>
            </CommandItem>
          </CommandGroup>
          {works.length > 0 && (
            <CommandGroup heading="Works">
              {works.map((work) => (
                <CommandItem
                  key={work.id}
                  onSelect={() => {
                    router.push(routes.works.bySlug(work.slug));
                    setOpen(false);
                  }}
                  value={work.title}
                >
                  <span className="font-medium">{work.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {work.slug}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <div className="py-2 px-4 border-t flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Press <kbd className="bg-muted text-muted-foreground">Ctrl</kbd> +{" "}
            <kbd className="bg-muted text-muted-foreground">K</kbd> to open or
            close this menu.
          </span>
          <Button
            disabled={isWorksPending || isRateLimited}
            onClick={async () => {
              setIsRateLimited(true);
              await refetchWorks();
              setWorks(worksData || []);
              setTimeout(() => setIsRateLimited(false), 2000);
            }}
            size={"sm"}
            variant={"outline"}
            className="transition-all"
          >
            Refresh Works
            {isRateLimited && <Spinner className="size-4" />}
          </Button>
        </div>
      </CommandDialog>

      <SidebarMenuButton onClick={() => setOpen(true)} size="lg" asChild>
        <div>
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <CommandIcon className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Search Dashboard</span>
            <div className="flex items-center gap-0.5 mt-1">
              <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none max-w-max justify-center">
                Ctrl
              </kbd>
              <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none max-w-max justify-center">
                K
              </kbd>
            </div>
          </div>
        </div>
      </SidebarMenuButton>
    </>
  );
}
