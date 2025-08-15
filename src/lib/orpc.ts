import { ORPCError, os } from "@orpc/server";

import * as z from "zod";
import { Session } from "./auth";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  authorInsertSchema,
  authors,
  chapterInsertSchema,
  chapters,
  ChapterStatus,
  chapterVersions,
  workInsertSchema,
  works,
} from "@/db/schema";
import { slugify, transformSlug } from "./utils";
import { dataTagErrorSymbol } from "@tanstack/react-query";
import { generatePresignedPutUrl, uploadToR2 } from "./minio";
import { and, desc, eq, notInArray, sql } from "drizzle-orm";

function ensureFound<T>(entity: T | null): T {
  if (!entity) throw new ORPCError("NOT_FOUND");
  return entity;
}

const authenticated = os
  .$context<{ session: Session | null }>()
  .use(({ context, next }) => {
    if (!context.session) {
      throw new ORPCError("UNAUTHORIZED");
    }
    return next({ context: { session: context.session } });
  });

const COUNT_ONLY_PUBLISHED_CHAPTERS = false;

async function applyWorkWordCountDelta(tx: any, workId: string, delta: number) {
  if (!delta) return;
  await tx
    .update(works)
    .set({
      wordCount: sql`${works.wordCount} + ${delta}`,
      updatedAt: new Date(),
    })
    .where(eq(works.id, workId));
}

async function recomputeWorkWordCount(tx: any, workId: string) {
  const whereConditions = COUNT_ONLY_PUBLISHED_CHAPTERS
    ? and(
        eq(chapters.workId, workId),
        eq(chapters.status, ChapterStatus.PUBLISHED)
      )
    : eq(chapters.workId, workId);

  const [{ total } = { total: 0 }] = await tx
    .select({ total: sql<number>`COALESCE(SUM(${chapters.wordCount}), 0)` })
    .from(chapters)
    .where(whereConditions);
  await tx
    .update(works)
    .set({ wordCount: total, updatedAt: new Date() })
    .where(eq(works.id, workId));
}

/**
 * Get a user by their ID.
 * @param input - The user ID string.
 * @returns The user object if found, otherwise throws NOT_FOUND.
 */
export const getUser = authenticated
  .input(z.string())
  .handler(async ({ input, context }) => {
    const user = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, input),
    });
    return ensureFound(user);
  });

/**
 * Get a work by its slug.
 * @param input - Object containing the work slug.
 * @returns The work object if found, otherwise throws NOT_FOUND.
 */
export const getWorkBySlug = authenticated
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input }) => {
    const work = await db.query.works.findFirst({
      where: (work, { eq }) => eq(work.slug, input.slug),
    });
    return ensureFound(work);
  });
/**
 * Get all works by a specific author ID.
 * @param input - Object containing the authorId.
 * @returns Array of works for the author.
 */
export const getAllWorksByAuthorId = authenticated
  .input(z.object({ authorId: z.string() }))
  .handler(async ({ input }) => {
    const works = await db.query.works.findMany({
      where: (work, { eq }) => eq(work.authorId, input.authorId),
      orderBy: (work, { desc }) => desc(work.createdAt),
    });
    return works;
  });

/**
 * Create a new work.
 * @param input - Work insert schema object.
 * @returns null if user is not authenticated or on error.
 */
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

/**
 * Delete a work by its ID.
 * @param input - Object containing the work ID.
 * @returns null on error.
 */
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

/**
 * Update a work by its ID.
 * @param input - Partial work insert schema with required ID.
 * @returns The updated work or null on error.
 */
