'use client'

import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

export default function UserProfile() {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/games/twitchdle' })
  }

  return (
    <div className="fixed top-4 right-4 z-20 flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-200">
      {session.user?.image && (
        <Image
          src={session.user.image}
          alt={session.user.name || 'User Avatar'}
          width={40}
          height={40}
          className="rounded-full"
        />
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-800">
          {session.user?.name || 'Jugador'}
        </span>
        <span className="text-xs text-gray-500">
          @{session.user?.name?.toLowerCase().replace(/\s+/g, '') || 'player'}
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
      >
        Logout
      </button>
    </div>
  )
}
