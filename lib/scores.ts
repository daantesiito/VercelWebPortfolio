import { getScores } from './database'
import { prisma } from './prisma'

export interface TopScore {
  displayName: string
  avatarUrl: string | null
  twitchLogin: string
  value: number
  userId?: string
}

export async function getTopScores(gameSlug: string, limit: number = 10): Promise<TopScore[]> {
  try {
    //console.log(`🔍 getTopScores: Fetching ${limit} scores for game ${gameSlug}`);
    const scores = await getScores(gameSlug, limit, false)

    //console.log(`✅ getTopScores: Found ${scores.length} scores`);
    return scores.map((score: any) => ({
      displayName: score.displayname || score.displayName || 'Anonymous',
      avatarUrl: score.avatarurl || score.avatarUrl,
      twitchLogin: score.twitchLogin || 'unknown',
      value: score.value,
      userId: score.userid || score.userId,
    }))
  } catch (error) {
    console.error('getTopScores error:', error);
    return [];
  }
}

export async function getTopStreamerScores(gameSlug: string, limit: number = 10): Promise<TopScore[]> {
  try {
    const scores = await getScores(gameSlug, limit, true)
    return scores.map((score: any) => ({
      displayName: score.displayname || score.displayName || 'Anonymous',
      avatarUrl: score.avatarurl || score.avatarUrl,
      twitchLogin: score.twitchLogin || 'unknown',
      value: score.value,
      userId: score.userid || score.userId,
    }))
  } catch (error) {
    console.error('getTopStreamerScores error:', error);
    return [];
  }
}

// Nueva función para obtener leaderboard desde TwitchdleStats
export async function getTwitchdleLeaderboard(limit: number = 10): Promise<TopScore[]> {
  try {
    // TODO: Implementar cuando se cree la tabla TwitchdleStats
    // Por ahora, devolver array vacío
    
    return []
  } catch (error) {
    console.error('getTwitchdleLeaderboard error:', error);
    return [];
  }
}

export async function upsertBestScore(
  userId: string,
  gameSlug: string,
  value: number
): Promise<{ best: number; updated: boolean }> {
  // Para Twitchdle, usar lógica específica de racha
  if (gameSlug === 'twitchdle') {
    return await upsertTwitchdleStreak(userId, value)
  }
  
  // Para otros juegos, usar lógica de mejor score
  const { upsertScore } = await import('./database')
  
  try {
    const result = await upsertScore(userId, gameSlug, value)
    return { best: result.value, updated: result.is_new_record || false }
  } catch (error) {
    console.error('❌ Error upserting score:', error)
    return { best: 0, updated: false }
  }
}

// Función específica para manejar rachas de Twitchdle
async function upsertTwitchdleStreak(
  userId: string,
  currentStreak: number
): Promise<{ best: number; updated: boolean }> {
  const { query } = await import('./database')
  
  try {
    
    const queryText = `
      INSERT INTO "Score" (id, "userId", "gameSlug", value, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
      ON CONFLICT ("userId", "gameSlug") DO UPDATE SET
        value = EXCLUDED.value,  -- Siempre actualizar con el valor actual (no GREATEST)
        "updatedAt" = NOW()
      RETURNING value
    `
    
    const result = await query(queryText, [userId, 'twitchdle', currentStreak])
    
    return { best: result.rows[0].value, updated: true }
  } catch (error) {
    console.error('Error upserting Twitchdle streak:', error)
    return { best: 0, updated: false }
  }
}

export function validateGameSlug(gameSlug: string): boolean {
  const validGames = ['2048', 'twitchdle', 'suika']
  return validGames.includes(gameSlug)
}

export async function getTopStreakScores(gameSlug: string, limit: number = 10): Promise<TopScore[]> {
  try {
    const { getStreakScores } = await import('./database')
    const scores = await getStreakScores(gameSlug, limit)

    return scores.map((score: any) => ({
      displayName: score.displayname || score.displayName || 'Anonymous',
      avatarUrl: score.avatarurl || score.avatarUrl,
      twitchLogin: score.twitchLogin || 'unknown',
      value: score.value,
      userId: score.userid || score.userId,
    }))
  } catch (error) {
    console.error('getTopStreakScores error:', error);
    return [];
  }
}

export function validateScoreValue(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 1e9
}
