import { NextRequest } from 'next/server'

export default function DebugEnvPage() {
  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return <div>Debug page not available in production</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🔧 Environment Variables Debug</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">NextAuth Configuration:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>NEXTAUTH_URL: {process.env.NEXTAUTH_URL || 'NOT SET'}</li>
            <li>NEXTAUTH_SECRET: {process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET'}</li>
            <li>AUTH_URL: {process.env.AUTH_URL || 'NOT SET'}</li>
            <li>AUTH_SECRET: {process.env.AUTH_SECRET ? 'SET' : 'NOT SET'}</li>
            <li>AUTH_TRUST_HOST: {process.env.AUTH_TRUST_HOST || 'NOT SET'}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Twitch Configuration:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>TWITCH_CLIENT_ID: {process.env.TWITCH_CLIENT_ID || 'NOT SET'}</li>
            <li>TWITCH_CLIENT_SECRET: {process.env.TWITCH_CLIENT_SECRET ? 'SET' : 'NOT SET'}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Database Configuration:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>DATABASE_URL: {process.env.DATABASE_URL ? 'SET' : 'NOT SET'}</li>
            <li>DIRECT_URL: {process.env.DIRECT_URL ? 'SET' : 'NOT SET'}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Environment:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>NODE_ENV: {process.env.NODE_ENV}</li>
            <li>VERCEL: {process.env.VERCEL || 'NOT SET'}</li>
            <li>VERCEL_URL: {process.env.VERCEL_URL || 'NOT SET'}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
