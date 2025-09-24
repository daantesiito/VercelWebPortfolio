'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

export interface TopScore {
  displayName: string
  avatarUrl: string | null
  twitchLogin: string
  value: number
}

interface TopScoresProps {
  scores: TopScore[]
  game: string
  limit?: number
  title?: string
}

export default function TopScores({ scores, game, limit = 10, title = "Top" }: TopScoresProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatNumber = (num: number) => {
    if (!isClient) return num.toString() // Durante SSR, usar formato simple
    return num.toLocaleString() // En el cliente, usar formato localizado
  }

  if (scores.length === 0) {
    return (
      <div className="leaderboard-container">
        <h3>🏆 {title}</h3>
        <p className="text-gray-600 text-center py-4 text-sm">
          No hay scores aún
        </p>
      </div>
    )
  }

  return (
    <div className="leaderboard-container">
      <h3>🏆 {title}</h3>
      <div className="leaderboard-scroll">
        {scores.map((score, index) => {
          const rank = index + 1;
          const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-4-plus';
          const scoreClass = rank <= 3 ? `score-${rank}` : 'score-4-plus';
          
          return (
            <div
              key={`${score.twitchLogin}-${score.value}`}
              className="leaderboard-item flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className={`leaderboard-rank ${rankClass}`}>
                  {rank}
                </div>
                {score.avatarUrl ? (
                  <Image
                    src={score.avatarUrl}
                    alt={score.displayName}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                    <span className="text-white text-xs">?</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-gray-800 font-medium text-sm truncate">{score.displayName}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`leaderboard-score ${scoreClass}`}>{formatNumber(score.value)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
