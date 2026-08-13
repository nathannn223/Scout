-- AlterTable
ALTER TABLE "WishlistItem" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "expiryReminder14dSentAt" TIMESTAMP(3),
ADD COLUMN     "expiryReminder24hSentAt" TIMESTAMP(3);
