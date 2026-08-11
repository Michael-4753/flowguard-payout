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
	"country" text NOT NULL,
	"country_code" varchar(8) NOT NULL,
	"currency" varchar(8) NOT NULL,
	"entity_type" varchar(16) NOT NULL,
	"bank_name" text NOT NULL,
	"swift" varchar(16) NOT NULL,
	"iban" varchar(40) NOT NULL,
	"account_status" varchar(16) NOT NULL,
	"restricted_region" boolean DEFAULT false NOT NULL,
	"bank_blacklisted" boolean DEFAULT false NOT NULL,
	"preferred_channel" varchar(32) NOT NULL,
	"risk_tag" varchar(16) DEFAULT 'low' NOT NULL,
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
	"currency" varchar(8) NOT NULL,
	"risk_score" double precision NOT NULL,
	"risk_level" varchar(16) NOT NULL,
	"return_probability" double precision DEFAULT 0 NOT NULL,
	"chokepoint_bank" varchar(128) DEFAULT '' NOT NULL,
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