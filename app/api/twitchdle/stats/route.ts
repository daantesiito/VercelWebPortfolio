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
    
    //console.log('💾 POST /api/twitchdle/stats:', { 
      //userId: session.user.id, 
      //gameDate,
      //totalGames,
      //victories,
      //currentStreak,
      //maxStreak
    //})
    
    // Validar que el userId coincida con la sesión
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Usuario no coincide' }, { status: 403 })
    }
    
    // TODO: Implementar cuando se cree la tabla TwitchdleStats
    // Por ahora, solo loguear y devolver éxito
    //console.log('📊 Stats received (table not created yet):', {
      //userId: session.user.id,
      //totalGames,
      //victories,
      //maxStreak,
      //currentStreak
    //})
    
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
    
    //console.log('✅ Stats saved to database:', {
      //userId: next.userId,
      //totalGames: next.totalGames,
      //victories: next.victories,
      //maxStreak: next.maxStreak
    //})
    
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
    
    //console.log('🔍 GET /api/twitchdle/stats (simplified):', { userId: session.user.id })
    
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