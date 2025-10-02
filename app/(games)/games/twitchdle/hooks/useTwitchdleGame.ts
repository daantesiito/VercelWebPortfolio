import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bumpMyStreakOptimistic } from './useStats'
import { useTwitchdleStats, generateEmojiGrid as generateEmojiGridFromStats, syncStatsToServer } from './useTwitchdleStats'

// Bootstrap eliminado - solo BD

// Función para actualizar la tabla Score con el maxStreak
async function updateScoreTable(userId: string, maxStreak: number) {
  try {
    console.log('🔄 Updating Score table with maxStreak:', { userId, maxStreak })
    
    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game: 'twitchdle',
        value: maxStreak
      })
    })
    
    if (response.ok) {
      console.log('✅ Score table updated successfully')
    } else {
      console.error('❌ Failed to update Score table:', response.status)
    }
  } catch (error) {
    console.error('❌ Error updating Score table:', error)
  }
}

// Tipos base para el estado del juego
export type LetterStatus = 'absent' | 'present' | 'correct'
export type Cell = { letter: string; status?: LetterStatus }

// Estado comprometido (lo que se guarda en la API)
export interface GameSnapshot {
  id: string
  date: string
  committedBoard: Cell[][]  // filas evaluadas
  currentRow: number
  attempts: number          // = committedBoard.filter(fila llena).length
  gameFinished: boolean
  won: boolean | null
  streak: number
  maxStreak: number
  version: number           // ++ en cada commit
  updatedAt: string         // ISO string
}

// Estado completo (incluye draft)
export interface GameState extends GameSnapshot {
  draftRow: string[]        // lo que estoy escribiendo en la fila actual
  currentCol: number
  wordLength: number
  userId: string           // agregado para formar la key local estable
  wordOfDay: string        // palabra del día fija para la sesión del jugador
}

// Respuesta de la API (solo estado comprometido)
export interface GameResponse {
  id: string
  date: string
  board: string[][]         // Para compatibilidad con API actual
  currentRow: number
  currentCol: number
  gameFinished: boolean
  won: boolean | null
  attempts: number
  streak: number
  maxStreak: number
}

// === FUNCIONES DE UTILIDAD ===

// Función para generar el emoji grid
function generateEmojiGrid(committedBoard: Cell[][], attempts: number): string {
  let grid = ''
  // Solo mostrar filas que realmente tienen contenido evaluado
  for (let row = 0; row < committedBoard.length; row++) {
    if (committedBoard[row] && committedBoard[row].some(cell => cell && cell.status)) {
      for (let col = 0; col < committedBoard[row].length; col++) {
        const cell = committedBoard[row][col]
        if (cell && cell.status === 'correct') grid += '🟩'
        else if (cell && cell.status === 'present') grid += '🟨'
        else grid += '⬛'
      }
      grid += '\n'
    }
  }
  return grid
}

// Función para construir la distribución de intentos
function buildDistribution(gameState: GameState): number[] {
  const distribution = [0, 0, 0, 0, 0, 0]
  if (gameState.gameFinished && gameState.won) {
    distribution[gameState.attempts - 1] = 1
  }
  return distribution
}


// Función para evaluar localmente (algoritmo idéntico a Wordle)
function evaluateLocally(guessArr: string[], solution: string): Cell[] {
  const n = guessArr.length
  const res: Cell[] = Array.from({ length: n }, (_, i) => ({ letter: guessArr[i].toUpperCase() }))
  const sol = solution.toUpperCase().split('')

  // Conteo de letras disponibles para "present"
  const counts: Record<string, number> = {}
  for (const ch of sol) counts[ch] = (counts[ch] || 0) + 1

  // Primera pasada: correct
  for (let i = 0; i < n; i++) {
    if (res[i].letter === sol[i]) {
      res[i].status = 'correct'
      counts[res[i].letter]--
    }
  }
  
  // Segunda pasada: present/absent
  for (let i = 0; i < n; i++) {
    if (res[i].status === 'correct') continue
    const ch = res[i].letter
    if ((counts[ch] || 0) > 0) {
      res[i].status = 'present'
      counts[ch]--
    } else {
      res[i].status = 'absent'
    }
  }
  
  return res
}

  // Función para calcular la racha correctamente
