ALTER TABLE "tasks" ADD COLUMN "basic_design_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "links" jsonb DEFAULT '[]'::jsonb NOT NULL;