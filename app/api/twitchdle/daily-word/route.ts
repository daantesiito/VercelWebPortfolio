import { NextRequest, NextResponse } from 'next/server'
import { getDailyWord } from '@/lib/twitchdle'

// Cache en memoria para evitar consultas repetidas a BD
const wordCache = new Map<string, { word: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    }
    
    // Verificar cache en memoria primero
    const cached = wordCache.get(date)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📦 Using cached word for date:', date)
      return NextResponse.json({ 
        success: true, 
        date, 
        word: cached.word 
      }, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5min cache, 10min stale
          'CDN-Cache-Control': 'max-age=3600', // 1 hora en CDN
          'Vercel-CDN-Cache-Control': 'max-age=3600',
        }
      })
    }
    
    const word = await getDailyWord(date)
    
    // Guardar en cache
    wordCache.set(date, { word, timestamp: Date.now() })
    
    return NextResponse.json({ 
      success: true, 
      date, 
      word 
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5min cache, 10min stale
        'CDN-Cache-Control': 'max-age=3600', // 1 hora en CDN
        'Vercel-CDN-Cache-Control': 'max-age=3600',
      }
    })
  } catch (error) {
    console.error('❌ Error en daily-word API:', error)
    return NextResponse.json({ 
      error: 'No se encontró palabra del día para esta fecha' 
    }, { status: 404 })
  }
}
