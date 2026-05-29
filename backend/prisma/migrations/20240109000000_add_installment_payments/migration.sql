-- CreateEnum
CREATE TYPE "InstallmentPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DEFAULTED');

-- CreateTable InstallmentPlan
CREATE TABLE "InstallmentPlan" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 2,
    "status" "InstallmentPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstallmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable InstallmentPayment
CREATE TABLE "InstallmentPayment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstallmentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstallmentPlan_orderId_key" ON "InstallmentPlan"("orderId");
CREATE INDEX "InstallmentPlan_orderId_idx" ON "InstallmentPlan"("orderId");
CREATE INDEX "InstallmentPayment_planId_idx" ON "InstallmentPayment"("planId");

-- AddForeignKey
ALTER TABLE "InstallmentPayment" ADD CONSTRAINT "InstallmentPayment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InstallmentPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
