ALTER TABLE "chapters" ADD COLUMN "archive_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "chapter_versions" DROP COLUMN "content_key";