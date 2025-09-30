import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cleanupOldLocalStorage } from '../utils/cleanupLocalStorage'
import { bumpMyStreakOptimistic } from './useStats'

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

// Helpers para localStorage
const lsKey = (userId: string, date: string) => `twitchdle:${userId}:${date}`

// Debounce para persistencia local
let saveTimer: number | undefined

function saveLocalDebounced(state: GameState) {
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(lsKey(state.userId, state.date), JSON.stringify(state))
    } catch {}
  }, 150)
}

function saveLocalNow(state: GameState) {
  try {
    localStorage.setItem(lsKey(state.userId, state.date), JSON.stringify(state))
  } catch {}
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

function saveLocal(state: GameState) {
  if (!state.userId || !state.date) return
  const key = lsKey(state.userId, state.date)
  localStorage.setItem(key, JSON.stringify(state))
}

function loadLocal(userId: string, date: string): GameState | null {
  const key = lsKey(userId, date)
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
}

// Función para cargar la palabra del día una sola vez
async function ensureDailyWord(date: string): Promise<string> {
  const res = await fetch(`/api/twitchdle/daily-word?date=${date}`, { cache: 'force-cache' })
  const { word } = await res.json()
  return (word || '').toUpperCase()
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
        userId
      }
      saveLocal(newState)
      return newState
    }

    // Verificar si el servidor tiene datos más nuevos
    const serverIsStale = 
      (server.attempts ?? 0) < (local.attempts ?? 0) ||
      (server.currentRow ?? 0) < (local.currentRow ?? 0) ||
      (local.version ?? 0) > 1 // Si local tiene versiones más altas, ignorar servidor

    if (serverIsStale) {
      console.log('🔄 Ignoring stale server data')
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
      wordLength
    }
    saveLocal(merged)
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
            userId: session?.user?.id || ''
          } as GameState
        }
        
        // Solo actualizar si el servidor tiene datos más nuevos
        const serverIsNewer = new Date(serverResponse.date).getTime() >= new Date(local.updatedAt).getTime()
        if (!serverIsNewer) return local
        
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
          currentCol: local.draftRow?.length ?? 0
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
      
      // Primero intentar cargar desde localStorage
      const localState = loadLocal(session.user.id, currentDate)
      if (localState) {
        console.log('📱 Loading from localStorage:', localState)
        // Verificar que el estado local tenga la estructura correcta
        if (localState.committedBoard && localState.draftRow !== undefined) {
          setGameState(localState)
        } else {
          console.log('⚠️ Invalid local state structure, will reload from API')
        }
      }
      
      // Luego cargar desde la API
      const response = await fetch(`/api/twitchdle/game?date=${currentDate}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar el juego')
      }
      
      const game: GameResponse | null = await response.json()
      
      if (!game) {
        // No hay juego guardado, crear uno nuevo instantáneamente
        console.log('🆕 Creando nuevo juego instantáneamente...')
        
        // Cargar la palabra del día para obtener el largo
        const solution = await ensureDailyWord(currentDate)
        const wordLength = solution.length
        
        const initialState: GameState = {
          id: '',
          date: currentDate,
          committedBoard: Array(6).fill(null).map(() => Array(wordLength).fill({ letter: '', status: undefined })),
          currentRow: 0,
          attempts: 0,
          gameFinished: false,
          won: null,
          streak: 0,
          maxStreak: 0,
          version: 1,
          updatedAt: new Date().toISOString(),
          draftRow: [],
          currentCol: 0,
          wordLength: wordLength,
          userId: session.user.id
        }
        
        // Establecer la solución en el ref
        solutionRef.current = solution
        
        setGameState(initialState)
        saveLocal(initialState)
        return
      }
      
      // Cargar la solución para el juego existente
      const solution = await ensureDailyWord(currentDate)
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
      saveLocal(updated)
      return updated
    })
  }, [])

  // Verificar si la palabra es la palabra del día (solución)
  const validateWord = useCallback((word: string): { valid: boolean; error?: string } => {
    // Verificar si tenemos la solución cargada
    if (!solutionRef.current) {
      return { valid: false, error: 'Solución no disponible' }
    }
    
    // Verificar si la palabra ingresada es la solución
    if (word.toUpperCase() === solutionRef.current.toUpperCase()) {
      return { valid: true }
    }
    
    // Si no es la solución, verificar si es una palabra válida (opcional)
    // Por ahora, aceptamos cualquier palabra de la longitud correcta
    if (word.length !== solutionRef.current.length) {
      return { valid: false, error: `La palabra debe tener ${solutionRef.current.length} letras` }
    }
    
    return { valid: true }
  }, [])

  // Funciones para manejar tipeo (solo local)
  const onType = useCallback((letter: string) => {
    setGameState(s => {
      if (!s || s.gameFinished) return s
      if (s.draftRow.length >= s.wordLength) return s
      const draftRow = [...s.draftRow, letter.toUpperCase()]
      const next = { ...s, draftRow, currentCol: draftRow.length }
      saveLocalDebounced(next)
      return next
    })
  }, [])

  const onBackspace = useCallback(() => {
    setGameState(s => {
      if (!s || !s.draftRow.length) return s
      const draftRow = s.draftRow.slice(0, -1)
      const next = { ...s, draftRow, currentCol: draftRow.length }
      saveLocalDebounced(next)
      return next
    })
  }, [])

  const onEnter = useCallback((onError?: (error: string) => void) => {
    if (!gameState || gameState.draftRow.length !== gameState.wordLength || gameState.gameFinished) {
      return
    }

    // La solución ya debería estar cargada desde loadGame
    if (!solutionRef.current) {
      console.error('❌ No solution available')
      if (onError) {
        onError('Error: solución no disponible')
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
    const evaluation = evaluateLocally(gameState.draftRow, solutionRef.current)
    const isCorrect = evaluation.every(cell => cell.status === 'correct')

    setGameState(s => {
      if (!s) return s

      const committedBoard = [...s.committedBoard]
      committedBoard[s.currentRow] = evaluation

      const next: GameState = {
        ...s,
        committedBoard,
        draftRow: [],
        currentRow: s.currentRow + 1,
        currentCol: 0,
        attempts: s.attempts + 1,
        version: (s.version ?? 0) + 1,
        updatedAt: new Date().toISOString(),
        gameFinished: isCorrect || s.currentRow === 5,
        won: isCorrect ? true : (s.currentRow === 5 ? false : null),
        streak: isCorrect ? s.streak + 1 : (s.currentRow === 5 ? 0 : s.streak),
        maxStreak: isCorrect ? Math.max(s.streak + 1, s.maxStreak) : s.maxStreak
      }

      // 1) UI instantánea + persistencia local
      saveLocalNow(next)

      // 2) Enviar al servidor SIN esperar (idempotente por rowIndex)
      sendAttempt.mutate({
        gameId: s.id || '',
        date: s.date,
        rowIndex: s.currentRow,
        guess: guess,
        clientVersion: next.version
      })

      return next
    })
  }, [gameState, validateWord, sendAttempt])

  // Cargar el juego al montar el componente
  useEffect(() => {
    // Limpiar localStorage viejo una sola vez
    cleanupOldLocalStorage()
    
    if (session?.user?.id) {
      loadGame()
    } else {
      setLoading(false)
    }
  }, [session?.user?.id, loadGame])

  // Manejar bump optimista del leaderboard cuando el usuario gana
  useEffect(() => {
    if (gameState?.gameFinished && gameState?.won && session?.user?.id) {
      // Usar setTimeout para evitar el error de React durante el render
      setTimeout(() => {
        bumpMyStreakOptimistic(session.user.id, gameState.date)
      }, 0)
    }
  }, [gameState?.gameFinished, gameState?.won, gameState?.date, session?.user?.id])

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
    onEnter
  }
}
