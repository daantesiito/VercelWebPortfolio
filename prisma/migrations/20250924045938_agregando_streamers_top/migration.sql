-- AlterTable
ALTER TABLE "public"."Profile" ADD COLUMN     "followers" INTEGER,
ADD COLUMN     "isStreamer" BOOLEAN NOT NULL DEFAULT false;
