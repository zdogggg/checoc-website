ALTER TABLE "orders" ADD COLUMN "request_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_request_id_unique" UNIQUE("request_id");