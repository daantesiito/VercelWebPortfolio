import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTwitchdleGame, upsertTwitchdleGame, getDailyWord, validateWord, type TwitchdleGameState } from '@/lib/twitchdle'

// GET: Obtener el estado del juego del usuario para el día actual
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0] // YYYY-MM-DD
    
    //console.log('🔍 GET /api/twitchdle/game:', { userId: session.user.id, date })
    
    const game = await getTwitchdleGame(session.user.id, date)
    
    //console.log('🔍 Game result from DB:', game ? 'FOUND' : 'NOT FOUND')
    
    if (!game) {
      // Si no hay juego, devolver null para que el frontend muestre tablero vacío
      //console.log('🔍 Returning null - no game found')
      return NextResponse.json(null)
    }
    
    //console.log('🔍 Returning game data:', { 
      //gameFinished: game.gameFinished, 
      //won: game.won, 
      //attempts: game.attempts 
    //})
    
    return NextResponse.json(game)
  } catch (error) {
    console.error('❌ GET /api/twitchdle/game error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST: Actualizar el estado del juego
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { 
      date, 
      board, 
      currentRow, 
      currentCol, 
      gameFinished, 
      won, 
      attempts, 
      streak, 
      maxStreak,
      guess // Palabra que el usuario está intentando adivinar
    } = body
    
    //console.log('💾 POST /api/twitchdle/game:', { 
      //userId: session.user.id, 
      //date, 
      //gameFinished, 
      //won, 
      //attempts,
      //guess 
    //})
    
    // Validar que la fecha sea válida
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
    }
    
    // Obtener la palabra del día para validación
    const wordToGuess = await getDailyWord(date)
    
    // Si el usuario está haciendo un guess, validar la palabra
    if (guess) {
      const isValidWord = await validateWord(guess)
      if (!isValidWord) {
        return NextResponse.json({ error: 'Palabra inválida' }, { status: 400 })
      }
      
      // Validar que el guess tenga la longitud correcta
      if (guess.length !== wordToGuess.length) {
        return NextResponse.json({ error: 'Longitud de palabra incorrecta' }, { status: 400 })
      }
    }
    
    // Crear el estado del juego
    const gameState: TwitchdleGameState = {
      userId: session.user.id,
      date,
      wordToGuess,
      board: board || Array(6).fill(null).map(() => Array(wordToGuess.length).fill('')),
      currentRow: currentRow || 0,
      currentCol: currentCol || 0,
      gameFinished: gameFinished || false,
      won: won || null,
      attempts: attempts || 0,
      streak: streak || 0,
      maxStreak: maxStreak || 0
    }
    
    const updatedGame = await upsertTwitchdleGame(gameState)
    
    if (!updatedGame) {
      return NextResponse.json({ error: 'Error al guardar el juego' }, { status: 500 })
    }
    
    // Si el juego terminó, guardar/actualizar el score en la tabla de scores
    if (gameFinished) {
      try {
        const { upsertBestScore } = await import('@/lib/scores')
        // Usar maxStreak para el leaderboard (la mejor racha del usuario)
        const scoreToSave = won ? maxStreak : 0 // Si gana, guardar la racha máxima; si pierde, guardar 0
        await upsertBestScore(
          session.user.id,
          'twitchdle',
          scoreToSave
        )
        console.log('✅ Score saved to leaderboard:', { 
          userId: session.user.id, 
          score: scoreToSave, 
          won: won,
          currentStreak: streak,
          maxStreak: maxStreak
        })
      } catch (error) {
        console.error('❌ Error saving score to leaderboard:', error)
        // No fallar el request si no se puede guardar el score
      }
    }
    
    return NextResponse.json(updatedGame)
  } catch (error) {
    console.error('❌ POST /api/twitchdle/game error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
