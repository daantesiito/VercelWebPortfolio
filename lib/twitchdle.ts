import { query } from './database'
import { prisma } from './database'

export interface TwitchdleGameState {
  id?: string
  userId: string
  date: string
  wordToGuess?: string // Opcional - se obtiene automáticamente si no se proporciona
  board: string[][]
  currentRow: number
  currentCol: number
  gameFinished: boolean
  won: boolean | null
  attempts: number
  streak: number
  maxStreak: number
}

export interface TwitchdleGameResponse {
  id: string
  date: string
  board: string[][]
  currentRow: number
  currentCol: number
  gameFinished: boolean
  won: boolean | null
  attempts: number
  streak: number
  maxStreak: number
  // wordToGuess NO se incluye por seguridad
}

// Obtener el estado del juego del usuario para el día actual
export async function getTwitchdleGame(userId: string, date: string): Promise<TwitchdleGameResponse | null> {
  try {
    console.log('🔍 getTwitchdleGame called:', { userId, date })
    
    const game = await prisma.twitchdleGame.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    })
    
    if (!game) {
      console.log('❌ No game found for user and date')
      return null
    }
    
    const board = JSON.parse(game.board)
    
    console.log('✅ Game found:', { 
      id: game.id, 
      gameFinished: game.gameFinished, 
      won: game.won,
      attempts: game.attempts 
    })
    
    return {
      id: game.id,
      date: game.date,
      board,
      currentRow: game.currentRow,
      currentCol: game.currentCol,
      gameFinished: game.gameFinished,
      won: game.won,
      attempts: game.attempts,
      streak: game.streak,
      maxStreak: game.maxStreak
    }
  } catch (error) {
    console.error('❌ getTwitchdleGame error:', error)
    return null
  }
}

// Crear o actualizar el estado del juego
export async function upsertTwitchdleGame(gameState: TwitchdleGameState): Promise<TwitchdleGameResponse | null> {
  try {
    console.log('💾 upsertTwitchdleGame called:', { 
      userId: gameState.userId, 
      date: gameState.date,
      gameFinished: gameState.gameFinished,
      won: gameState.won,
      attempts: gameState.attempts
    })
    
    // Obtener la palabra del día automáticamente si no se proporciona
    let wordToGuess = gameState.wordToGuess
    if (!wordToGuess) {
      wordToGuess = await getDailyWord(gameState.date)
    }
    
    const game = await prisma.twitchdleGame.upsert({
      where: {
        userId_date: {
          userId: gameState.userId,
          date: gameState.date,
        },
      },
      update: {
        board: JSON.stringify(gameState.board),
        currentRow: gameState.currentRow,
        currentCol: gameState.currentCol,
        gameFinished: gameState.gameFinished,
        won: gameState.won,
        attempts: gameState.attempts,
        streak: gameState.streak,
        maxStreak: gameState.maxStreak,
        wordToGuess: wordToGuess,
      },
      create: {
        userId: gameState.userId,
        date: gameState.date,
        wordToGuess: wordToGuess,
        board: JSON.stringify(gameState.board),
        currentRow: gameState.currentRow,
        currentCol: gameState.currentCol,
        gameFinished: gameState.gameFinished,
        won: gameState.won,
        attempts: gameState.attempts,
        streak: gameState.streak,
        maxStreak: gameState.maxStreak,
      },
    })
    
    const board = JSON.parse(game.board)
    
    console.log('✅ Game upserted successfully:', { 
      id: game.id, 
      gameFinished: game.gameFinished, 
      won: game.won 
    })
    
    return {
      id: game.id,
      date: game.date,
      board,
      currentRow: game.currentRow,
      currentCol: game.currentCol,
      gameFinished: game.gameFinished,
      won: game.won,
      attempts: game.attempts,
      streak: game.streak,
      maxStreak: game.maxStreak
    }
  } catch (error) {
    console.error('❌ upsertTwitchdleGame error:', error)
    return null
  }
}

