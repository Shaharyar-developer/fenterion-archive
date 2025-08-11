import "server-only";

import { headers } from "next/headers";
import { createRouterClient } from "@orpc/server";
import { router } from "./orpc";
import { auth } from "./auth";

globalThis.$client = createRouterClient(router, {
  context: async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return {
      session: session,
    };
  },
});
