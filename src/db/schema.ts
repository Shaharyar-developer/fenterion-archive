import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  customType,
  serial,
} from "drizzle-orm/pg-core";

const bytea = customType<{
  data: Uint8Array;
  driverData: Uint8Array;
  default: false;
}>({
  dataType() {
    return "bytea";
  },
});

export function enumToPgEnum<T extends Record<string, unknown>>(
  myEnum: T
): [T[keyof T], ...T[keyof T][]] {
  return Object.values(myEnum).map((value) => `${value}`) as [
    T[keyof T],
    ...T[keyof T][],
  ];
}

export enum UserRole {
  READER = "reader",
  AUTHOR = "author",
  ADMIN = "admin",
}

export enum WorkStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export enum ChapterStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export enum WorkType {
  STORY = "story",
  SHORT_STORY = "short_story",
  POEM = "poem",
  FANFICTION = "fanfiction",
}

export enum CommentType {
  GENERAL = "general",
  SPOILER = "spoiler",
  AUTHOR_NOTE = "author_note",
}

export enum MetricType {
  VIEW = "view",
  LIKE = "like",
  COMPLETION = "completion",
  COMMENT = "comment",
}
export enum ReviewRating {
  ONE = "1",
  TWO = "2",
  THREE = "3",
  FOUR = "4",
  FIVE = "5",
}

export enum ProgressStatus {
  STARTED = "started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export const commentTypeEnum = pgEnum(
  "comment_type",
  enumToPgEnum(CommentType)
);

export const progressStatusEnum = pgEnum(
  "progress_status",
  enumToPgEnum(ProgressStatus)
);

export const reviewRatingEnum = pgEnum(
  "review_rating",
  enumToPgEnum(ReviewRating)
);

export const metricTypeEnum = pgEnum("metric_type", enumToPgEnum(MetricType));

export const userRoleEnum = pgEnum("user_role", enumToPgEnum(UserRole));
export const workStatusEnum = pgEnum("work_status", enumToPgEnum(WorkStatus));
export const workTypeEnum = pgEnum("work_type", enumToPgEnum(WorkType));
export const chapterStatusEnum = pgEnum(
  "chapter_status",
  enumToPgEnum(ChapterStatus)
);

