import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export function enumToPgEnum<T extends Record<string, unknown>>(
  myEnum: T,
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

export const userRoleEnum = pgEnum("user_role", enumToPgEnum(UserRole));
export const workStatusEnum = pgEnum("work_status", enumToPgEnum(WorkStatus));
export const workTypeEnum = pgEnum("work_type", enumToPgEnum(WorkType));
export const chapterStatusEnum = pgEnum(
  "chapter_status",
  enumToPgEnum(ChapterStatus),
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
  id: text("id").primaryKey(), // UUID
  userId: text("user_id")
    .references(() => user.id)
    .notNull()
    .unique(),
  penName: varchar("pen_name", { length: 100 }).notNull(),
  bio: text("bio"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// WORKS (unified table for all content types)
export const works = pgTable("works", {
  id: text("id").primaryKey(), // UUID
  authorId: text("author_id")
    .references(() => authors.id)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  content: text("content"),
  coverImageBase64: text("cover_image_base64"),
  type: workTypeEnum("type").default(WorkType.STORY).notNull(),
  status: workStatusEnum("status").default(WorkStatus.DRAFT).notNull(),
  wordCount: integer("word_count"),
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
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  content: text("content").notNull(),
  position: integer("position").notNull(),
  status: chapterStatusEnum("status").default(ChapterStatus.DRAFT).notNull(),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
