-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('PENDING', 'COUNTER', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE "ReviewType" AS ENUM ('SELLER', 'BUYER', 'TRANSPORTER');

-- CreateTable Negotiation
CREATE TABLE "Negotiation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "originalPrice" DOUBLE PRECISION NOT NULL,
    "proposedPrice" DOUBLE PRECISION NOT NULL,
    "counterPrice" DOUBLE PRECISION,
    "finalPrice" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Negotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable NegotiationMessage
CREATE TABLE "NegotiationMessage" (
    "id" TEXT NOT NULL,
    "negotiationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "proposedPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NegotiationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable Review
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "type" "ReviewType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "Negotiation_buyerId_idx" ON "Negotiation"("buyerId");
CREATE INDEX "Negotiation_sellerId_idx" ON "Negotiation"("sellerId");
CREATE INDEX "Negotiation_productId_idx" ON "Negotiation"("productId");
CREATE INDEX "NegotiationMessage_negotiationId_idx" ON "NegotiationMessage"("negotiationId");
CREATE INDEX "Review_targetId_idx" ON "Review"("targetId");
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");
CREATE UNIQUE INDEX "Review_orderId_reviewerId_type_key" ON "Review"("orderId", "reviewerId", "type");

-- AddForeignKey
ALTER TABLE "NegotiationMessage" ADD CONSTRAINT "NegotiationMessage_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
