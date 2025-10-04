'use client'

import { useSession } from 'next-auth/react'

export default function UserProfile() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Cargando...</div>
  }

  if (!session) {
    return <div>No hay sesión activa</div>
  }

  const user = session.user as any
  const followers = user.followers ?? 0
  const isStreamer = user.isStreamer ?? false

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Perfil de Usuario</h2>
      
      <div className="space-y-2">
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Nombre:</strong> {user.name}</p>
        <p><strong>Twitch Login:</strong> {user.twitchLogin}</p>
        <p><strong>Followers:</strong> {followers.toLocaleString()}</p>
        <p><strong>Es Streamer:</strong> {isStreamer ? '✅ Sí' : '❌ No'}</p>
        
        {isStreamer && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
            <p className="text-green-800 font-semibold">
              🎉 ¡Eres un streamer! Tienes {followers.toLocaleString()} seguidores.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
