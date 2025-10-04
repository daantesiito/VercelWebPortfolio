import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { gameDateString } from '@/app/(games)/games/twitchdle/lib/gameDay'

// Fijar runtime a nodejs para Prisma
export const runtime = 'nodejs'

// Validador simple de YYYY-MM-DD
function isYyyyMmDd(s?: string | null): boolean {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

// Construir ETag para cache
function makeEtag(date: string, word?: string): string {
  return `"dw-${date}-${word ?? 'nf'}"`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    // Si no mandan ?date, usamos la fecha BA de "ahora"
    const date = isYyyyMmDd(searchParams.get('date'))
      ? (searchParams.get('date') as string)
      : gameDateString()
    
    console.log('🔍 GET /api/twitchdle/daily-word:', { date })
    
    // Buscar en la base de datos usando SQL raw
    const result = await query(
      `SELECT date, word FROM "DailyWord" WHERE date = $1 LIMIT 1`, 
      [date]
    )
    
    console.log('🔍 Database query result:', result.rows?.length || 0, 'rows found')
    
    if (!result.rows || result.rows.length === 0) {
      console.log('❌ No word found for date:', date)
      return NextResponse.json(
        { error: `No daily word for date ${date}` },
        { status: 404 }
      )
    }
    
    const row = result.rows[0]
    const body = { date: row.date, word: row.word }
    const etag = makeEtag(row.date, row.word)
    
    console.log('✅ Word found:', { date: row.date, word: row.word })
    
    // Soportar If-None-Match para cache
    const inm = request.headers.get('if-none-match')
    if (inm && inm === etag) {
      console.log('📦 Returning 304 - Not Modified')
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      })
    }
    
    return NextResponse.json(body, {
      status: 200,
      headers: {
        ETag: etag,
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    })
    
  } catch (error) {
    console.error('❌ Error en daily-word API:', error)
    
    // Si hay error de base de datos, devolver 503 para reintento
    if (error instanceof Error && error.message.includes('database')) {
      return NextResponse.json(
        { error: 'Service unavailable (database error)' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
