ALTER TABLE "chapters" DROP CONSTRAINT "chapters_position_unique";--> statement-breakpoint
ALTER TABLE "chapters" ALTER COLUMN "position" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "current_version_id" text;--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "published";