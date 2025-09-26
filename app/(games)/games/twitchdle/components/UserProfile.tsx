'use client'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

export default function UserProfile() {
  const { data: session } = useSession()

  if (!session || !session.user) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-200 z-20 flex items-center gap-3">
      {session.user.image && (
        <Image
          src={session.user.image}
          alt={session.user.name || 'User'}
          width={32}
          height={32}
          className="rounded-full"
        />
      )}
      <div className="text-gray-800">
        <div className="font-semibold text-sm">{session.user.name}</div>
        <div className="text-xs text-gray-500">{session.user.name}</div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/games/twitchdle' })}
        className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-lg text-xs transition-colors duration-200"
      >
        Logout
      </button>
    </div>
  )
}
