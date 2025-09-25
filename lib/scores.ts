import { prisma } from './prisma-serverless'

export interface TopScore {
  displayName: string
  avatarUrl: string | null
  twitchLogin: string
  value: number
}

export async function getTopScores(gameSlug: string, limit: number = 10): Promise<TopScore[]> {
  try {
    console.log(`🔍 getTopScores: Fetching ${limit} scores for game ${gameSlug}`);
    const scores = await prisma.score.findMany({
      where: {
        gameSlug,
      },
      include: {
        user: true,
      },
      orderBy: {
        value: 'desc',
      },
      take: limit,
    })

    console.log(`✅ getTopScores: Found ${scores.length} scores`);
    return scores.map((score: any) => ({
      displayName: score.user.displayName || score.user.name || 'Anonymous',
      avatarUrl: score.user.avatarUrl || score.user.image,
      twitchLogin: score.user.twitchLogin || 'unknown',
      value: score.value,
    }))
  } catch (error) {
    console.error('❌ getTopScores error:', error);
    return [];
  }
}

export async function getTopStreamerScores(gameSlug: string, limit: number = 10): Promise<TopScore[]> {
  try {
    console.log(`🔍 getTopStreamerScores: Fetching ${limit} streamer scores for game ${gameSlug}`);
    const scores = await prisma.score.findMany({
      where: {
        gameSlug,
        user: {
          isStreamer: true, // Filter by isStreamer directly on User
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        value: 'desc',
      },
      take: limit,
    })

    console.log(`✅ getTopStreamerScores: Found ${scores.length} streamer scores`);
    return scores.map((score: any) => ({
      displayName: score.user.displayName || score.user.name || 'Anonymous',
      avatarUrl: score.user.avatarUrl || score.user.image,
      twitchLogin: score.user.twitchLogin || 'unknown',
      value: score.value,
    }))
  } catch (error) {
    console.error('❌ getTopStreamerScores error:', error);
    return [];
  }
}

export async function upsertBestScore(
  userId: string,
  gameSlug: string,
  value: number
): Promise<{ best: number; updated: boolean }> {
  const existingScore = await prisma.score.findUnique({
    where: {
      userId_gameSlug: {
        userId,
        gameSlug,
      },
    },
  })

  if (!existingScore) {
    // Crear nuevo score
    await prisma.score.create({
      data: {
        userId,
        gameSlug,
        value,
      },
    })
    return { best: value, updated: true }
  }

  if (value > existingScore.value) {
    // Actualizar con mejor score
    await prisma.score.update({
      where: {
        userId_gameSlug: {
          userId,
          gameSlug,
        },
      },
      data: {
        value,
      },
    })
    return { best: value, updated: true }
  }

  return { best: existingScore.value, updated: false }
}

export function validateGameSlug(gameSlug: string): boolean {
  const validGames = ['2048', 'twitchdle', 'suika']
  return validGames.includes(gameSlug)
}

export function validateScoreValue(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 1e9
}