// Obtener la palabra del día desde la base de datos
export async function getDailyWord(date: string): Promise<string> {
  try {
    console.log('🔍 getDailyWord called for date:', date)
    console.log('🔍 Environment:', process.env.NODE_ENV)
    console.log('🔍 Database URL exists:', !!process.env.DATABASE_URL)
    console.log('🔍 Vercel deployment test - updated')
    
    // Buscar la palabra en la base de datos usando SQL raw
    console.log('🔍 About to execute SQL query for date:', date)
    const result = await query(`SELECT word FROM "DailyWord" WHERE date = $1 LIMIT 1`, [date])
    
    console.log('🔍 SQL query result:', { rowCount: result.rowCount, rows: result.rows })
    
    if (result.rows && result.rows.length > 0) {
      const word = result.rows[0].word
      console.log('✅ Daily word found in DB:', { date, word })
      console.log('🎯 PALABRA DEL DÍA:', word)
      return word
    }
    
    // Si no existe, generar automáticamente basado en la fecha
    console.log('🔄 No word found, generating based on date...')
    const generatedWord = await generateDailyWordFromDate(date)
    console.log('✅ Generated word for date:', { date, word: generatedWord })
    return generatedWord
  } catch (error) {
    console.error('❌ getDailyWord error:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

// Generar palabra del día basada en la fecha (selección lineal)
async function generateDailyWordFromDate(date: string): Promise<string> {
  try {
    // Calcular días desde una fecha base (ej: 2025-01-01)
    const baseDate = new Date('2025-01-01')
    const currentDate = new Date(date)
    const daysDiff = Math.floor((currentDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Obtener todas las palabras ordenadas por fecha de creación
    const allWordsResult = await query(`
      SELECT word FROM "DailyWord" 
      ORDER BY "createdAt" ASC
    `)
    
    if (!allWordsResult.rows || allWordsResult.rows.length === 0) {
      throw new Error('No hay palabras disponibles en la base de datos')
    }
    
    const wordList = allWordsResult.rows.map(row => row.word)
    const wordIndex = daysDiff % wordList.length
    const selectedWord = wordList[wordIndex]
    
    // Guardar la palabra seleccionada para esta fecha
    await query(`
      INSERT INTO "DailyWord" (id, date, word, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
      ON CONFLICT (date) 
      DO UPDATE SET word = $2, "updatedAt" = NOW()
    `, [date, selectedWord])
    
    console.log('🎲 Generated word from date:', { date, daysDiff, wordIndex, selectedWord })
    return selectedWord
  } catch (error) {
    console.error('❌ generateDailyWordFromDate error:', error)
    throw error
  }
}

// Generar palabra del día para una fecha específica
export async function generateDailyWord(date: string, word?: string): Promise<string> {
  try {
    console.log('🎲 generateDailyWord called for date:', date)
    
    if (!word) {
      throw new Error('Se debe proporcionar una palabra específica para generar la palabra del día')
    }
    
    // Usar SQL raw para insertar/actualizar
    await query(`
      INSERT INTO "DailyWord" (id, date, word, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
      ON CONFLICT (date) 
      DO UPDATE SET word = $2, "updatedAt" = NOW()
    `, [date, word])
    
    console.log('✅ Daily word set:', { date, word })
    return word
  } catch (error) {
    console.error('❌ generateDailyWord error:', error)
    throw error
  }
}

// Validar si una palabra es válida (en el futuro, esto podría ser una tabla de palabras válidas)
export async function validateWord(word: string): Promise<boolean> {
  try {
    // Por ahora, todas las palabras son válidas como solicitaste
    // En el futuro, esto podría consultar una tabla de palabras válidas
    return word.length >= 3 && word.length <= 7
  } catch (error) {
    console.error('❌ validateWord error:', error)
    return false
  }
}
