-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "followers" INTEGER DEFAULT 0,
ADD COLUMN     "isStreamer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twitchId" TEXT,
ADD COLUMN     "twitchLogin" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Migrate data from Profile to User
UPDATE "User" 
SET 
  "twitchId" = p."twitchId",
  "twitchLogin" = p."twitchLogin", 
  "displayName" = p."displayName",
  "avatarUrl" = p."avatarUrl",
  "followers" = COALESCE(p."followers", 0),
  "isStreamer" = COALESCE(p."isStreamer", false),
  "updatedAt" = CURRENT_TIMESTAMP
FROM "Profile" p 
WHERE "User".id = p."userId";

-- CreateIndex
CREATE UNIQUE INDEX "User_twitchId_key" ON "User"("twitchId");

-- CreateIndex
CREATE UNIQUE INDEX "User_twitchLogin_key" ON "User"("twitchLogin");

-- DropTable
DROP TABLE "Profile";
