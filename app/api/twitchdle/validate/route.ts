import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateWord, getDailyWord } from '@/lib/twitchdle'

// POST: Validar una palabra
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { word, date } = body
    
    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: 'Palabra requerida' }, { status: 400 })
    }
    
    const currentDate = date || new Date().toISOString().split('T')[0]
    const wordToGuess = await getDailyWord(currentDate)
    
    // Validar que la palabra sea válida
    const isValid = await validateWord(word)
    
    if (!isValid) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Palabra inválida' 
      }, { status: 400 })
    }
    
    // Validar que tenga la longitud correcta
    if (word.length !== wordToGuess.length) {
      return NextResponse.json({ 
        valid: false, 
        error: `La palabra debe tener ${wordToGuess.length} letras` 
      }, { status: 400 })
    }
    
    // Calcular el resultado del guess
    const result = calculateGuessResult(word, wordToGuess)
    
    return NextResponse.json({
      valid: true,
      result,
      isCorrect: word === wordToGuess
    })
  } catch (error) {
    console.error('❌ POST /api/twitchdle/validate error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Función para calcular el resultado del guess (colores de las letras)
function calculateGuessResult(guess: string, word: string): string[] {
  const result: string[] = []
  const wordArray = word.split('')
  const guessArray = guess.split('')
  
  // Primera pasada: marcar letras correctas
  for (let i = 0; i < guessArray.length; i++) {
    if (guessArray[i] === wordArray[i]) {
      result[i] = 'correct'
      wordArray[i] = '' // Marcar como usada
    }
  }
  
  // Segunda pasada: marcar letras presentes pero en posición incorrecta
  for (let i = 0; i < guessArray.length; i++) {
    if (result[i] === 'correct') continue
    
    const letterIndex = wordArray.indexOf(guessArray[i])
    if (letterIndex !== -1) {
      result[i] = 'present'
      wordArray[letterIndex] = '' // Marcar como usada
    } else {
      result[i] = 'absent'
    }
  }
  
  return result
}
