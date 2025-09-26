import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { getTopScores, getTopStreamerScores, getTopStreakScores, upsertBestScore, validateGameSlug, validateScoreValue } from '@/lib/scores'

const ScoreRequestSchema = z.object({
  game: z.string().min(1),
  value: z.number().int().min(0).max(1e9),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const game = searchParams.get('game')
    const limit = parseInt(searchParams.get('limit') || '10')
    const streamersOnly = searchParams.get('streamers') === 'true'
    const streakOnly = searchParams.get('streak') === 'true'

    if (!game || !validateGameSlug(game)) {
      return NextResponse.json(
        { error: 'Invalid game slug. Must be one of: 2048, twitchdle, suika' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    let scores
    if (streakOnly) {
      scores = await getTopStreakScores(game, limit)
    } else if (streamersOnly) {
      scores = await getTopStreamerScores(game, limit)
    } else {
      scores = await getTopScores(game, limit)
    }
    
    return NextResponse.json(scores)
  } catch (error) {
    console.error('Error fetching scores:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { game, value } = ScoreRequestSchema.parse(body)

    if (!validateGameSlug(game)) {
      return NextResponse.json(
        { error: 'Invalid game slug. Must be one of: 2048, twitchdle, suika' },
        { status: 400 }
      )
    }

    if (!validateScoreValue(value)) {
      return NextResponse.json(
        { error: 'Invalid score value' },
        { status: 400 }
      )
    }

    const result = await upsertBestScore(session.user.id, game, value)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error saving score:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
