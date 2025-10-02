import { useState, useEffect } from 'react'

export function useNextWordCountdown() {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const updateCountdown = () => {
      // Obtener la hora actual
      const now = new Date()
      
      // Obtener la fecha actual en Buenos Aires
      const buenosAiresNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}))
      
      // Calcular las 00:00 del día siguiente en Buenos Aires
      const tomorrowBuenosAires = new Date(buenosAiresNow)
      tomorrowBuenosAires.setDate(tomorrowBuenosAires.getDate() + 1)
      tomorrowBuenosAires.setHours(0, 0, 0, 0)
      
      // Calcular la diferencia de tiempo (en milisegundos)
      const timeDiff = tomorrowBuenosAires.getTime() - buenosAiresNow.getTime()
      
      if (timeDiff <= 0) {
        setTimeLeft('¡Nueva palabra disponible!')
        return
      }
      
      // Calcular horas, minutos y segundos
      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
      
      // Formatear el tiempo
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${seconds}s`)
      }
    }

    // Actualizar inmediatamente
    updateCountdown()
    
    // Actualizar cada segundo
    const interval = setInterval(updateCountdown, 1000)
    
    return () => clearInterval(interval)
  }, [])

  return timeLeft
}
