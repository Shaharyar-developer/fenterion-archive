import { auth, Session } from "@/lib/auth";
import { router } from "@/lib/orpc";
import { RPCHandler } from "@orpc/server/fetch";
import { headers } from "next/headers";


async function handleRequest(request: Request) {
  const session: Session | null = await auth.api.getSession({
    headers: await headers(),
  });
  const handler = new RPCHandler(router);

  const { response } = await handler.handle(request, {
    prefix: "/api/rpc",
    context: {
      session: session,
    },
  });

  return response ?? new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
