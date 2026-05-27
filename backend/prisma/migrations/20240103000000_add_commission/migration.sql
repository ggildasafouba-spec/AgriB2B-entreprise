ALTER TABLE "Escrow"
  ADD COLUMN IF NOT EXISTS "commission"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sellerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Recalcule les escrows existants (5% commission)
UPDATE "Escrow"
SET
  "commission"   = ROUND(("amount" * 0.05)::numeric, 2),
  "sellerAmount" = ROUND(("amount" * 0.95)::numeric, 2);