// USERS
export const user = pgTable("user", {
  id: text("id").primaryKey(), // UUID/ULID
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default(UserRole.READER).notNull(),
  displayUsername: text("display_username").unique(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export type User = typeof user.$inferSelect;

// SESSION
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// ACCOUNT
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// VERIFICATION
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// AUTHORS — only those who can publish
export const authors = pgTable("authors", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id)
    .notNull()
    .unique(),
  penName: varchar("pen_name", { length: 100 }).notNull(),
  bio: text("bio"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export type Author = typeof authors.$inferSelect;
export type AuthorInsert = typeof authors.$inferInsert;
export const authorInsertSchema = createInsertSchema(authors);

// WORKS (unified table for all content types)
export const works = pgTable("works", {
  id: text("id").primaryKey(), // UUID
  authorId: text("author_id")
    .references(() => authors.userId)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  content: text("content"),
  coverKey: text("cover_key"),
  type: workTypeEnum("type").default(WorkType.STORY).notNull(),
  status: workStatusEnum("status").default(WorkStatus.DRAFT).notNull(),
  wordCount: integer("word_count").default(0),
  tags: jsonb("tags").$type<Record<string, string[]>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Work = typeof works.$inferSelect;
export type WorkInsert = typeof works.$inferInsert;
export const workInsertSchema = createInsertSchema(works);

// CHAPTERS
export const chapters = pgTable("chapters", {
  id: text("id").primaryKey(), // UUID
  workId: text("work_id")
    .references(() => works.id)
    .notNull(),
  position: integer("position").generatedAlwaysAsIdentity(), // Order in the work
  slug: varchar("slug", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  currentVersionId: text("current_version_id").notNull(),
  status: chapterStatusEnum("status").default(ChapterStatus.DRAFT).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  wordCount: integer("word_count").default(0).notNull(),
});

export const chapterInsertSchema = createInsertSchema(chapters);
export type Chapter = typeof chapters.$inferSelect;
export type ChapterInsert = typeof chapters.$inferInsert;

// CHAPTER VERSIONS (immutable snapshots)
export const chapterVersions = pgTable("chapter_versions", {
  id: text("id").primaryKey(), // UUID
  chapterId: text("chapter_id")
    .references(() => chapters.id, { onDelete: "cascade" })
    .notNull(),
  versionNumber: integer("version_number")
    .generatedAlwaysAsIdentity()
    .notNull(),
  content: text("content").notNull().default(""),
  contentKey: text("content_key").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ChapterVersion = typeof chapterVersions.$inferSelect;
export type ChapterVersionInsert = typeof chapterVersions.$inferInsert;
export const chapterVersionInsertSchema = createInsertSchema(chapterVersions);

// LIBRARY / FAVORITES
export const libraryEntries = pgTable("library_entries", {
  id: text("id").primaryKey(), // UUID
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  workId: text("work_id")
    .references(() => works.id)
    .notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  workId: text("work_id")
    .references(() => works.id)
    .notNull(),
  rating: reviewRatingEnum("rating").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Comments point to a work or chapter
export const comments = pgTable(
  "comments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => user.id)
      .notNull(),
    workId: text("work_id").references(() => works.id),
    chapterId: text("chapter_id").references(() => chapters.id),
    type: commentTypeEnum("type").default(CommentType.GENERAL).notNull(),
    content: text("content").notNull(),
    parentId: text("parent_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    {
      columns: [table.parentId],
      foreignColumns: [table.id],
    },
  ]
);

// Metrics for works and chapters
export const metrics = pgTable("metrics", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id),
  workId: text("work_id").references(() => works.id),
  chapterId: text("chapter_id").references(() => chapters.id),
  type: metricTypeEnum("type").notNull(),
  value: integer("value").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reading progress still tracks chapters, not versions, for simplicity
export const readingProgress = pgTable("reading_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  workId: text("work_id")
    .references(() => works.id)
    .notNull(),
  lastChapterId: text("last_chapter_id").references(() => chapters.id),
  status: progressStatusEnum("status")
    .default(ProgressStatus.IN_PROGRESS)
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RELATIONS
export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  work: one(works, {
    fields: [chapters.workId],
    references: [works.id],
  }),
  versions: many(chapterVersions),
  currentVersion: one(chapterVersions, {
    fields: [chapters.currentVersionId],
    references: [chapterVersions.id],
  }),
  comments: many(comments),
  metrics: many(metrics),
}));

export const chapterVersionsRelations = relations(
  chapterVersions,
  ({ one }) => ({
    chapter: one(chapters, {
      fields: [chapterVersions.chapterId],
      references: [chapters.id],
    }),
  })
);

export const worksRelations = relations(works, ({ one, many }) => ({
  author: one(authors, {
    fields: [works.authorId],
    references: [authors.userId],
  }),
  chapters: many(chapters),
  comments: many(comments),
  reviews: many(reviews),
  libraryEntries: many(libraryEntries),
  metrics: many(metrics),
  readingProgress: many(readingProgress),
}));

export const authorsRelations = relations(authors, ({ one, many }) => ({
  user: one(user, {
    fields: [authors.userId],
    references: [user.id],
  }),
  works: many(works),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  author: one(authors),
  sessions: many(session),
  accounts: many(account),
  comments: many(comments),
  reviews: many(reviews),
  libraryEntries: many(libraryEntries),
  metrics: many(metrics),
  readingProgress: many(readingProgress),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(user, {
    fields: [comments.userId],
    references: [user.id],
  }),
  work: one(works, {
    fields: [comments.workId],
    references: [works.id],
  }),
  chapter: one(chapters, {
    fields: [comments.chapterId],
    references: [chapters.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
}));