-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TRANSPORTER';

-- CreateTable
CREATE TABLE "TransportRate" (
    "id" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "productCategory" TEXT NOT NULL,
    "pricePerKg" DOUBLE PRECISION NOT NULL,
    "pricePerUnit" DOUBLE PRECISION,
    "minWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxWeight" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "vehicleType" TEXT,
    "estimatedDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransportRate_transporterId_idx" ON "TransportRate"("transporterId");

-- CreateIndex
CREATE INDEX "TransportRate_origin_destination_idx" ON "TransportRate"("origin", "destination");

-- CreateIndex
CREATE INDEX "TransportRate_productCategory_idx" ON "TransportRate"("productCategory");

-- AddForeignKey
ALTER TABLE "TransportRate" ADD CONSTRAINT "TransportRate_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
