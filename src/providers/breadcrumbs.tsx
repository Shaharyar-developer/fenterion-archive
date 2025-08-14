"use client";
import React, { useCallback, useEffect, useState } from "react";
import { BreadcrumbsContext } from "@/lib/context";
import { usePathname, useParams } from "next/navigation";
import { dashboardBreadcrumbs } from "@/constants/breadcrumbs";
import { useSelectedLayoutSegments } from "next/navigation";

export function BreadcrumbsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const selected = useSelectedLayoutSegments();
  const [breadcrumbs, setBreadcrumbs] = useState<
    { label: string; href?: string }[]
  >([]);
  const [isPending, setIsPending] = useState(true);

  const extractParams = (pattern: string, params: Record<string, string>) => {
    const matches = [...pattern.matchAll(/\[(.+?)\]/g)];
    const keys = matches.map((m) => m[1]);
    const result: Record<string, string> = {};
    keys.forEach((key) => {
      result[key] = params[key];
    });
    return result;
  };

  const fetchBreadcrumbs = useCallback(async () => {
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

    setBreadcrumbs(filtered as any);
    setIsPending(false);
  }, [pathname, JSON.stringify(params), JSON.stringify(selected)]);

  useEffect(() => {
    setIsPending(true);
    fetchBreadcrumbs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBreadcrumbs]);

  return (
    <BreadcrumbsContext.Provider
      value={{
        breadcrumbs,
        setBreadcrumbs,
        refetchBreadcrumbs: fetchBreadcrumbs,
        isPending,
      }}
    >
      {children}
    </BreadcrumbsContext.Provider>
  );
}
