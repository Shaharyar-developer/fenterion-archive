"use client";
import { usePathname, useParams } from "next/navigation";
import { dashboardBreadcrumbs } from "@/constants/breadcrumbs";
import { useEffect, useState } from "react";
import { useSelectedLayoutSegments } from "next/navigation";

export function useBreadcrumbs() {
  const pathname = usePathname();
  const params = useParams();
  const [crumbs, setCrumbs] = useState<{ label: string; href?: string }[]>([]);
  const [isPending, setIsPending] = useState(true);
  const selected = useSelectedLayoutSegments();

  const extractParams = (pattern: string, params: Record<string, string>) => {
    const matches = [...pattern.matchAll(/\[(.+?)\]/g)];
    const keys = matches.map((m) => m[1]);
    const result: Record<string, string> = {};
    keys.forEach((key) => {
      result[key] = params[key];
    });
    return result;
  };

  useEffect(() => {
    (async () => {
      const flattenSegments = (s: any): string[] => {
        if (s == null) return [];
        if (Array.isArray(s)) return s.flatMap(flattenSegments);
        return [String(s)];
      };

      let segments = flattenSegments(selected).filter(Boolean);

      if (!segments.length) {
        segments = pathname.split("/").filter(Boolean);
      }

      if (pathname.startsWith("/dashboard") && segments[0] !== "dashboard") {
        segments = ["dashboard", ...segments];
      }
      const paths: string[] = [];

      segments.forEach((seg, i) => {
        const path = "/" + segments.slice(0, i + 1).join("/");
        paths.push(path);
      });

      const resolved = await Promise.all(
        paths.map(async (path) => {
          const matchKey = Object.keys(dashboardBreadcrumbs)
            .filter((k) => {
              const pattern = k.replace(/\[.+?\]/g, "([^/]+)");
              return new RegExp(`^${pattern}$`).test(path);
            })
            .sort((a, b) => b.length - a.length)[0];

          if (!matchKey) {
            return null;
          }

          const config = dashboardBreadcrumbs[matchKey];
          const segmentParams = extractParams(matchKey, params as any);
          let label;
          if (typeof config.label === "function") {
            label = await config.label(segmentParams);
          } else {
            label = config.label;
          }
          let href;
          if (typeof config.href === "function") {
            href = config.href(segmentParams);
          } else {
            href = config.href;
          }
          return { label, href };
        })
      );

      const filtered = resolved
        .filter(Boolean)
        .filter(
          (crumb, idx, arr) => idx === 0 || crumb?.label !== arr[idx - 1]?.label
        );

      setCrumbs(filtered as any);
      setIsPending(false);
    })();
  }, [pathname, params]);
  return [isPending, crumbs] as const;
}
