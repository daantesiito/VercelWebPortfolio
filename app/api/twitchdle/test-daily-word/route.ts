import { NextRequest, NextResponse } from 'next/server'
import { getDailyWord } from '@/lib/twitchdle'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TEST: getDailyWord endpoint called')
    
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || '2025-10-04'
    
    console.log('🔍 TEST: Calling getDailyWord with date:', date)
    
    const word = await getDailyWord(date)
    
    console.log('🔍 TEST: getDailyWord returned:', word)
    
    return NextResponse.json({ 
      success: true, 
      date, 
      word,
      message: 'Test successful'
    })
  } catch (error) {
    console.error('❌ TEST: getDailyWord error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
