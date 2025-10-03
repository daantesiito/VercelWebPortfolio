import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Sincronizar estadísticas del usuario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const {
      userId,
      totalGames,
      victories,
      successRate,
      currentStreak,
      maxStreak,
      winDistribution,
      lastGameDate,
      lastWinDate,
      lastGameWon,
      processedAt,
      gameDate,
    } = body
    
    
    // Validar que el userId coincida con la sesión
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Usuario no coincide' }, { status: 403 })
    }
    
    const next = {
      userId: session.user.id,
      totalGames,
      victories,
      successRate,
      currentStreak,
      maxStreak,
      winDistribution: JSON.stringify(winDistribution),
      lastGameDate,
      lastWinDate,
      lastGameWon,
      updatedAt: new Date(processedAt || Date.now()),
    }
    
    return NextResponse.json({ ok: true, stats: next })
  } catch (error) {
    console.error('❌ POST /api/twitchdle/stats error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// GET: Obtener estadísticas del usuario (simplificado - solo para compatibilidad)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
        
    // Devolver estadísticas por defecto, ya que las estadísticas personales se manejan en el cliente
    return NextResponse.json({
      gamesPlayed: 0,
      victories: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: [0, 0, 0, 0, 0, 0],
      lastGameResult: null
    })
  } catch (error) {
    console.error('❌ GET /api/twitchdle/stats error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}