function calculateStreak(currentStreak: number, won: boolean, isFirstGame: boolean): number {
  if (won) {
    // Si gana, incrementar la racha
    return currentStreak + 1
  } else {
    // Si pierde, resetear la racha a 0
    return 0
  }
}

// Función para cargar estadísticas del usuario
async function loadUserStats(userId: string) {
  try {
    const response = await fetch('/api/twitchdle/stats')
    if (!response.ok) {
      throw new Error('Error al cargar estadísticas')
    }
    return await response.json()
  } catch (error) {
    console.error('❌ Error loading user stats:', error)
    return null
  }
}

// Funciones de localStorage eliminadas - solo BD

// Función para cargar la palabra del día una sola vez
async function ensureDailyWord(date: string, setState: (updater: (s: GameState | null) => GameState | null) => void): Promise<string> {
  const res = await fetch(`/api/twitchdle/daily-word?date=${date}`, { cache: 'force-cache' })
  const { word } = await res.json()
  const upper = (word || '').toUpperCase()
  
  // Actualizar el estado con la palabra del día
  setState(s => s ? { ...s, wordOfDay: upper } : null)
  
  return upper
}

// Función para convertir board plano a committedBoard
function convertBoardToCommitted(board: string[][], wordLength: number): Cell[][] {
  return board
    .filter(row => row.some(cell => cell && cell.includes(':'))) // Solo filas con contenido evaluado
    .map(row => 
      row.slice(0, wordLength).map(cell => {
        if (!cell) return { letter: '', status: undefined }
        if (cell.includes(':')) {
          const [letter, status] = cell.split(':')
          return { letter, status: status as LetterStatus }
        }
        return { letter: cell, status: undefined }
      })
    )
}

// Función para convertir committedBoard a board plano (para API)
function convertCommittedToBoard(committedBoard: Cell[][]): string[][] {
  return committedBoard.map(row => 
    row.map(cell => cell.status ? `${cell.letter}:${cell.status}` : cell.letter)
  )
}

// Función para aplicar estado del servidor con guard de versión
function applyServerToLocal(server: GameResponse, setState: (updater: (s: GameState | null) => GameState | null) => void, wordLength: number, userId: string) {
  setState(local => {
    if (!local) {
      // Primera carga: convertir respuesta del servidor
      console.log('🔄 First load from server, converting board:', server.board)
      const committedBoard = convertBoardToCommitted(server.board, wordLength)
      console.log('✅ Converted committedBoard:', committedBoard)
      const newState: GameState = {
        id: server.id,
        date: server.date,
        committedBoard,
        currentRow: server.currentRow,
        attempts: server.attempts,
        gameFinished: server.gameFinished,
        won: server.won,
        streak: server.streak,
        maxStreak: server.maxStreak,
        version: 1,
        updatedAt: new Date().toISOString(),
        draftRow: [],
        currentCol: 0,
        wordLength,
        userId,
        wordOfDay: '' // Se llenará cuando se cargue la palabra del día
      }
      return newState
    }

    // Si el servidor tiene un juego terminado, siempre priorizarlo
    if (server.gameFinished && !local.gameFinished) {
      console.log('🎯 Server has finished game, prioritizing server data')
      const committedBoard = convertBoardToCommitted(server.board, wordLength)
      const serverState: GameState = {
        ...local,
        id: server.id,
        date: server.date,
        committedBoard,
        currentRow: server.currentRow,
        attempts: server.attempts,
        gameFinished: server.gameFinished,
        won: server.won,
        streak: server.streak,
        maxStreak: server.maxStreak,
        version: Math.max(local.version ?? 1, 1),
        updatedAt: new Date().toISOString(),
        draftRow: [],
        currentCol: 0,
        wordLength,
        wordOfDay: local.wordOfDay || ''
      }
      return serverState
    }

    // Verificar si el servidor tiene datos más nuevos
    const serverIsStale = 
      (server.attempts ?? 0) < (local.attempts ?? 0) ||
      (server.currentRow ?? 0) < (local.currentRow ?? 0)

    if (serverIsStale) {
      console.log('🔄 Ignoring stale server data:', {
        serverAttempts: server.attempts,
        localAttempts: local.attempts,
        serverCurrentRow: server.currentRow,
        localCurrentRow: local.currentRow
      })
      return local // Ignorar datos del servidor más viejos
    }

    // Merge: servidor como base, conservar draft si existe
    const committedBoard = convertBoardToCommitted(server.board, wordLength)
    const merged: GameState = {
      ...local,
      id: server.id,
      date: server.date,
      committedBoard,
      currentRow: server.currentRow,
      attempts: server.attempts,
      gameFinished: server.gameFinished,
      won: server.won,
      streak: server.streak,
      maxStreak: server.maxStreak,
      version: Math.max(local.version ?? 1, 1),
      updatedAt: new Date().toISOString(),
      // Conservar draft si existe
      draftRow: local.draftRow?.length ? local.draftRow : [],
      currentCol: local.draftRow?.length ?? 0,
      wordLength,
      // Conservar wordOfDay si ya está cargada
      wordOfDay: local.wordOfDay || ''
    }
    return merged
  })
}

