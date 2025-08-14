ALTER TABLE "chapters" ADD COLUMN "title" varchar(255);--> statement-breakpoint
ALTER TABLE "chapter_versions" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "chapter_versions" DROP COLUMN "published";