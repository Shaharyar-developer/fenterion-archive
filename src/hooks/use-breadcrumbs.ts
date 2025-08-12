"use client";
import { usePathname, useParams } from "next/navigation";
import { dashboardBreadcrumbs } from "@/constants/breadcrumbs";
import { useEffect, useState } from "react";

export function useBreadcrumbs() {
  const pathname = usePathname();
  const params = useParams();
  const [crumbs, setCrumbs] = useState<{ label: string; href?: string }[]>([]);
  const [isPending, setIsPending] = useState(true);

  const extractParams = (pattern: string, params: Record<string, string>) => {
    const matches = [...pattern.matchAll(/\[(.+?)\]/g)];
    const keys = matches.map((m) => m[1]);
    const result: Record<string, string> = {};
    keys.forEach((key) => {
      if (params[key]) result[key] = params[key];
    });
    return result;
  };

  useEffect(() => {
    (async () => {
      const segments = pathname.split("/").filter(Boolean);
      const paths: string[] = [];

      // Build cumulative paths
      segments.forEach((seg, i) => {
        const path = "/" + segments.slice(0, i + 1).join("/");
        paths.push(path);
      });

      const resolved = await Promise.all(
        paths.map(async (path) => {
          const matchKey = Object.keys(dashboardBreadcrumbs).find((k) => {
            const pattern = k.replace(/\[.+?\]/g, "(.+)");
            return new RegExp(`^${pattern}$`).test(path);
          });

          if (!matchKey) return null;

          const config = dashboardBreadcrumbs[matchKey];
          const segmentParams = extractParams(matchKey, params as any);
          const label =
            typeof config.label === "function"
              ? await config.label(segmentParams)
              : config.label;
          const href =
            typeof config.href === "function"
              ? config.href(segmentParams)
              : config.href;

          return { label, href };
        })
      );

      setCrumbs(resolved.filter(Boolean) as any);
      setIsPending(false);
    })();
  }, [pathname, params]);

  return [isPending, crumbs] as const;
}
