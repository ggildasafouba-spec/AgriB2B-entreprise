-- Table des demandes de livraison (acheteur → transporteurs disponibles)
CREATE TABLE "DeliveryRequest" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "orderId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "pickupAddress" TEXT NOT NULL,
  "deliveryAddress" TEXT NOT NULL,
  "distanceKm" DOUBLE PRECISION,
  "estimatedPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "proposedPrice" DOUBLE PRECISION,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "acceptedById" TEXT,
  "acceptedPrice" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeliveryRequest_pkey" PRIMARY KEY ("id")
);

-- Index
CREATE INDEX "DeliveryRequest_status_idx" ON "DeliveryRequest"("status");
CREATE INDEX "DeliveryRequest_buyerId_idx" ON "DeliveryRequest"("buyerId");
CREATE INDEX "DeliveryRequest_acceptedById_idx" ON "DeliveryRequest"("acceptedById");
CREATE UNIQUE INDEX "DeliveryRequest_orderId_key" ON "DeliveryRequest"("orderId");
