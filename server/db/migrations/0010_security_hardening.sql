ALTER TABLE "coupons" ADD COLUMN "per_phone_limit" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD COLUMN "purpose" varchar(20) DEFAULT 'login' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_changed_at" timestamp with time zone;