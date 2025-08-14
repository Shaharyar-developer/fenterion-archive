ALTER TABLE "chapters" ALTER COLUMN "position" ADD GENERATED ALWAYS AS IDENTITY (sequence name "chapters_position_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "status" "chapter_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "chapter_versions" DROP COLUMN "status";