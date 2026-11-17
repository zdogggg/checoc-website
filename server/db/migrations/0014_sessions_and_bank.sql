CREATE TYPE "public"."bank_transaction_status" AS ENUM('matched', 'unmatched', 'amount_mismatch', 'already_paid');--> statement-breakpoint
CREATE TABLE "bank_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(20) NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"amount" integer NOT NULL,
	"content" varchar(500) DEFAULT '' NOT NULL,
	"account_number" varchar(40) DEFAULT '' NOT NULL,
	"occurred_at" timestamp with time zone,
	"order_id" integer,
	"status" "bank_transaction_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "sessions_valid_after" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_transactions_provider_id_idx" ON "bank_transactions" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE INDEX "bank_transactions_order_idx" ON "bank_transactions" USING btree ("order_id");