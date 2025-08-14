ALTER TABLE "works" ALTER COLUMN "word_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "word_count" integer DEFAULT 0 NOT NULL;