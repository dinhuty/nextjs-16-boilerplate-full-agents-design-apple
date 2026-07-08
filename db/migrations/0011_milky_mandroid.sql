CREATE TABLE "md_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#888888' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "md_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "task_docs" (
	"task_id" integer NOT NULL,
	"doc_id" integer NOT NULL,
	CONSTRAINT "task_docs_task_id_doc_id_pk" PRIMARY KEY("task_id","doc_id")
);
--> statement-breakpoint
ALTER TABLE "task_docs" ADD CONSTRAINT "task_docs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_docs" ADD CONSTRAINT "task_docs_doc_id_md_docs_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."md_docs"("id") ON DELETE cascade ON UPDATE no action;