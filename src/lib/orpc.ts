import { ORPCError, os } from "@orpc/server";
import * as z from "zod";
import { auth, Session } from "./auth";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  authorInsertSchema,
  authors,
  workInsertSchema,
  works,
} from "@/db/schema";
import { transformSlug } from "./utils";
import { dataTagErrorSymbol } from "@tanstack/react-query";
import { generatePresignedPutUrl, uploadToR2 } from "./minio";
import { eq } from "drizzle-orm";

const authenticated = os
  .$context<{ session: Session | null }>()
  .use(({ context, next }) => {
    if (!context.session) {
      throw new ORPCError("UNAUTHORIZED");
    }
    return next({ context: { session: context.session } });
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
export const getAllWorksByAuthorId = authenticated
  .input(z.object({ authorId: z.string() }))
  .handler(async ({ input }) => {
    const works = await db.query.works.findMany({
      where: (work, { eq }) => eq(work.authorId, input.authorId),
      orderBy: (work, { desc }) => desc(work.createdAt),
    });
    return works;
  });

export const createWork = authenticated
  .input(workInsertSchema)
  .handler(async ({ input, context }) => {
    if (!context.session.user) return null;
    try {
      await db.insert(works).values({
        ...input,
        slug: transformSlug(input.slug, context.session.user.id),
      });
    } catch (error) {
      console.error("Error creating work:", error);
      return null;
    }
  });

export const deleteWork = authenticated
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    try {
      await db.delete(works).where(eq(works.id, input.id));
    } catch (error) {
      console.error("Error deleting work:", error);
      return null;
    }
  });

export const updateWork = authenticated
  .input(workInsertSchema.partial().extend({ id: z.string() }))
  .handler(async ({ input, context }) => {
    if (!context.session.user) return null;

    try {
      const work = await db.update(works).set({
        ...input,
        authorId: context.session.user.id,
      });
      return work;
    } catch (error) {
      console.error("Error updating work:", error);
      return null;
    }
  });

export const createAuthor = authenticated
  .input(authorInsertSchema)
  .handler(async ({ input, context }) => {
    const user = context.session.user;
    if (!user) return null;

    try {
      const author = await db.insert(authors).values({
        ...input,
        userId: user.id,
      });
      return author;
    } catch (error) {
      console.error("Error creating author:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
  });

export const updateAuthor = authenticated
  .input(authorInsertSchema.partial())
  .handler(async ({ input, context }) => {
    const user = context.session.user;
    if (!user) return null;

    try {
      const author = await db.update(authors).set({
        ...input,
        userId: user.id,
      });
      return author;
    } catch (error) {
      console.error("Error updating author:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
  });

export const getAuthorByUserId = authenticated
  .input(z.object({ userId: z.string() }))
  .handler(async ({ input }) => {
    const author = await db.query.authors.findFirst({
      where: (author, { eq }) => eq(author.userId, input.userId),
    });
    if (!author) {
      throw new ORPCError("NOT_FOUND");
    } else {
      return author;
    }
  });

export const getUploadFileUrl = authenticated
  .input(
    z.object({
      bucketName: z.string(),
      objectName: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const { bucketName, objectName } = input;
    if (!bucketName || !objectName) {
      throw new ORPCError("BAD_REQUEST");
    }
    try {
      const url = await generatePresignedPutUrl(bucketName, objectName, 60 * 5);
      console.log(
        `Generated presigned URL for "${objectName}" in bucket "${bucketName}": ${url}`
      );
      return url;
    } catch (error) {
      console.error(
        `Error generating presigned URL for "${objectName}" in bucket "${bucketName}":  `,
        error
      );
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
  });

export const router = {
  user: {
    get: getUser,
  },
  author: {
    create: createAuthor,
    update: updateAuthor,
    getByUserId: getAuthorByUserId,
  },
  work: {
    getBySlug: getWorkBySlug,
    getAllByAuthorId: getAllWorksByAuthorId,
    create: createWork,
    delete: deleteWork,
    update: updateWork,
  },
  upload: {
    file: getUploadFileUrl,
  },
};
