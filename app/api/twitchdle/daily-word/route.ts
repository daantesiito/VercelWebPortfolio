import { NextRequest, NextResponse } from 'next/server'
import { getDailyWord } from '@/lib/twitchdle'

// Cache en memoria para evitar consultas repetidas a BD
const wordCache = new Map<string, { word: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Daily-word API called')
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    console.log('🔍 Date parameter:', date)
    
    if (!date) {
      console.log('❌ No date provided')
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    }
    
    console.log('🔍 About to call getDailyWord for date:', date)
    const word = await getDailyWord(date)
    console.log('🔍 getDailyWord returned:', word)
    
    return NextResponse.json({ 
      success: true, 
      date, 
      word 
    })
  } catch (error) {
    console.error('❌ Error en daily-word API:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: 'No se encontró palabra del día para esta fecha' 
    }, { status: 404 })
  }
}
