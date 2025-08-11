import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export function enumToPgEnum<T extends Record<string, unknown>>(
  myEnum: T
): [T[keyof T], ...T[keyof T][]] {
  return Object.values(myEnum).map((value) => `${value}`) as [
    T[keyof T],
    ...T[keyof T][]
  ];
}

enum UserRole {
  READER = "reader",
  AUTHOR = "author",
  ADMIN = "admin",
}

enum WorkStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

enum ChapterStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

enum WorkType {
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
  enumToPgEnum(ChapterStatus)
);

// USERS — all registered accounts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default(UserRole.READER).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AUTHORS — only those who can publish
export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  penName: varchar("pen_name", { length: 100 }).notNull(),
  bio: text("bio"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// WORKS (unified table for all content types)
export const works = pgTable("works", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id")
    .references(() => authors.id)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  content: text("content"),
  coverImageBase64: text("cover_image_base64"), // small covers only
  type: workTypeEnum("type").default(WorkType.STORY).notNull(),
  status: workStatusEnum("status").default(WorkStatus.DRAFT).notNull(),
  wordCount: integer("word_count"), // useful for all work types
  tags: jsonb("tags"), // flexible tagging system for genres, themes, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// CHAPTERS (only for multi-chapter works like stories)
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  workId: integer("work_id")
    .references(() => works.id)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  content: text("content").notNull(),
  position: integer("position").notNull(), // chapter order
  status: chapterStatusEnum("status").default(ChapterStatus.DRAFT).notNull(),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// LIBRARY / FAVORITES
export const libraryEntries = pgTable("library_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  workId: integer("work_id")
    .references(() => works.id)
    .notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});
