'use client'

import { useState, useCallback } from 'react'

interface ScoreSubmissionResult {
  best: number
  updated: boolean
}

export function useScoreSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSubmission, setLastSubmission] = useState<{ score: number; timestamp: number } | null>(null)

  const submitScore = useCallback(async (score: number): Promise<ScoreSubmissionResult | null> => {
    // Evitar spam: no enviar el mismo score en menos de 5 segundos
    if (lastSubmission && 
        lastSubmission.score === score && 
        Date.now() - lastSubmission.timestamp < 5000) {
      return null
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game: '2048',
          value: score,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit score')
      }

      const result: ScoreSubmissionResult = await response.json()
      
      setLastSubmission({ score, timestamp: Date.now() })
      
      // Emitir evento para actualizar el leaderboard si el score fue actualizado
      if (result.updated) {
        window.dispatchEvent(new CustomEvent('scoreUpdated'))
      }
      
      return result
    } catch (error) {
      // Error submitting score - silently fail
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [lastSubmission])

  return {
    submitScore,
    isSubmitting,
  }
}
