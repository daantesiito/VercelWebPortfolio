import { NextRequest, NextResponse } from 'next/server'
import { getDailyWord } from '@/lib/twitchdle'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || '2025-10-03'
    
    console.log('🧪 Daily-word API called for date:', date)
    
    const word = await getDailyWord(date)
    
    return NextResponse.json({ 
      success: true, 
      date, 
      word,
      message: 'Function executed successfully'
    })
  } catch (error) {
    console.error('❌ Daily-word API error:', error)
    return NextResponse.json({ 
      error: 'Daily-word API failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
