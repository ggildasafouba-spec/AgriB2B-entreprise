-- AlterTable: Add delivery options to Product (seller-defined)
ALTER TABLE "Product" ADD COLUMN "deliveryOptions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: Add delivery choice to Order (buyer-selected)
ALTER TABLE "Order" ADD COLUMN "deliveryOption" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryCostIncluded" DOUBLE PRECISION DEFAULT 0;
