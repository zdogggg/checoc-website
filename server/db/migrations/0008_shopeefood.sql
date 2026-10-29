CREATE TYPE "public"."order_channel" AS ENUM('website', 'shopeefood');--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'platform';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "channel" "order_channel" DEFAULT 'website' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "external_code" varchar(40);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "platform_fee" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_channel_external_code_idx" ON "orders" USING btree ("channel","external_code");