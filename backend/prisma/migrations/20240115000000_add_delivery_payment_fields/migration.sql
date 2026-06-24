-- Ajout des champs de paiement livraison sur DeliveryRequest
ALTER TABLE "DeliveryRequest" ADD COLUMN "paymentStatus" TEXT;
ALTER TABLE "DeliveryRequest" ADD COLUMN "paymentRef" TEXT;
