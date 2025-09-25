import { getScores } from './database'

export interface TopScore {
  displayName: string
  avatarUrl: string | null
  twitchLogin: string
  value: number
}

export async function getTopScores(gameSlug: string, limit: number = 10): Promise<TopScore[]> {
  try {
    console.log(`🔍 getTopScores: Fetching ${limit} scores for game ${gameSlug}`);
    const scores = await getScores(gameSlug, limit, false)

    console.log(`✅ getTopScores: Found ${scores.length} scores`);
    return scores.map((score: any) => ({
      displayName: score.displayname || score.displayName || 'Anonymous',
      avatarUrl: score.avatarurl || score.avatarUrl,
      twitchLogin: score.twitchLogin || 'unknown',
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
    const scores = await getScores(gameSlug, limit, true)

    console.log(`✅ getTopStreamerScores: Found ${scores.length} streamer scores`);
    return scores.map((score: any) => ({
      displayName: score.displayname || score.displayName || 'Anonymous',
      avatarUrl: score.avatarurl || score.avatarUrl,
      twitchLogin: score.twitchLogin || 'unknown',
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
  const { upsertScore } = await import('./database')
  
  try {
    const result = await upsertScore(userId, gameSlug, value)
    return { best: result.value, updated: true }
  } catch (error) {
    console.error('❌ Error upserting score:', error)
    return { best: 0, updated: false }
  }
}

export function validateGameSlug(gameSlug: string): boolean {
  const validGames = ['2048', 'twitchdle', 'suika']
  return validGames.includes(gameSlug)
}

export function validateScoreValue(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 1e9
}
