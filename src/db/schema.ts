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

export const user = pgTable("user", {
  id: text("id").primaryKey(),

  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),

  username: text("username").unique(),
  displayUsername: text("displayUsername"),
  avatarUrl: text("avatar_url"), // can be redundant with image, but kept in case you separate user avatars from profile pics
  role: userRoleEnum("role").default(UserRole.READER).notNull(),

  // Dates from original `user` table
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});
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

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

// AUTHORS — only those who can publish
export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
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
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  workId: integer("work_id")
    .references(() => works.id)
    .notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});
