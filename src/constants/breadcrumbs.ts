import { client } from "@/lib/orpc.client";
import { authClient, normalizeSlug } from "@/lib/utils";

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
      const session = await authClient.getSession();
      const userId = session.data?.user.id;
      if (userId) {
        return normalizeSlug(res.slug, userId);
      }
      return res.slug;
    },
    href: ({ slug }) => `/dashboard/works/${slug}`,
  },
  "/dashboard/works/[slug]/edit": { label: "Edit Work" },
  "/dashboard/works/[slug]/chapters": { label: "Chapters" },
  "/dashboard/works/[slug]/chapters/[id]": {
    label: ({ id }) => `Chapter ${id}`,
  },
};