export function useTwitchdleGame() {
  const { data: session } = useSession()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const qc = useQueryClient()
  const solutionRef = useRef<string | null>(null)
  
  // Hook de estadísticas locales (estilo Boludle)
  const { stats, updateStats } = useTwitchdleStats()

  // Mutación optimista para enviar intentos
  const sendAttempt = useMutation({
    mutationFn: async (payload: { gameId: string; date: string; rowIndex: number; guess: string; clientVersion: number }) => {
      const res = await fetch('/api/twitchdle/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: payload.date,
          board: convertCommittedToBoard(gameState?.committedBoard || []),
          currentRow: payload.rowIndex + 1,
          currentCol: 0,
          gameFinished: false,
          won: null,
          attempts: payload.rowIndex + 1,
          streak: gameState?.streak || 0,
          maxStreak: gameState?.maxStreak || 0,
          guess: payload.guess
        })
      })
      if (!res.ok) throw new Error('attempt failed')
      return res.json() as Promise<GameResponse>
    },
    onSuccess: (serverResponse) => {
      // Actualizar cache con respuesta del servidor
      qc.setQueryData(['game', serverResponse.id, serverResponse.date], (local: GameState | undefined) => {
        if (!local) {
          const committedBoard = convertBoardToCommitted(serverResponse.board, serverResponse.board[0]?.length || 4)
          return {
            id: serverResponse.id,
            date: serverResponse.date,
            committedBoard,
            currentRow: serverResponse.currentRow,
            attempts: serverResponse.attempts,
            gameFinished: serverResponse.gameFinished,
            won: serverResponse.won,
            streak: serverResponse.streak,
            maxStreak: serverResponse.maxStreak,
            version: 1,
            updatedAt: new Date().toISOString(),
            draftRow: [],
            currentCol: 0,
            wordLength: serverResponse.board[0]?.length || 4,
            userId: session?.user?.id || '',
            wordOfDay: ''
          } as GameState
        }
        
        // Solo actualizar si el servidor tiene datos más nuevos
        const serverIsNewer = 
          (serverResponse.attempts ?? 0) >= (local.attempts ?? 0) &&
          (serverResponse.currentRow ?? 0) >= (local.currentRow ?? 0)
        if (!serverIsNewer) {
          console.log('🔄 Ignoring stale server response in mutation:', {
            serverAttempts: serverResponse.attempts,
            localAttempts: local.attempts,
            serverCurrentRow: serverResponse.currentRow,
            localCurrentRow: local.currentRow
          })
          return local
        }
        
        const committedBoard = convertBoardToCommitted(serverResponse.board, local.wordLength)
        return {
          ...local,
          id: serverResponse.id,
          date: serverResponse.date,
          committedBoard,
          currentRow: serverResponse.currentRow,
          attempts: serverResponse.attempts,
          gameFinished: serverResponse.gameFinished,
          won: serverResponse.won,
          streak: serverResponse.streak,
          maxStreak: serverResponse.maxStreak,
          version: (local.version ?? 0) + 1,
          updatedAt: new Date().toISOString(),
          draftRow: local.draftRow ?? [],
          currentCol: local.draftRow?.length ?? 0,
          wordOfDay: local.wordOfDay || ''
        }
      })
    }
  })

  // Cargar el estado del juego
  const loadGame = useCallback(async (date?: string) => {
    if (!session?.user?.id) {
      console.log('❌ No session or user ID available')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const currentDate = date || new Date().toISOString().split('T')[0]
      
      // Cargar solo desde BD - sin localStorage
      const response = await fetch(`/api/twitchdle/game?date=${currentDate}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar el juego')
      }
      
      const game: GameResponse | null = await response.json()
      
      if (!game) {
        // No hay juego guardado, crear uno nuevo instantáneamente
        console.log('🆕 Creando nuevo juego instantáneamente...')
        
        // Cargar la palabra del día para obtener el largo
        const solution = await ensureDailyWord(currentDate, setGameState)
        const wordLength = solution.length
        
        // Cargar estadísticas del usuario para calcular la racha correcta
        const userStats = await loadUserStats(session.user.id)
        const currentStreak = userStats?.currentStreak || 0
        const maxStreak = userStats?.maxStreak || 0
        
        console.log('📊 User stats loaded:', { currentStreak, maxStreak, userStats })
        
        const initialState: GameState = {
          id: '',
          date: currentDate,
          committedBoard: Array(6).fill(null).map(() => Array(wordLength).fill({ letter: '', status: undefined })),
          currentRow: 0,
          attempts: 0,
          gameFinished: false,
          won: null,
          streak: currentStreak,
          maxStreak: maxStreak,
          version: 1,
          updatedAt: new Date().toISOString(),
          draftRow: [],
          currentCol: 0,
          wordLength: wordLength,
          userId: session.user.id,
          wordOfDay: solution
        }
        
        // Establecer la solución en el ref
        solutionRef.current = solution
        
        setGameState(initialState)
        return
      }
      
      // Cargar la solución para el juego existente
      const solution = await ensureDailyWord(currentDate, setGameState)
      solutionRef.current = solution
      
      // Aplicar estado del servidor con guard de versión
      applyServerToLocal(game, setGameState, game.board[0]?.length || 4, session.user.id)
      
      
      console.log('✅ Game loaded from API:', game)
    } catch (err) {
      console.error('❌ Error loading game:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  // Crear un nuevo juego

  // Función para convertir GameState a GameSnapshot (sin draft)
  const stripDraft = useCallback((state: GameState): GameSnapshot => {
    const { draftRow, currentCol, ...snapshot } = state
    return snapshot
  }, [])

  // Guardar el estado del juego (optimistic update)
  const saveGame = useCallback(async (newState: Partial<GameState>, guess?: string) => {
    if (!session?.user?.id || !gameState) {
      console.log('❌ Cannot save game - no session or gameState')
      return
    }

    try {
      const currentDate = new Date().toISOString().split('T')[0]
      
      // Crear el snapshot para enviar a la API (sin draft)
      const snapshotToSend = {
        ...gameState,
        ...newState,
        version: (gameState.version ?? 0) + 1,
        updatedAt: new Date().toISOString()
      }
      
      const response = await fetch('/api/twitchdle/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: currentDate,
          board: convertCommittedToBoard(snapshotToSend.committedBoard),
          currentRow: snapshotToSend.currentRow,
          currentCol: 0, // API no necesita currentCol
          gameFinished: snapshotToSend.gameFinished,
          won: snapshotToSend.won,
          attempts: snapshotToSend.attempts,
          streak: snapshotToSend.streak,
          maxStreak: snapshotToSend.maxStreak,
          guess
        })
      })
      
      if (!response.ok) {
        throw new Error('Error al guardar el juego')
      }
      
      const updatedGame: GameResponse = await response.json()
      
      // Optimistic update: actualizar solo los campos que cambió la API
      setGameState(prev => prev ? {
        ...prev,
        id: updatedGame.id,
        currentRow: updatedGame.currentRow,
        gameFinished: updatedGame.gameFinished,
        won: updatedGame.won,
        attempts: updatedGame.attempts,
        streak: updatedGame.streak,
        maxStreak: updatedGame.maxStreak,
        version: (prev.version ?? 0) + 1,
        updatedAt: new Date().toISOString()
      } : null)
      
      console.log('✅ Game saved to API:', updatedGame)
      return updatedGame
    } catch (err) {
      console.error('❌ Error saving game:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar')
      throw err
    }
  }, [session?.user?.id, gameState, convertCommittedToBoard, stripDraft])

  // Actualizar solo el estado local (sin guardar en BD)
  const updateLocalState = useCallback((newState: Partial<GameState>) => {
    setGameState(prev => {
      if (!prev) return null
      const updated = { ...prev, ...newState }
      return updated
    })
  }, [])

  // Función para guardar el estado final del juego (para actualizar scores)
  const saveGameFinalState = useCallback(async (finalState: GameState) => {
    if (!session?.user?.id) {
      console.log('❌ Cannot save final state - no session')
      return
    }

    try {
      console.log('💾 Saving final game state for scores:', {
        gameFinished: finalState.gameFinished,
        won: finalState.won,
        streak: finalState.streak
      })

      const response = await fetch('/api/twitchdle/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: finalState.date,
          board: convertCommittedToBoard(finalState.committedBoard),
          currentRow: finalState.currentRow,
          currentCol: 0,
          gameFinished: finalState.gameFinished,
          won: finalState.won,
          attempts: finalState.attempts,
          streak: finalState.streak,
          maxStreak: finalState.maxStreak
        })
      })

      if (!response.ok) {
        throw new Error('Error al guardar el estado final del juego')
      }

      const result = await response.json()
      console.log('✅ Final game state saved:', result)
      
      
      return result
    } catch (err) {
      console.error('❌ Error saving final game state:', err)
      throw err
    }
  }, [session?.user?.id])


  // Verificar si la palabra es la palabra del día (solución)
  const validateWord = useCallback((word: string): { valid: boolean; error?: string } => {
    // Verificar si tenemos la palabra del día cargada
    if (!gameState?.wordOfDay) {
      return { valid: false, error: 'Palabra del día no disponible' }
    }
    
    // Verificar si la palabra ingresada es la solución
    if (word.toUpperCase() === gameState.wordOfDay.toUpperCase()) {
      return { valid: true }
    }
    
    // Si no es la solución, verificar si es una palabra válida (opcional)
    // Por ahora, aceptamos cualquier palabra de la longitud correcta
    if (word.length !== gameState.wordOfDay.length) {
      return { valid: false, error: `La palabra debe tener ${gameState.wordOfDay.length} letras` }
    }
    
    return { valid: true }
  }, [gameState?.wordOfDay])

  // Funciones para manejar tipeo (solo local)
  const onType = useCallback((letter: string) => {
    setGameState(s => {
      if (!s || s.gameFinished) return s
      if (s.draftRow.length >= s.wordLength) return s
      const draftRow = [...s.draftRow, letter.toUpperCase()]
      const next = { ...s, draftRow, currentCol: draftRow.length }
      return next
    })
  }, [])

  const onBackspace = useCallback(() => {
    setGameState(s => {
      if (!s || !s.draftRow.length) return s
      const draftRow = s.draftRow.slice(0, -1)
      const next = { ...s, draftRow, currentCol: draftRow.length }
      return next
    })
  }, [])

  // Ref para evitar ejecución doble del bump optimista por sesión
  const optimisticBumpDone = useRef<Set<string>>(new Set())

  // Función para ejecutar bump optimista (solo cuando se gana un juego nuevo)
  const triggerOptimisticBump = useCallback((gameState: GameState, bestStreak?: number) => {
    if (!session?.user?.id) return
    
    const bumpKey = `${session.user.id}-${gameState.date}`
    
    if (!optimisticBumpDone.current.has(bumpKey)) {
      optimisticBumpDone.current.add(bumpKey)
      
      const userInfo = {
        displayName: session.user.name || (session.user as any).displayName,
        twitchLogin: (session.user as any).twitchLogin,
        avatarUrl: session.user.image || undefined
      }
      
      // Usar la racha máxima si se proporciona, sino usar la racha actual
      const streakToUse = bestStreak || gameState.streak
      
      console.log('🎯 Triggering optimistic leaderboard update:', { 
        userId: session.user.id, 
        date: gameState.date,
        currentStreak: gameState.streak,
        bestStreak: streakToUse,
        userInfo 
      })
      bumpMyStreakOptimistic(session.user.id, gameState.date, userInfo, streakToUse)
    }
  }, [session?.user?.id, session?.user?.name, session?.user?.image])

  const onEnter = useCallback((onError?: (error: string) => void) => {
    if (!gameState || gameState.draftRow.length !== gameState.wordLength || gameState.gameFinished) {
      return
    }

    // Usar wordOfDay del estado en lugar de solutionRef
    if (!gameState.wordOfDay) {
      console.error('❌ No wordOfDay available in state')
      if (onError) {
        onError('Error: palabra del día no disponible')
      }
      return
    }

    const guess = gameState.draftRow.join('')
    
    // Validar la palabra localmente (instantáneo)
    const validation = validateWord(guess)
    if (!validation.valid) {
      console.log('❌ Invalid word:', validation.error)
      if (onError) {
        onError(validation.error || 'Palabra inválida')
      }
      return
    }

    // Evaluar localmente con el algoritmo de Wordle
    const evaluation = evaluateLocally(gameState.draftRow, gameState.wordOfDay)
    const isCorrect = evaluation.every(cell => cell.status === 'correct')

    setGameState(s => {
      if (!s) return s

      const committedBoard = [...s.committedBoard]
      committedBoard[s.currentRow] = evaluation

      const gameFinished = isCorrect || s.currentRow === 5
      const won = isCorrect ? true : (s.currentRow === 5 ? false : null)
      const newStreak = gameFinished ? calculateStreak(s.streak, isCorrect, s.attempts === 0) : s.streak
      const newMaxStreak = isCorrect ? Math.max(newStreak, s.maxStreak) : s.maxStreak

      console.log('🎯 Streak calculation:', {
        currentStreak: s.streak,
        isCorrect,
        gameFinished,
        newStreak,
        newMaxStreak,
        isFirstGame: s.attempts === 0
      })

      const next: GameState = {
        ...s,
        committedBoard,
        draftRow: [],
        currentRow: s.currentRow + 1,
        currentCol: 0,
        attempts: s.attempts + 1,
        version: (s.version ?? 0) + 1,
        updatedAt: new Date().toISOString(),
        gameFinished,
        won,
        streak: newStreak,
        maxStreak: newMaxStreak
      }

      // 1) UI instantánea (sin localStorage)

      // 2) Si el juego terminó, guardar el estado final para actualizar scores
      if (next.gameFinished) {
        console.log('🎯 Game finished, saving final state:', {
          won: next.won,
          streak: next.streak,
          attempts: next.attempts
        })
        
        // Generar emoji grid para las estadísticas
        const emojiGrid = generateEmojiGridFromStats(next.committedBoard, next.attempts)
        
        // Actualizar estadísticas locales con nuevo sistema
        const updatedStats = updateStats(next.attempts, next.won || false, emojiGrid, next.date, next.wordOfDay)
        
        // Sincronizar con el servidor (no bloquea UI)
        if (session?.user?.id) {
          syncStatsToServer({
            ...updatedStats,
            userId: session.user.id,
            gameDate: next.date,
            processedAt: new Date().toISOString()
          }).catch(console.error)
        }
        
        saveGameFinalState(next).catch(console.error)
        
        // 3) Si ganó, ejecutar bump optimista del leaderboard
        if (next.won) {
          // Usar la racha máxima actualizada de las estadísticas locales
          const leaderboardStreak = updatedStats.maxStreak
          console.log('🎯 Updating leaderboard with max streak:', leaderboardStreak)
          
          triggerOptimisticBump(next, leaderboardStreak)
          
          // 4) Actualizar la tabla Score con el nuevo maxStreak
          if (session?.user?.id) {
            updateScoreTable(session.user.id, leaderboardStreak).catch(console.error)
          }
        }
      } else {
        // 3) Si el juego no terminó, enviar al servidor (idempotente por rowIndex)
        sendAttempt.mutate({
          gameId: s.id || '',
          date: s.date,
          rowIndex: s.currentRow,
          guess: guess,
          clientVersion: next.version
        })
      }

      return next
    })
  }, [gameState, validateWord, sendAttempt, saveGameFinalState, triggerOptimisticBump])

  // Bootstrap sincrónico - NYT style
  useEffect(() => {
    if (!session?.user?.id) return
    
    const currentDate = new Date().toISOString().split('T')[0]
    
    // Cargar solo desde BD - sin bootstrap ni localStorage
    loadGame()
  }, [session?.user?.id, loadGame])

  return {
    gameState,
    loading,
    error,
    loadGame,
    saveGame,
    updateLocalState,
    validateWord,
    setGameState,
    onType,
    onBackspace,
    onEnter,
    // Estadísticas locales (estilo Boludle)
    stats
  }
}
