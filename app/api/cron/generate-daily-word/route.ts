import { NextRequest, NextResponse } from 'next/server'
import { generateDailyWord } from '@/lib/twitchdle'

// Cron job que se ejecuta diariamente a las 00:00 UTC
export async function GET(request: NextRequest) {
  try {
    // Verificar que es una llamada de cron (Vercel añade headers especiales)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
        
    // Generar palabra para mañana
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]
    
    // Por ahora, el cron job no genera palabras automáticamente
    // Las palabras deben ser establecidas manualmente via el endpoint admin
    // o pre-pobladas en la BD usando el script de seed
    
    return NextResponse.json({
      success: false,
      message: 'Cron job deshabilitado - las palabras deben ser establecidas manualmente',
      date: tomorrowDate
    })
  } catch (error) {
    console.error('❌ Error en cron job generate-daily-word:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
