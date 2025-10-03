import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/database'

// GET: Debug endpoint para verificar datos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    
    // Verificar todos los juegos del usuario
    const gamesQuery = `SELECT * FROM "TwitchdleGame" WHERE "userId" = $1 ORDER BY "createdAt" DESC`
    const gamesResult = await query(gamesQuery, [session.user.id])
    
    // Verificar scores del usuario
    const scoresQuery = `SELECT * FROM "Score" WHERE "userId" = $1 AND "gameSlug" = 'twitchdle'`
    const scoresResult = await query(scoresQuery, [session.user.id])
    
    // Verificar usuario
    const userQuery = `SELECT * FROM "User" WHERE id = $1`
    const userResult = await query(userQuery, [session.user.id])
    
    const debugData = {
      userId: session.user.id,
      games: gamesResult.rows,
      scores: scoresResult.rows,
      user: userResult.rows[0] || null,
      gamesCount: gamesResult.rows.length,
      scoresCount: scoresResult.rows.length
    }
    
    
    return NextResponse.json(debugData)
  } catch (error) {
    console.error('❌ DEBUG error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
