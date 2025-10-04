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
    // Usar SQL raw para evitar problemas de prepared statements en Vercel
    const result = await query(`
      SELECT * FROM "TwitchdleGame" 
      WHERE "userId" = $1 AND "date" = $2
      LIMIT 1
    `, [userId, date])
    
    if (!result.rows || result.rows.length === 0) {
      return null
    }
    
    const game = result.rows[0]
    const board = JSON.parse(game.board)
    
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
    
    // Obtener la palabra del día automáticamente si no se proporciona
    let wordToGuess = gameState.wordToGuess
    if (!wordToGuess) {
      wordToGuess = await getDailyWord(gameState.date)
    }
    
    // Usar SQL raw para evitar problemas de prepared statements en Vercel
    const upsertResult = await query(`
      INSERT INTO "TwitchdleGame" (
        id, "userId", "date", "wordToGuess", board, "currentRow", "currentCol", 
        "gameFinished", won, attempts, streak, "maxStreak", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
      )
      ON CONFLICT ("userId", "date")
      DO UPDATE SET
        board = $4,
        "currentRow" = $5,
        "currentCol" = $6,
        "gameFinished" = $7,
        won = $8,
        attempts = $9,
        streak = $10,
        "maxStreak" = $11,
        "wordToGuess" = $3,
        "updatedAt" = NOW()
      RETURNING *
    `, [
      gameState.userId,
      gameState.date,
      wordToGuess,
      JSON.stringify(gameState.board),
      gameState.currentRow,
      gameState.currentCol,
      gameState.gameFinished,
      gameState.won,
      gameState.attempts,
      gameState.streak,
      gameState.maxStreak
    ])
    
    const game = upsertResult.rows[0]
    
    const board = JSON.parse(game.board)
    
    
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
    // Buscar la palabra en la base de datos usando SQL raw
    const result = await query(`SELECT word FROM "DailyWord" WHERE date = $1 LIMIT 1`, [date])
    
    if (result.rows && result.rows.length > 0) {
      const word = result.rows[0].word
      return word
    }
    
    // Si no existe, generar automáticamente basado en la fecha
    const generatedWord = await generateDailyWordFromDate(date)
    return generatedWord
  } catch (error) {
    console.error('❌ getDailyWord error:', error)
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
    
    return selectedWord
  } catch (error) {
    console.error('❌ generateDailyWordFromDate error:', error)
    throw error
  }
}

// Generar palabra del día para una fecha específica
export async function generateDailyWord(date: string, word?: string): Promise<string> {
  try {
    //console.log('🎲 generateDailyWord called for date:', date)
    
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
