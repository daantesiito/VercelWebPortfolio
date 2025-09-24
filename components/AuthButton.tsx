'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'

interface AuthButtonProps {
  callbackUrl?: string
  className?: string
}

export default function AuthButton({ callbackUrl, className = '' }: AuthButtonProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn('twitch', { callbackUrl: callbackUrl || '/' })}
        className={`bg-[#9146ff] hover:bg-[#7c3aed] text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-3 ${className}`}
      >
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
        </svg>
        Login con Twitch
      </button>
    )
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        {session.user?.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={40}
            height={40}
            className="rounded-full"
          />
        )}
        <div className="text-white">
          <div className="font-semibold">{session.user?.name}</div>
          <div className="text-sm text-gray-300">@{session.user?.twitchId}</div>
        </div>
      </div>
      <button
        onClick={() => signOut()}
        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
      >
        Logout
      </button>
    </div>
  )
}
