// Utilidad para limpiar localStorage viejo con keys de gameId
export function cleanupOldLocalStorage() {
  if (typeof window === 'undefined') return

  try {
    const keysToRemove: string[] = []
    
    // Buscar todas las keys que empiecen con 'twitchdle:' y contengan gameId (cmg...)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('twitchdle:') && key.includes('cmg')) {
        keysToRemove.push(key)
      }
    }
    
    // Remover las keys encontradas
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    if (keysToRemove.length > 0) {
    } else {
    }
  } catch (error) {
    console.error('❌ Error cleaning up localStorage:', error)
  }
}

// Función para mostrar el estado actual del localStorage
export function showLocalStorageStatus() {
  if (typeof window === 'undefined') return

  try {
    const twitchdleKeys = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('twitchdle:')) {
        twitchdleKeys.push(key)
      }
    }
    
    twitchdleKeys.forEach(key => {
    })
  } catch (error) {
    console.error('❌ Error showing localStorage status:', error)
  }
}
