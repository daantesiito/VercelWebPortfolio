-- Crear tabla para estadísticas de Twitchdle
CREATE TABLE IF NOT EXISTS "TwitchdleStats" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "totalGames" INTEGER NOT NULL DEFAULT 0,
  "victories" INTEGER NOT NULL DEFAULT 0,
  "successRate" INTEGER NOT NULL DEFAULT 0,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "maxStreak" INTEGER NOT NULL DEFAULT 0,
  "winDistribution" TEXT NOT NULL DEFAULT '[0,0,0,0,0,0]',
  "lastGameDate" TEXT,
  "lastWinDate" TEXT,
  "lastGameWon" BOOLEAN,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TwitchdleStats_pkey" PRIMARY KEY ("id")
);

-- Crear índice único para userId
CREATE UNIQUE INDEX IF NOT EXISTS "TwitchdleStats_userId_key" ON "TwitchdleStats"("userId");

-- Crear índice para ordenar por maxStreak (para leaderboard)
CREATE INDEX IF NOT EXISTS "TwitchdleStats_maxStreak_idx" ON "TwitchdleStats"("maxStreak" DESC);

-- Agregar foreign key constraint si es necesario
-- ALTER TABLE "TwitchdleStats" ADD CONSTRAINT "TwitchdleStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
