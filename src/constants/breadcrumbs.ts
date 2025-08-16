import { client } from "@/lib/orpc.client";

type BreadcrumbConfig = {
  label:
    | string
    | ((params: Record<string, string>) => Promise<string> | string);
  href?: string | ((params: Record<string, string>) => string);
};

export const dashboardBreadcrumbs: Record<string, BreadcrumbConfig> = {
  "/dashboard": { label: "Dashboard", href: "/dashboard" },
  "/dashboard/works": { label: "Works", href: "/dashboard/works" },
  "/dashboard/works/new": { label: "New Work", href: "/dashboard/works/new" },
  "/dashboard/works/[slug]": {
    label: async ({ slug }) => {
      if (!slug) return "Unknown Work";
      const res = await client.work.getBySlug({ slug: slug });

      return res?.title || "Unknown Work";
    },
    href: ({ slug }) => `/dashboard/works/${slug}`,
  },
  "/dashboard/works/[slug]/edit": { label: "Edit Work" },
  "/dashboard/works/[slug]/chapters": { label: "Chapters" },
  "/dashboard/works/[slug]/chapter/[chSlug]": {
    label: async ({ chSlug, slug }) => {
      if (!chSlug) {
        return "Chapter";
      }
      const meta = await client.chapter.getMetaBySlug({
        slug: chSlug,
      });
      return meta?.title || "Chapter";
    },
    href: ({ slug, chSlug }) => {
      return `/dashboard/works/${slug}/chapter/${chSlug}`;
    },
  },
};
