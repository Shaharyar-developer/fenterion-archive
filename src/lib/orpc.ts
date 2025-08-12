import { ORPCError, os } from "@orpc/server";
import * as z from "zod";
import { auth, Session } from "./auth";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { workInsertSchema, works } from "@/db/schema";

const authenticated = os
  .$context<{ session: Session | null }>()
  .use(({ context, next }) => {
    if (!context.session) {
      throw new ORPCError("UNAUTHORIZED");
    }
    return next({ context: { session: context.session } });
  });

const PlanetSchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
  description: z.string().optional(),
});

export const listPlanet = os
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).optional(),
      cursor: z.number().int().min(0).default(0),
    }),
  )
  .handler(async () => {
    // your list code here
    return [{ id: 1, name: "name" }];
  });

export const findPlanet = os
  .input(PlanetSchema.pick({ id: true }))
  .handler(async () => {
    // your find code here
    return { id: 1, name: "name" };
  });

export const createPlanet = authenticated
  .input(PlanetSchema.omit({ id: true }))
  .handler(async () => {
    return { id: 1, name: "name" };
  });

export const getUser = authenticated
  .input(z.string())
  .handler(async ({ input, context }) => {
    const user = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, input),
    });
    if (!user) {
      throw new ORPCError("NOT_FOUND");
    }
    return user;
  });

export const getWorkBySlug = authenticated
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input }) => {
    const work = await db.query.works.findFirst({
      where: (work, { eq }) => eq(work.slug, input.slug),
    });
    if (!work) {
      throw new ORPCError("NOT_FOUND");
    }
    return work;
  });
export const getAllWorksByUserId = authenticated
  .input(z.object({ userId: z.string() }))
  .handler(async ({ input }) => {
    const works = await db.query.works.findMany({
      where: (work, { eq }) => eq(work.authorId, input.userId),
      orderBy: (work, { desc }) => desc(work.createdAt),
    });
    return works;
  });

export const createWork = authenticated
  .input(workInsertSchema)
  .handler(async ({ input, context }) => {
    const user = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, context.session.user.id),
    });
    if (!user) return null;
    try {
      await db.insert(works).values({
        ...input,
        slug: `${input.slug}-${nanoid()}`,
      });
    } catch (error) {
      console.error("Error creating work:", error);
      return null;
    }
  });

export const router = {
  planet: {
    list: listPlanet,
    find: findPlanet,
    create: createPlanet,
  },
  user: {
    get: getUser,
  },
  work: {
    getBySlug: getWorkBySlug,
    getAllByUserId: getAllWorksByUserId,
    create: createWork,
  },
};
