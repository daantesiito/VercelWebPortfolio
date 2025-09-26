'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import TwitchdleGame from './TwitchdleGame'
import TopScores from '@/components/TopScores'
import UserProfile from './UserProfile'
import { useUserCreation } from '../hooks/useUserCreation'
import type { TopScore } from '@/components/TopScores'

interface TwitchdleWithLeaderboardProps {
  initialStreakScores: TopScore[]
}

export default function TwitchdleWithLeaderboard({ initialStreakScores }: TwitchdleWithLeaderboardProps) {
  const { data: session } = useSession()
  const [streakScores, setStreakScores] = useState<TopScore[]>(initialStreakScores)
  
  // Crear/actualizar usuario en la base de datos
  useUserCreation()

  useEffect(() => {
    // Función para actualizar los scores de racha
    const updateStreakScores = async () => {
      try {
        const response = await fetch('/api/scores?game=twitchdle&limit=10&streak=true')
        
        if (response.ok) {
          const newScores = await response.json()
          setStreakScores(newScores)
        }
      } catch (error) {
        // Error fetching scores - silently fail
      }
    }

    // Escuchar eventos de score actualizado
    const handleScoreUpdated = () => {
      // Pequeño delay para asegurar que el score se haya guardado en la DB
      setTimeout(updateStreakScores, 500)
    }

    // Agregar event listener
    window.addEventListener('streakUpdated', handleScoreUpdated)

    // Cleanup
    return () => {
      window.removeEventListener('streakUpdated', handleScoreUpdated)
    }
  }, [])

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
        
        {/* Leaderboard de racha en el medio izquierda */}
        <div className="fixed left-8 top-1/2 transform -translate-y-1/2 z-10">
          <TopScores scores={streakScores} game="twitchdle" title="TOP RACHA" />
        </div>
      </div>
    </div>
  )
}
