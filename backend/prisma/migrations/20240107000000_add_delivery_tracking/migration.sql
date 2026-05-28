-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_CITY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED');

-- CreateEnum
CREATE TYPE "DeliveryService" AS ENUM ('EXPRESS', 'STANDARD', 'ECONOMIQUE', 'FRIGORIFIQUE');

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "transportRateId" TEXT,
    "transporterId" TEXT,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "serviceType" "DeliveryService" NOT NULL DEFAULT 'STANDARD',
    "weight" DOUBLE PRECISION,
    "deliveryCost" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transporterAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryAddress" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedDate" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryTracking" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");
CREATE INDEX "Delivery_orderId_idx" ON "Delivery"("orderId");
CREATE INDEX "Delivery_transporterId_idx" ON "Delivery"("transporterId");
CREATE INDEX "Delivery_status_idx" ON "Delivery"("status");
CREATE INDEX "DeliveryTracking_deliveryId_idx" ON "DeliveryTracking"("deliveryId");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeliveryTracking" ADD CONSTRAINT "DeliveryTracking_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
