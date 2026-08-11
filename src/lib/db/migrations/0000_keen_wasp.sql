CREATE TABLE "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"email" varchar(256),
	"name" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"name" text NOT NULL,
	"code_name" varchar(64) NOT NULL,
	"region" text NOT NULL,
	"country_code" varchar(8) NOT NULL,
	"restricted_region" boolean DEFAULT false NOT NULL,
	"preferred_chain" varchar(32) NOT NULL,
	"preferred_coin" varchar(16) NOT NULL,
	"payout_address" varchar(128) NOT NULL,
	"travel_rule_completeness" double precision DEFAULT 1 NOT NULL,
	"address_network_match" boolean DEFAULT true NOT NULL,
	"payment_count" integer DEFAULT 0 NOT NULL,
	"historical_return_rate" double precision DEFAULT 0 NOT NULL,
	"avg_settlement_hours" double precision DEFAULT 2 NOT NULL,
	"avg_amount_usd" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"supplier_id" varchar(64) NOT NULL,
	"supplier_name" varchar(256) NOT NULL,
	"supplier_code_name" varchar(64) NOT NULL,
	"amount_usd" double precision NOT NULL,
	"target_coin" varchar(16) NOT NULL,
	"risk_score" double precision NOT NULL,
	"risk_level" varchar(16) NOT NULL,
	"risk_factors" jsonb NOT NULL,
	"selected_route_id" varchar(64) NOT NULL,
	"route" jsonb NOT NULL,
	"status" varchar(16) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "suppliers_user_id_idx" ON "suppliers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_supplier_id_idx" ON "payments" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");