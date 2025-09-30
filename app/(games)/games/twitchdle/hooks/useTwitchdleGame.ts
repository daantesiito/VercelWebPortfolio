import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

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

function saveLocal(state: GameState) {
  if (!state.id && !state.date) return
  const key = lsKey(state.id || 'anon', state.date)
  localStorage.setItem(key, JSON.stringify(state))
}

function loadLocal(userId: string, date: string): GameState | null {
  const key = lsKey(userId, date)
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
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
function applyServerToLocal(server: GameResponse, setState: (updater: (s: GameState | null) => GameState | null) => void, wordLength: number) {
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
        wordLength
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
        // No hay juego guardado, necesitamos obtener la palabra del día para saber el largo
        console.log('🆕 No hay juego guardado, obteniendo palabra del día...')
        try {
          const dailyWordResponse = await fetch(`/api/twitchdle/daily-word?date=${currentDate}`)
          if (dailyWordResponse.ok) {
            const dailyWordData = await dailyWordResponse.json()
            const wordLength = dailyWordData.word.length
            
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
              wordLength: wordLength
            }
            setGameState(initialState)
            saveLocal(initialState)
            return
          }
        } catch (error) {
          console.error('Error obteniendo palabra del día:', error)
        }
        
        // Fallback a 4 letras si no se puede obtener la palabra
        console.log('⚠️ Usando fallback de 4 letras')
        const initialState: GameState = {
          id: '',
          date: currentDate,
          committedBoard: Array(6).fill(null).map(() => Array(4).fill({ letter: '', status: undefined })),
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
          wordLength: 4
        }
        setGameState(initialState)
        saveLocal(initialState)
        return
      }
      
      // Aplicar estado del servidor con guard de versión
      applyServerToLocal(game, setGameState, game.board[0]?.length || 4)
      
      console.log('✅ Game loaded from API:', game)
    } catch (err) {
      console.error('❌ Error loading game:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  // Crear un nuevo juego
  const createNewGame = useCallback(async (wordLength: number) => {
    if (!session?.user?.id) {
      console.log('❌ Cannot create game - no session')
      return
    }

    try {
      const currentDate = new Date().toISOString().split('T')[0]
      
      const response = await fetch('/api/twitchdle/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: currentDate,
          board: Array(6).fill(null).map(() => Array(wordLength).fill('')),
          currentRow: 0,
          currentCol: 0,
          gameFinished: false,
          won: null,
          attempts: 0,
          streak: 0,
          maxStreak: 0,
          isNewGame: true // Flag para indicar que es un juego nuevo
        })
      })
      
      if (!response.ok) {
        throw new Error('Error al crear el juego')
      }
      
      const newGame: GameResponse = await response.json()
      
      setGameState(prev => prev ? {
        ...prev,
        id: newGame.id,
        wordLength: wordLength
      } : null)
      
      console.log('✅ New game created:', newGame)
      return newGame
    } catch (err) {
      console.error('❌ Error creating game:', err)
      setError(err instanceof Error ? err.message : 'Error al crear el juego')
      throw err
    }
  }, [session?.user?.id])

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

  // Validar una palabra
  const validateWord = useCallback(async (word: string): Promise<{ valid: boolean; result?: string[]; isCorrect?: boolean; error?: string }> => {
    if (!session?.user?.id) {
      console.log('❌ Cannot validate word - no session')
      return { valid: false, error: 'No autorizado' }
    }

    try {
      const currentDate = new Date().toISOString().split('T')[0]
      
      const response = await fetch('/api/twitchdle/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word,
          date: currentDate
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        return { valid: false, error: result.error || 'Error de validación' }
      }
      
      return result
    } catch (err) {
      console.error('❌ Error validating word:', err)
      return { valid: false, error: 'Error de validación' }
    }
  }, [session?.user?.id])

  // Funciones para manejar tipeo (solo local)
  const onType = useCallback((letter: string) => {
    setGameState(s => {
      if (!s || s.gameFinished) return s
      if (s.draftRow.length >= s.wordLength) return s
      const draftRow = [...s.draftRow, letter.toUpperCase()]
      const next = { ...s, draftRow, currentCol: draftRow.length }
      saveLocal(next)
      return next
    })
  }, [])

  const onBackspace = useCallback(() => {
    setGameState(s => {
      if (!s || !s.draftRow.length) return s
      const draftRow = s.draftRow.slice(0, -1)
      const next = { ...s, draftRow, currentCol: draftRow.length }
      saveLocal(next)
      return next
    })
  }, [])

  const onEnter = useCallback(async (onError?: (error: string) => void) => {
    if (!gameState || gameState.draftRow.length !== gameState.wordLength || gameState.gameFinished) {
      return
    }

    // Validar la palabra
    const guess = gameState.draftRow.join('')
    const validation = await validateWord(guess)
    
    if (!validation.valid) {
      console.log('❌ Invalid word:', validation.error)
      if (onError) {
        onError(validation.error || 'Palabra inválida')
      }
      return
    }

    // Evaluar la palabra localmente
    const evaluation: Cell[] = gameState.draftRow.map((letter, index) => ({
      letter,
      status: validation.result?.[index] as LetterStatus
    }))

    // Commit de la fila
    setGameState(s => {
      if (!s) return s
      const committedBoard = [...s.committedBoard]
      committedBoard[s.currentRow] = evaluation
      const attempts = s.attempts + 1
      const isCorrect = validation.isCorrect
      
      const next: GameState = {
        ...s,
        committedBoard,
        draftRow: [],
        currentRow: s.currentRow + 1,
        currentCol: 0,
        attempts,
        version: (s.version ?? 0) + 1,
        updatedAt: new Date().toISOString(),
        gameFinished: isCorrect || s.currentRow === 5,
        won: isCorrect ? true : (s.currentRow === 5 ? false : null),
        streak: isCorrect ? s.streak + 1 : (s.currentRow === 5 ? 0 : s.streak),
        maxStreak: isCorrect ? Math.max(s.streak + 1, s.maxStreak) : s.maxStreak
      }
      saveLocal(next)
      return next
    })

    // Guardar en API de forma asíncrona
    const currentState = gameState
    const newAttempts = currentState.attempts + 1
    const isCorrect = validation.isCorrect
    
    if (isCorrect) {
      const newStreak = currentState.streak + 1
      const newMaxStreak = Math.max(newStreak, currentState.maxStreak)
      
      saveGame({
        committedBoard: [...currentState.committedBoard, evaluation],
        currentRow: currentState.currentRow + 1,
        attempts: newAttempts,
        gameFinished: true,
        won: true,
        streak: newStreak,
        maxStreak: newMaxStreak
      }).catch(console.error)
    } else if (currentState.currentRow === 5) {
      saveGame({
        committedBoard: [...currentState.committedBoard, evaluation],
        currentRow: currentState.currentRow + 1,
        attempts: newAttempts,
        gameFinished: true,
        won: false,
        streak: 0
      }).catch(console.error)
    } else {
      saveGame({
        committedBoard: [...currentState.committedBoard, evaluation],
        currentRow: currentState.currentRow + 1,
        attempts: newAttempts
      }).catch(console.error)
    }
  }, [gameState, validateWord, saveGame])

  // Cargar el juego al montar el componente
  useEffect(() => {
    if (session?.user?.id) {
      loadGame()
    } else {
      setLoading(false)
    }
  }, [session?.user?.id, loadGame])

  return {
    gameState,
    loading,
    error,
    loadGame,
    saveGame,
    updateLocalState,
    createNewGame,
    validateWord,
    setGameState,
    onType,
    onBackspace,
    onEnter
  }
}
