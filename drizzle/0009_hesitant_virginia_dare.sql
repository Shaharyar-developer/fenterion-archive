ALTER TABLE "comments" DROP CONSTRAINT "comments_chapter_version_id_chapter_versions_id_fk";
--> statement-breakpoint
ALTER TABLE "metrics" DROP CONSTRAINT "metrics_chapter_version_id_chapter_versions_id_fk";
--> statement-breakpoint
ALTER TABLE "chapters" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" DROP COLUMN "chapter_version_id";--> statement-breakpoint
ALTER TABLE "metrics" DROP COLUMN "chapter_version_id";