ALTER TYPE "public"."bank_transaction_status" ADD VALUE 'order_cancelled';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "device_hash" varchar(64);