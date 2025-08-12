export const ROUTES = {
  home: "/",
  library: "/library",
  profile: "/profile",

  auth: {
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
  },

  author: {
    root: "/author",
    byId: (id: string) => `/author/${id}`,
    works: (id: string) => `/author/${id}/works`,
  },

  book: {
    root: "/book",
    byId: (id: string) => `/book/${id}`,
    chapter: (bookId: string, slug: string) =>
      `/book/${bookId}/chapter/${slug}`,
  },

  api: {
    auth: {
      all: "/api/auth/[...all]",
    },
    rpc: {
      rest: "/api/rpc/[...rest]",
    },
  },
  dashboard: {
    root: "/dashboard",
    works: {
      root: "/dashboard/works",
      new: "/dashboard/works/new",
      bySlug: (slug: string) => `/dashboard/works/${slug}`,
      bySlugNew: (slug: string) => `/dashboard/works/${slug}/new`,
    },
  },
} as const;

export type RouteFunction = (...args: unknown[]) => string;
export type RouteValue = string | RouteFunction | { [key: string]: RouteValue };

type ExtractRouteParams<T> = T extends (...args: infer P) => string
  ? P
  : T extends object
  ? { [K in keyof T]: ExtractRouteParams<T[K]> }
  : never;

export type ROUTE_PARAMS = ExtractRouteParams<typeof ROUTES>;
