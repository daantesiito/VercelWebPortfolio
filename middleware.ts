import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  
  // Forzar apex (sin www)
  if (host === 'www.dantesito.dev') {
    return NextResponse.redirect(
      new URL(req.nextUrl.pathname + req.nextUrl.search, 'https://dantesito.dev')
    )
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*']
}