export const updateWork = authenticated
  .input(workInsertSchema.partial().extend({ id: z.string() }))
  .handler(async ({ input, context }) => {
    if (!context.session.user) return null;

    const { id, slug, authorId, title, ...updateFields } = input;
    try {
      const work = await db
        .update(works)
        .set({
          ...updateFields,
          authorId: context.session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(works.id, id));
      return work;
    } catch (error) {
      console.error("Error updating work:", error);
      return null;
    }
  });

/**
 * Create a new author for the current user.
 * @param input - Author insert schema object.
 * @returns The created author or throws on error.
 */
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

/**
 * Update the author for the current user.
 * @param input - Partial author insert schema object.
 * @returns The updated author or throws on error.
 */
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

/**
 * Get an author by the user's ID.
 * @param input - Object containing the userId.
 * @returns The author object if found, otherwise throws NOT_FOUND.
 */
export const getAuthorByUserId = authenticated
  .input(z.object({ userId: z.string() }))
  .handler(async ({ input }) => {
    const author = await db.query.authors.findFirst({
      where: (author, { eq }) => eq(author.userId, input.userId),
    });
    return ensureFound(author);
  });

/**
 * Generate a presigned upload URL for a file in a bucket.
 * @param input - Object with bucketName and objectName.
 * @returns The presigned URL string.
 */
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

/**
 * Create a new chapter draft for a work.
 * @param input - Partial chapter insert schema with workId and title.
 * @returns The slug of the created chapter.
 */
export const createChapterDraft = authenticated
  .input(
    chapterInsertSchema
      .partial()
      .extend({ workId: z.string(), title: z.string() })
  )
  .handler(async ({ input, context }) => {
    const { workId, title } = input;
    const user = context.session.user;
    if (!user) {
      throw new ORPCError("UNAUTHORIZED");
    }

    const chapterId = nanoid();
    const currentVersionId = nanoid();
    const slug = transformSlug(slugify(title), user.id);

    try {
      await db.transaction(async (tx) => {
        await tx.insert(chapters).values({
          ...input,
          id: chapterId,
          workId,
          slug,
          currentVersionId,
        });

        await tx.insert(chapterVersions).values({
          id: currentVersionId,
          chapterId,
        });
      });
      return slug;
    } catch (error) {
      console.error("Error creating chapter:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
  });

/**
 * Update a chapter by its ID.
 * @param input - Object with chapter ID, workId, and update fields.
 * @returns The update result or throws on error.
 */
export const updateChapter = authenticated
  .input(
    z.object({
      id: z.string(),
      workId: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      status: z.enum(ChapterStatus).optional(),
      published: z.boolean().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { id, workId, ...updateFields } = input;
    if (!context.session.user) {
      throw new ORPCError("UNAUTHORIZED");
    }
    try {
      let result;
      await db.transaction(async (tx) => {
        const [existing] = await tx
          .select({
            status: chapters.status,
            wordCount: chapters.wordCount,
            workId: chapters.workId,
          })
          .from(chapters)
          .where(eq(chapters.id, id))
          .limit(1);
        if (!existing) throw new ORPCError("NOT_FOUND");

        result = await tx
          .update(chapters)
          .set({
            ...updateFields,
            updatedAt: new Date(),
          })
          .where(eq(chapters.id, id));

        if (COUNT_ONLY_PUBLISHED_CHAPTERS && updateFields.status) {
          const oldPublished = existing.status === "published";
          const newPublished = updateFields.status === "published";
          if (oldPublished !== newPublished) {
            const delta = newPublished
              ? existing.wordCount
              : -existing.wordCount;
            await applyWorkWordCountDelta(tx, existing.workId, delta);
          }
        }
      });
      return result;
    } catch (error) {
      console.error("Error updating chapter:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
  });

/**
 * Get metadata for all chapters of a work by workId.
 * @param input - Object containing the workId.
 * @returns Array of chapter metadata.
 */
export const getAllChaptersMetaByWorkId = authenticated
  .input(z.object({ workId: z.string() }))
  .handler(async ({ input }) => {
    const chapters = await db.query.chapters.findMany({
      where: (chapter, { eq }) => eq(chapter.workId, input.workId),
      orderBy: (chapter, { asc }) => asc(chapter.position),
      columns: {
        id: true,
        workId: true,
        slug: true,
        position: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return chapters;
  });

/**
 * Get a chapter by its ID.
 * @param input - Object containing the chapter ID.
 * @returns The chapter object if found, otherwise throws NOT_FOUND.
 */
export const getChapterById = authenticated
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const chapter = await db.query.chapters.findFirst({
      where: (chapter, { eq }) => eq(chapter.id, input.id),
    });
    return ensureFound(chapter);
  });

/**
 * Get a chapter by its slug.
 * @param input - Object containing the chapter slug.
 * @returns The chapter object if found, otherwise throws NOT_FOUND.
 */
export const getChapterBySlug = authenticated
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input }) => {
    const chapter = await db.query.chapters.findFirst({
      where: (chapter, { eq }) => eq(chapter.slug, input.slug),
    });
    return ensureFound(chapter);
  });

/**
 * Get chapter metadata by its slug.
 * @param input - Object containing the chapter slug.
 * @returns The chapter metadata if found, otherwise throws NOT_FOUND.
 */
export const getChapterMetaBySlug = authenticated
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input }) => {
    const chapter = await db.query.chapters.findFirst({
      where: (chapter, { eq }) => eq(chapter.slug, input.slug),
    });
    return ensureFound(chapter);
  });

/**
 * Get a chapter version by its ID.
 * @param input - Object containing the chapter version ID.
 * @returns The chapter version if found, otherwise throws NOT_FOUND.
 */
export const getChapterVersionById = authenticated
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const chapterVersion = await db.query.chapterVersions.findFirst({
      where: (chapterVersion, { eq }) => eq(chapterVersion.id, input.id),
    });
    return ensureFound(chapterVersion);
  });

/**
 * Get all versions of a chapter by chapterId.
 * @param input - Object containing the chapterId.
 * @returns Array of chapter versions.
 */
export const getAllChapterVersionsByChapterId = authenticated
  .input(z.object({ chapterId: z.string() }))
  .handler(async ({ input }) => {
    const chapterVersions = await db.query.chapterVersions.findMany({
      where: (chapterVersion, { eq }) => eq(chapterVersion.id, input.chapterId),
    });
    return chapterVersions;
  });

/**
 * Get a chapter and all its versions by the chapter's slug.
 * @param input - Object containing the chapter slug.
 * @returns Object with versions array and chapter object.
 */
