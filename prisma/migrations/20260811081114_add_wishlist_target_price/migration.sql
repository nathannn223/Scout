-- AlterTable
ALTER TABLE "WishlistItem" ADD COLUMN     "alertSentAt" TIMESTAMP(3),
ADD COLUMN     "targetPrice" DECIMAL(65,30);
