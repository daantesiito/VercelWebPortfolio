import { NextRequest, NextResponse } from 'next/server'
import { getDailyWord } from '@/lib/twitchdle'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    }
    
    const word = await getDailyWord(date)
    
    return NextResponse.json({ 
      success: true, 
      date, 
      word 
    })
  } catch (error) {
    console.error('❌ Error en daily-word API:', error)
    return NextResponse.json({ 
      error: 'No se encontró palabra del día para esta fecha' 
    }, { status: 404 })
  }
}