export const getChapterAndVersionsByChapterSlug = authenticated
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input }) => {
    const _chapterVersions = await db
      .select()
      .from(chapterVersions)
      .innerJoin(chapters, eq(chapterVersions.chapterId, chapters.id))
      .where(eq(chapters.slug, input.slug));

    if (_chapterVersions.length === 0) {
      throw new ORPCError("NOT_FOUND");
    }
    const versions = _chapterVersions.map((row) => row.chapter_versions);
    return { versions: versions, chapter: _chapterVersions[0].chapters };
  });

/**
 * Create a new version for a chapter.
 * @param input - Object with chapterId, content, and wordCount.
 * @returns Object with the new version ID.
 */
export const createChapterVersion = authenticated
  .input(
    z.object({
      chapterId: z.string(),
      content: z.string(),
      wordCount: z.number(),
    })
  )
  .handler(async ({ input, context }) => {
    const user = context.session.user;
    if (!user) {
      throw new ORPCError("UNAUTHORIZED");
    }

    const versionId = nanoid();

    try {
      await db.transaction(async (tx) => {
        const [existingChapter] = await tx
          .select({
            wordCount: chapters.wordCount,
            status: chapters.status,
            workId: chapters.workId,
          })
          .from(chapters)
          .where(eq(chapters.id, input.chapterId))
          .limit(1);
        if (!existingChapter) throw new ORPCError("NOT_FOUND");
        // 1. Insert the new version
        await tx.insert(chapterVersions).values({
          id: versionId,
          chapterId: input.chapterId,
          content: input.content,
        });

        // 2. Update chapter's current version
        await tx
          .update(chapters)
          .set({
            currentVersionId: versionId,
            updatedAt: new Date(),
            wordCount: input.wordCount,
          })
          .where(eq(chapters.id, input.chapterId));

        // Always recalculate work word count after updating chapter word count
        await recomputeWorkWordCount(tx, existingChapter.workId);
        // 3. Keep only last 5 versions
        const subquery = tx
          .select({ id: chapterVersions.id })
          .from(chapterVersions)
          .where(eq(chapterVersions.chapterId, input.chapterId))
          .orderBy(desc(chapterVersions.updatedAt))
          .limit(5);

        await tx
          .delete(chapterVersions)
          .where(
            and(
              eq(chapterVersions.chapterId, input.chapterId),
              notInArray(chapterVersions.id, subquery)
            )
          );
      });

      return { id: versionId };
    } catch (error) {
      console.error("Error creating chapter version:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
  });

/**
 * Update a chapter version by its ID.
 * @param input - Object with version ID, content, and wordCount.
 * @returns Object with the updated version ID.
 */
export const updateChapterVersion = authenticated
  .input(
    z.object({
      id: z.string(),
      content: z.string(),
      wordCount: z.number(),
    })
  )
  .handler(async ({ input, context }) => {
    const user = context.session.user;
    if (!user) {
      throw new ORPCError("UNAUTHORIZED");
    }

    const { id, content, wordCount } = input;

    try {
      await db.transaction(async (tx) => {
        const version = await tx.query.chapterVersions.findFirst({
          where: (cv, { eq }) => eq(cv.id, id),
        });
        if (!version) throw new ORPCError("NOT_FOUND");
        const [chapterBefore] = await tx
          .select({
            wordCount: chapters.wordCount,
            status: chapters.status,
            workId: chapters.workId,
          })
          .from(chapters)
          .where(eq(chapters.id, version.chapterId))
          .limit(1);
        if (!chapterBefore) throw new ORPCError("NOT_FOUND");

        const updateData: Partial<typeof chapterVersions.$inferInsert> = {
          updatedAt: new Date(),
        };
        if (content !== undefined) updateData.content = content;

        await tx
          .update(chapterVersions)
          .set(updateData)
          .where(eq(chapterVersions.id, id));

        await tx
          .update(chapters)
          .set({ wordCount, updatedAt: new Date() })
          .where(eq(chapters.id, version.chapterId));

        // Always recalculate work word count after updating chapter word count
        // This ensures the work total is correct regardless of chapter status
        await recomputeWorkWordCount(tx, chapterBefore.workId);
      });
      return { id };
    } catch (error) {
      console.error("Error updating chapter version:", error);
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
  chapter: {
    getAllMetaByWorkId: getAllChaptersMetaByWorkId,
    getById: getChapterById,
    getBySlug: getChapterBySlug,
    createDraft: createChapterDraft,
    update: updateChapter,
    getMetaBySlug: getChapterMetaBySlug,
    getVersionById: getChapterVersionById,
    getAllVersionsByChapterId: getAllChapterVersionsByChapterId,
    getWithVersionsByChapterSlug: getChapterAndVersionsByChapterSlug,
    // Version mutation endpoints (used by editor save dropdown)
    createVersion: createChapterVersion,
    updateVersion: updateChapterVersion,
  },
  upload: {
    file: getUploadFileUrl,
  },
};
