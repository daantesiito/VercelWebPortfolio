'use client'

import { useState, useEffect } from 'react'

interface ScoreNotificationProps {
  show: boolean
  isNewRecord: boolean
  onClose: () => void
}

export default function ScoreNotification({ show, isNewRecord, onClose }: ScoreNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000) // Auto-close after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`p-4 rounded-lg shadow-lg ${
        isNewRecord 
          ? 'bg-green-600 text-white' 
          : 'bg-blue-600 text-white'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {isNewRecord ? '🏆' : '💾'}
          </span>
          <div>
            <div className="font-bold">
              {isNewRecord ? '¡Nuevo récord!' : 'Score guardado'}
            </div>
            <div className="text-sm opacity-90">
              {isNewRecord 
                ? 'Tu mejor puntuación ha sido actualizada' 
                : 'Tu puntuación ha sido registrada'
              }
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-2 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
