CREATE TABLE "verification_cases" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"supplier_id" varchar(64) NOT NULL,
	"supplier_name" varchar(256) NOT NULL,
	"factor_id" varchar(64) NOT NULL,
	"factor_title" varchar(128) NOT NULL,
	"template" text NOT NULL,
	"bank_raw_description" text DEFAULT '' NOT NULL,
	"status" varchar(16) NOT NULL,
	"read_token" varchar(64) DEFAULT '' NOT NULL,
	"write_token" varchar(64) DEFAULT '' NOT NULL,
	"timeline" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "stablecoin_wallet" varchar(128);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "review" jsonb;--> statement-breakpoint
ALTER TABLE "verification_cases" ADD CONSTRAINT "verification_cases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "verification_cases_user_id_idx" ON "verification_cases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_cases_created_at_idx" ON "verification_cases" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "verification_cases_read_token_idx" ON "verification_cases" USING btree ("read_token");--> statement-breakpoint
CREATE INDEX "verification_cases_write_token_idx" ON "verification_cases" USING btree ("write_token");