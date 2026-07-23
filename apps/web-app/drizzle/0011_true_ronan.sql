CREATE TABLE "tree_history_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"node_id" text,
	"payload" jsonb NOT NULL,
	"restored_from_event_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tree_history_snapshots" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"phase" text NOT NULL,
	"node_id" text NOT NULL,
	"parent_id" text,
	"content" jsonb,
	"type" text NOT NULL,
	"metadata" jsonb,
	"expanded" boolean NOT NULL,
	"order" text NOT NULL,
	"due_date" date,
	"tags" jsonb NOT NULL,
	"depth" integer NOT NULL,
	"is_root" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tree_history_events" ADD CONSTRAINT "tree_history_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_history_snapshots" ADD CONSTRAINT "tree_history_snapshots_event_id_tree_history_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."tree_history_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tree_history_events_user_created_idx" ON "tree_history_events" USING btree ("user_id","created_at","id");--> statement-breakpoint
CREATE INDEX "tree_history_events_created_idx" ON "tree_history_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tree_history_snapshots_event_idx" ON "tree_history_snapshots" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "tree_history_snapshots_node_idx" ON "tree_history_snapshots" USING btree ("node_id");