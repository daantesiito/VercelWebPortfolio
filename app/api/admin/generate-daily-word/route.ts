import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateDailyWord } from '@/lib/twitchdle'

// Endpoint manual para generar palabras del día (solo para administradores)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Por ahora, permitir a cualquier usuario autenticado
    // En el futuro, podrías verificar si es admin
    // const isAdmin = session.user.email === 'admin@example.com'
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    // }
    
    const body = await request.json()
    const { date, word } = body
    
    if (!date) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    }
    
    if (!word) {
      return NextResponse.json({ error: 'Palabra requerida' }, { status: 400 })
    }
    
    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'Formato de fecha inválido (YYYY-MM-DD)' }, { status: 400 })
    }
    
    // Validar que la palabra sea válida
    if (word.length < 3 || word.length > 7) {
      return NextResponse.json({ error: 'La palabra debe tener entre 3 y 7 caracteres' }, { status: 400 })
    }
    
    const generatedWord = await generateDailyWord(date, word)
    
    return NextResponse.json({
      success: true,
      date,
      word: generatedWord,
      message: 'Palabra del día establecida manualmente'
    })
  } catch (error) {
    console.error('❌ Error en generate-daily-word:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
