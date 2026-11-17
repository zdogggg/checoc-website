ALTER TYPE "public"."loyalty_reason" ADD VALUE 'refund_reversal';--> statement-breakpoint
ALTER TYPE "public"."loyalty_reason" ADD VALUE 'expired';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refunded_at" timestamp with time zone;--> statement-breakpoint
-- Spending (and the tier built on it) now counts goods only, like points and revenue:
-- shipping is no longer included. Recompute it from completed orders.
-- Tier thresholds as in shared/utils/loyalty.ts at the time of writing (silver 500k, gold 2M).
UPDATE "customers" c SET
  "total_spent" = s.goods,
  "tier" = CASE WHEN s.goods >= 2000000 THEN 'gold'::customer_tier WHEN s.goods >= 500000 THEN 'silver'::customer_tier ELSE 'member'::customer_tier END
FROM (
  SELECT cu.id, coalesce(sum(o.subtotal - o.discount - o.points_discount) FILTER (WHERE o.status = 'completed'), 0)::int AS goods
  FROM "customers" cu LEFT JOIN "orders" o ON o.customer_id = cu.id
  GROUP BY cu.id
) s
WHERE s.id = c.id;
