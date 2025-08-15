-- Drop identity before attempting to set a plain DEFAULT
ALTER TABLE "chapter_versions" ALTER COLUMN "version_number" DROP IDENTITY IF EXISTS;--> statement-breakpoint
-- Set a neutral default; application code will assign & resequence 1..N per chapter
ALTER TABLE "chapter_versions" ALTER COLUMN "version_number" SET DEFAULT 0;--> statement-breakpoint
-- OPTIONAL: remove the implicitly created sequence (name may vary). Ignore errors if it didn't exist.
DO $$
BEGIN
	PERFORM 1 FROM pg_class WHERE relkind = 'S' AND relname = 'chapter_versions_version_number_seq';
	IF FOUND THEN
		EXECUTE 'DROP SEQUENCE IF EXISTS chapter_versions_version_number_seq';
	END IF;
END$$;--> statement-breakpoint
-- Resequence existing rows so version_number becomes 1..N per chapter (ordered by created_at)
WITH ranked AS (
	SELECT id, row_number() OVER (PARTITION BY chapter_id ORDER BY created_at) AS rn
	FROM chapter_versions
)
UPDATE chapter_versions cv
SET version_number = ranked.rn
FROM ranked
WHERE cv.id = ranked.id;