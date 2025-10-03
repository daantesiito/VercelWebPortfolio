import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || '2025-10-03'
    
    // Verificar si la tabla existe y tiene datos
    const tableCheck = await query(`
      SELECT COUNT(*) as count FROM "DailyWord"
    `)
    
    // Buscar la palabra específica
    const wordResult = await query(`
      SELECT * FROM "DailyWord" WHERE date = $1
    `, [date])
    
    // Obtener algunas palabras de ejemplo
    const sampleWords = await query(`
      SELECT date, word FROM "DailyWord" ORDER BY date LIMIT 5
    `)
    
    return NextResponse.json({
      success: true,
      debug: {
        totalWords: tableCheck.rows[0]?.count || 0,
        requestedDate: date,
        wordFound: wordResult.rows.length > 0,
        wordData: wordResult.rows[0] || null,
        sampleWords: sampleWords.rows
      }
    })
  } catch (error) {
    console.error('❌ Debug DB error:', error)
    return NextResponse.json({ 
      error: 'Error en debug DB',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
