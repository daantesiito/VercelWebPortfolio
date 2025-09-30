'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import TwitchdleGame from './TwitchdleGame'
import TopScores from '@/components/TopScores'
import UserProfile from './UserProfile'
import { useUserCreation } from '../hooks/useUserCreation'
import type { TopScore } from '@/components/TopScores'
import { useQueryClient } from '@tanstack/react-query'
import { useLeaderboard } from '../hooks/useStats'

interface TwitchdleWithLeaderboardProps {
  initialStreakScores: TopScore[]
}

export default function TwitchdleWithLeaderboard({ initialStreakScores }: TwitchdleWithLeaderboardProps) {
  const { data: session } = useSession()
  useUserCreation()

  const dateKey = new Date().toISOString().split('T')[0]
  const qc = useQueryClient()

  // seed cache con SSR initialStreakScores para paint instantáneo
  useEffect(() => {
    qc.setQueryData(['leaderboard', 'streak', dateKey], initialStreakScores)
  }, [qc, dateKey, initialStreakScores])

  const { data: streakScores = initialStreakScores } = useLeaderboard(dateKey)
  const typedStreakScores = (streakScores as TopScore[]) || initialStreakScores

  useEffect(() => {
    // Escuchar eventos de score actualizado
    const handleScoreUpdated = () => {
      // Invalidar cache para refetch
      qc.invalidateQueries({ queryKey: ['leaderboard', 'streak', dateKey] })
    }

    // Agregar event listener
    window.addEventListener('streakUpdated', handleScoreUpdated)

    // Cleanup
    return () => {
      window.removeEventListener('streakUpdated', handleScoreUpdated)
    }
  }, [qc, dateKey])

  if (!session) {
    return null // El componente padre maneja la pantalla de login
  }

  return (
    <div className="twitchdle-game">
      <div className="relative">
        {/* Juego Twitchdle */}
        <TwitchdleGame />
        
        {/* Perfil de usuario en la esquina superior derecha */}
        <UserProfile />
        
        {/* Leaderboard de racha en el medio izquierda - solo visible cuando NO hay stats screen */}
        <div className="fixed left-8 top-1/2 transform -translate-y-1/2 z-10" id="leaderboard-container">
          <TopScores scores={typedStreakScores} game="twitchdle" title="TOP RACHA" />
        </div>
      </div>
    </div>
  )
}
