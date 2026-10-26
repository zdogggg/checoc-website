ALTER TABLE "categories" ALTER COLUMN "icon" SET DEFAULT '';--> statement-breakpoint
-- Emoji category icons are no longer shown anywhere
UPDATE "categories" SET "icon" = '';
