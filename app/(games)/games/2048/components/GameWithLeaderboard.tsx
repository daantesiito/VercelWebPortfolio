'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Game2048 from '../Game2048'
import TopScores from '@/components/TopScores'
import UserProfile from './UserProfile'
import { useUserCreation } from '../hooks/useUserCreation'
import type { TopScore } from '@/components/TopScores'

interface GameWithLeaderboardProps {
  initialScores: TopScore[]
  initialStreamerScores: TopScore[]
}

export default function GameWithLeaderboard({ initialScores, initialStreamerScores }: GameWithLeaderboardProps) {
  const { data: session } = useSession()
  const [scores, setScores] = useState<TopScore[]>(initialScores)
  const [streamerScores, setStreamerScores] = useState<TopScore[]>(initialStreamerScores)
  const [isKickTheme, setIsKickTheme] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  
  // Crear/actualizar usuario en la base de datos
  useUserCreation()

  useEffect(() => {
    // Función para actualizar los scores
    const updateScores = async () => {
      try {
        const [globalResponse, streamerResponse] = await Promise.all([
          fetch('/api/scores?game=2048&limit=100'),
          fetch('/api/scores?game=2048&limit=100&streamers=true')
        ])
        
        if (globalResponse.ok) {
          const newScores = await globalResponse.json()
          setScores(newScores)
        }
        
        if (streamerResponse.ok) {
          const newStreamerScores = await streamerResponse.json()
          setStreamerScores(newStreamerScores)
        }
      } catch (error) {
        // Error fetching scores - silently fail
      }
    }

    // Escuchar eventos de score actualizado
    const handleScoreUpdated = () => {
      // Pequeño delay para asegurar que el score se haya guardado en la DB
      setTimeout(updateScores, 500)
    }

    // Escuchar cambios de tema
    const handleThemeChange = () => {
      if (typeof document !== 'undefined') {
        const body = document.body
        setIsKickTheme(body.classList.contains('kick-theme'))
      }
    }

    // Auto-refresh cada 15 segundos
    const interval = setInterval(updateScores, 15000)

    // Agregar event listeners
    window.addEventListener('scoreUpdated', handleScoreUpdated)
    window.addEventListener('themeChanged', handleThemeChange)

    // Verificar tema inicial
    handleThemeChange()

    // Cleanup
    return () => {
      clearInterval(interval)
      window.removeEventListener('scoreUpdated', handleScoreUpdated)
      window.removeEventListener('themeChanged', handleThemeChange)
    }
  }, [])

  if (!session) {
    return null // El componente padre maneja la pantalla de login
  }

  return (
    <div className={`game-2048 ${isKickTheme ? 'kick-theme' : ''}`}>
      <div className="relative">
        {/* Juego original sin modificaciones */}
        <Game2048 />
        
        {/* Perfil de usuario en la esquina superior derecha */}
        <UserProfile />
        
        {/* Botón de guía debajo del perfil */}
        <div style={{ position: 'fixed', top: '3vh', right: '35vh', zIndex: 40 }}>
          <button 
            className="instructions-toggle-button"
            onClick={() => setShowGuide(true)}
            title="Ver guía del juego"
          >
            GUÍA
          </button>
        </div>
        
        {/* Leaderboards flotantes en el medio izquierda */}
        <div className="fixed left-8 top-1/2 transform -translate-y-1/2 z-10 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* TOP GLOBAL */}
          <TopScores scores={scores} game="2048" title="TOP GLOBAL" />
          
          {/* TOP STREAMERS */}
          <TopScores scores={streamerScores} game="2048" title="TOP STREAMERS" />
        </div>
        
        {/* Modal de guía */}
        {showGuide && (
          <div className="modal">
            <div className="modal-content" style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto' }}>
              <span className="close" onClick={() => setShowGuide(false)}>&times;</span>
              {/* Imagen de la guía */}
              <img
                src="/games/2048/media/guia.png"
                alt="Guía del juego 2048"
                style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
