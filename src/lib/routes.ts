export const ROUTES = {
  home: "/",
  library: "/library",

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
} as const;

export type RouteFunction = (...args: unknown[]) => string;
export type RouteValue = string | RouteFunction | { [key: string]: RouteValue };

type ExtractRouteParams<T> = T extends (...args: infer P) => string
  ? P
  : T extends object
  ? { [K in keyof T]: ExtractRouteParams<T[K]> }
  : never;

export type ROUTE_PARAMS = ExtractRouteParams<typeof ROUTES>;
