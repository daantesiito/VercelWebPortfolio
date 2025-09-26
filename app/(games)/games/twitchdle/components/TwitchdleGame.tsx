'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface GameState {
  board: string[][]
  currentRow: number
  currentCol: number
  gameFinished: boolean
  wordToGuess: string
  attempts: number
  streak: number
  maxStreak: number
  lastPlayedDate: string | null
}

export default function TwitchdleGame() {
  const { data: session } = useSession()
  const [gameState, setGameState] = useState<GameState>({
    board: Array(6).fill(null).map(() => Array(5).fill('')), // 6 filas, 5 columnas por defecto
    currentRow: 0,
    currentCol: 0,
    gameFinished: false,
    wordToGuess: '',
    attempts: 0,
    streak: 0,
    maxStreak: 0,
    lastPlayedDate: null
  })
  
  const [showInstructions, setShowInstructions] = useState(false)
  const [message, setMessage] = useState('')
  const [showPostGame, setShowPostGame] = useState(false)
  const [postGameMessage, setPostGameMessage] = useState('')
  const [postGameCountdown, setPostGameCountdown] = useState('')
  const [postGameStats, setPostGameStats] = useState('')
  const [showGameOverModal, setShowGameOverModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [modalCountdown, setModalCountdown] = useState('')
  const [showStatsScreen, setShowStatsScreen] = useState(false)
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 0,
    victories: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastGameResult: null as any,
    emojiGrid: ''
  })
  
  const boardRef = useRef<HTMLDivElement>(null)
  const keyboardRef = useRef<HTMLDivElement>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const gameInitialized = useRef(false)

  // Palabras del wordlist.txt
  const dailyWords = [
    'STREAM', 'SPREEN', 'LUKEN', 'COSCU', 'COBRA', 'DOU', 'SHELAO', 'BALDU', 'MOMO', 'IBAI',
    'VOD', 'EMOTE', 'OBS', 'CHAT', 'RAID', 'PRIME', 'BAULO', 'NDEAH', 'BITS', 'PEEPO',
    'FACTS', 'HOST', 'GONCHO', 'LURKER', 'SUB', 'IRL', 'ASMR', 'KNEKRO', 'NASHE', 'RUBIUS',
    'BANEAR', 'GRAFO', 'TROLL', 'GODETO', 'PRENDE'
  ]

  // Generar palabra del día basada en la fecha
  const getDailyWord = () => {
    const today = new Date()
    const startDate = new Date('2024-12-12') // Fecha de inicio del juego
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const wordIndex = daysSinceStart % dailyWords.length
    const word = dailyWords[wordIndex]
    console.log('🎯 Palabra del día:', word, '(Longitud:', word.length + ')')
    return word
  }

  const generateEmojiGrid = (board: string[][], wordLength: number) => {
    let emojiGrid = ''
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < wordLength; col++) {
        const cell = board[row][col]
        if (cell && cell.includes(':')) {
          const [, color] = cell.split(':')
          switch (color) {
            case 'correct':
              emojiGrid += '🟩'
              break
            case 'present':
              emojiGrid += '🟨'
              break
            case 'absent':
              emojiGrid += '⬛'
              break
            default:
              emojiGrid += '⬛'
          }
        } else {
          emojiGrid += '⬛'
        }
      }
      if (row < 5) emojiGrid += '\n'
    }
    return emojiGrid
  }

  // Inicializar el juego
  useEffect(() => {
    if (session?.user && !gameInitialized.current) {
      console.log('🔧 Inicializando juego por primera vez...')
      gameInitialized.current = true
      initializeGame()
    }
  }, [session?.user])

  // Event listener para teclado físico
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState.gameFinished || showPostGame) return

      const key = event.key.toUpperCase()
      
      if (key === 'ENTER') {
        event.preventDefault()
        submitGuess()
      } else if (key === 'BACKSPACE') {
        event.preventDefault()
        deleteLetter()
      } else if (key.length === 1 && key.match(/[A-Z]/)) {
        event.preventDefault()
        addLetter(key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [gameState.gameFinished, showPostGame, gameState.currentRow, gameState.currentCol, gameState.wordToGuess])

  const initializeGame = () => {
    const today = new Date().toDateString()
    const savedGame = localStorage.getItem('twitchdleGame')
    const gameFinished = localStorage.getItem('twitchdleGameFinished')
    const lastPlayedDate = localStorage.getItem('twitchdleLastPlayedDate')
    
    const wordToGuess = getDailyWord()
    
    console.log('🔧 initializeGame called:', {
      today,
      lastPlayedDate,
      gameFinished,
      hasSavedGame: !!savedGame,
      wordToGuess,
      wordLength: wordToGuess.length
    })
    
    if (savedGame && lastPlayedDate === today && gameFinished === 'false') {
      // Cargar juego guardado
      const gameData = JSON.parse(savedGame)
      console.log('📁 Cargando juego guardado:', gameData)
      setGameState({
        ...gameData,
        wordToGuess
      })
    } else if (lastPlayedDate === today && gameFinished === 'true') {
      // Mostrar pantalla de post-juego
      const gameData = JSON.parse(savedGame || '{}')
      console.log('🎮 Mostrando pantalla de post-juego:', gameData)
      
      // Cargar estadísticas existentes
      const existingStats = JSON.parse(localStorage.getItem('twitchdleStats') || '{"gamesPlayed": 0, "victories": 0, "currentStreak": 0, "maxStreak": 0, "guessDistribution": [0, 0, 0, 0, 0, 0]}')
      
      // Generar esquema de emojis
      const emojiGrid = generateEmojiGrid(gameData.board, gameData.wordToGuess.length)
      
      // Actualizar estado de estadísticas
      setGameStats({
        ...existingStats,
        lastGameResult: gameData,
        emojiGrid
      })
      
      showPostGameScreen(gameData)
    } else {
      // Nuevo juego
      console.log('🆕 Creando nuevo juego')
      localStorage.setItem('twitchdleLastPlayedDate', today)
      localStorage.setItem('twitchdleGameFinished', 'false')
      
      setGameState({
        board: Array(6).fill(null).map(() => Array(wordToGuess.length).fill('')),
        currentRow: 0,
        currentCol: 0,
        gameFinished: false,
        wordToGuess,
        attempts: 0,
        streak: parseInt(localStorage.getItem('twitchdleStreak') || '0'),
        maxStreak: parseInt(localStorage.getItem('twitchdleMaxStreak') || '0'),
        lastPlayedDate: today
      })
    }
  }

  const showPostGameScreen = (gameData: any) => {
    console.log('🎮 showPostGameScreen called:', gameData)
    setShowPostGame(true)
    setPostGameMessage(gameData.won ? '¡Felicidades! ¡Adivinaste la palabra!' : '¡Mejor suerte mañana!')
    setPostGameStats(`Racha actual: ${gameData.streak || 0} | Mejor racha: ${gameData.maxStreak || 0}`)
    
    // Asegurar que el modal viejo NO se muestre
    console.log('🚫 Setting showGameOverModal to false')
    setShowGameOverModal(false)
    
    // Mostrar pantalla de estadísticas directamente
    console.log('📊 Setting showStatsScreen to true')
    setShowStatsScreen(true)
    
    // Countdown para el próximo juego
    startCountdown()
  }

  const startCountdown = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const updateCountdown = () => {
      const timeLeft = tomorrow.getTime() - new Date().getTime()
      
      if (timeLeft <= 0) {
        setPostGameCountdown('¡Nueva palabra disponible!')
        setModalCountdown('¡Nueva palabra disponible!')
        if (countdownRef.current) {
          clearInterval(countdownRef.current)
        }
        return
      }
      
      const hours = Math.floor(timeLeft / (1000 * 60 * 60))
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
      
      const countdownText = `Próxima palabra en: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      setPostGameCountdown(countdownText)
      setModalCountdown(countdownText)
    }
    
    updateCountdown()
    countdownRef.current = setInterval(updateCountdown, 1000)
  }

  const handleKeyPress = (key: string) => {
    if (gameState.gameFinished || showPostGame) return

    if (key === 'ENTER') {
      submitGuess()
    } else if (key === 'BACKSPACE') {
      deleteLetter()
    } else if (key.length === 1 && key.match(/[A-Z]/)) {
      addLetter(key)
    }
  }

  const addLetter = (letter: string) => {
    if (gameState.currentCol < gameState.wordToGuess.length) {
      const newBoard = [...gameState.board]
      newBoard[gameState.currentRow][gameState.currentCol] = letter
      
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        currentCol: prev.currentCol + 1
      }))
    }
  }

  const deleteLetter = () => {
    if (gameState.currentCol > 0) {
      const newBoard = [...gameState.board]
      newBoard[gameState.currentRow][gameState.currentCol - 1] = ''
      
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        currentCol: prev.currentCol - 1
      }))
    }
  }

  const submitGuess = async () => {
    if (gameState.currentCol !== gameState.wordToGuess.length) {
      setMessage('La palabra debe tener ' + gameState.wordToGuess.length + ' letras')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const guess = gameState.board[gameState.currentRow].join('')
    
    // REMOVER VALIDACIÓN DE DICCIONARIO - TODAS LAS PALABRAS SON VÁLIDAS
    // if (!isValidWord(guess)) {
    //   setMessage('Palabra no válida')
    //   setTimeout(() => setMessage(''), 3000)
    //   return
    // }

    // Evaluar el guess
    const evaluation = evaluateGuess(guess, gameState.wordToGuess)
    const newBoard = [...gameState.board]
    
    // Aplicar colores a las letras manteniendo la letra
    for (let i = 0; i < evaluation.length; i++) {
      const letter = newBoard[gameState.currentRow][i]
      newBoard[gameState.currentRow][i] = `${letter}:${evaluation[i]}`
    }

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentRow: prev.currentRow + 1,
      currentCol: 0,
      attempts: prev.attempts + 1
    }))

    // Verificar si ganó
    if (guess === gameState.wordToGuess) {
      handleWin()
    } else if (gameState.currentRow + 1 >= 6) {
      handleLose()
    }
  }

  const evaluateGuess = (guess: string, target: string) => {
    const result = Array(guess.length).fill('')
    const targetArray = target.split('')
    const guessArray = guess.split('')
    
    // Primera pasada: marcar letras correctas (verde)
    for (let i = 0; i < guess.length; i++) {
      if (guessArray[i] === targetArray[i]) {
        result[i] = 'correct'
        targetArray[i] = ''
        guessArray[i] = ''
      }
    }
    
    // Segunda pasada: marcar letras presentes pero en posición incorrecta (amarillo)
    for (let i = 0; i < guess.length; i++) {
      if (guessArray[i] !== '') {
        const index = targetArray.indexOf(guessArray[i])
        if (index !== -1) {
          result[i] = 'present'
          targetArray[index] = ''
        } else {
          result[i] = 'absent'
        }
      }
    }
    
    return result
  }

  const handleWin = async () => {
    const newStreak = gameState.streak + 1
    const newMaxStreak = Math.max(newStreak, gameState.maxStreak)
    const attempts = gameState.currentRow + 1
    
    const gameData = {
      ...gameState,
      gameFinished: true,
      won: true,
      streak: newStreak,
      maxStreak: newMaxStreak,
      attempts
    }
    
    // Guardar en localStorage
    localStorage.setItem('twitchdleGame', JSON.stringify(gameData))
    localStorage.setItem('twitchdleGameFinished', 'true')
    localStorage.setItem('twitchdleStreak', newStreak.toString())
    localStorage.setItem('twitchdleMaxStreak', newMaxStreak.toString())
    
    // Actualizar estadísticas
    updateGameStats(gameData, true, attempts)
    
    // Guardar en la base de datos
    await saveStreakToDatabase(newStreak)
    
    setGameState(prev => ({ ...prev, gameFinished: true }))
    
    // Mostrar modal primero
    setModalMessage(`¡Felicidades! ¡Adivinaste la palabra: "${gameData.wordToGuess}"!`)
    setShowGameOverModal(true)
    
    // Countdown para el próximo juego
    startCountdown()
  }

  const handleLose = async () => {
    const gameData = {
      ...gameState,
      gameFinished: true,
      won: false,
      streak: 0, // Reset streak on loss
      maxStreak: gameState.maxStreak,
      attempts: 6
    }
    
    // Guardar en localStorage
    localStorage.setItem('twitchdleGame', JSON.stringify(gameData))
    localStorage.setItem('twitchdleGameFinished', 'true')
    localStorage.setItem('twitchdleStreak', '0')
    
    // Actualizar estadísticas
    updateGameStats(gameData, false, 6)
    
    setGameState(prev => ({ ...prev, gameFinished: true }))
    
    // Mostrar modal primero
    setModalMessage(`No lograste acertar, palabra correcta: "${gameData.wordToGuess}"`)
    setShowGameOverModal(true)
    
    // Countdown para el próximo juego
    startCountdown()
  }

  const updateGameStats = (gameData: any, won: boolean, attempts: number) => {
    // Cargar estadísticas existentes
    const existingStats = JSON.parse(localStorage.getItem('twitchdleStats') || '{"gamesPlayed": 0, "victories": 0, "currentStreak": 0, "maxStreak": 0, "guessDistribution": [0, 0, 0, 0, 0, 0]}')
    
    // Actualizar estadísticas
    const newStats = {
      gamesPlayed: existingStats.gamesPlayed + 1,
      victories: won ? existingStats.victories + 1 : existingStats.victories,
      currentStreak: gameData.streak,
      maxStreak: gameData.maxStreak,
      guessDistribution: [...existingStats.guessDistribution]
    }
    
    // Actualizar distribución de intentos (solo si ganó)
    if (won && attempts >= 1 && attempts <= 6) {
      newStats.guessDistribution[attempts - 1]++
    }
    
    // Generar esquema de emojis
    const emojiGrid = generateEmojiGrid(gameData.board, gameData.wordToGuess.length)
    
    // Guardar estadísticas actualizadas
    localStorage.setItem('twitchdleStats', JSON.stringify(newStats))
    
    // Actualizar estado
    setGameStats({
      ...newStats,
      lastGameResult: gameData,
      emojiGrid
    })
  }

  const saveStreakToDatabase = async (streak: number) => {
    if (!session?.user) return

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game: 'twitchdle',
          value: streak,
          type: 'streak'
        }),
      })

      if (response.ok) {
        // Disparar evento para actualizar leaderboard
        window.dispatchEvent(new CustomEvent('streakUpdated'))
      }
    } catch (error) {
      // Error saving streak - silently fail
    }
  }

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
      // Reset initialization flag when component unmounts
      gameInitialized.current = false
    }
  }, [])

  if (!session?.user) {
    return null
  }

  if (showPostGame) {
    return (
      <div className="post-game">
        <h2>¡Ya jugaste!</h2>
        <div className="post-game-message">{postGameMessage}</div>
        <div className="post-game-countdown">{postGameCountdown}</div>
        <div className="post-game-stats">{postGameStats}</div>
        <div className="social-buttons">
          <a href="https://github.com/daantesiito" target="_blank" className="social-button github">
            <i className="fab fa-github"></i>
          </a>
          <a href="https://cafecito.app/dantesiito" target="_blank" className="social-button cafecito">
            <i className="fas fa-coffee"></i>
          </a>
          <a href="https://www.instagram.com/dante_puddu/" target="_blank" className="social-button instagram">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="https://www.twitch.tv/daantesiito" target="_blank" className="social-button twitch">
            <i className="fab fa-twitch"></i>
          </a>
          <a href="https://discordapp.com/users/326820001879162880" target="_blank" className="social-button discord">
            <i className="fab fa-discord"></i>
          </a>
        </div>
      </div>
    )
  }

  // Debug: Log modal states
  console.log('🔍 Render states:', { showGameOverModal, showStatsScreen, showPostGame })

  return (
    <div className="twitchdle-container">
      <div id="emote-container"></div>
      <h1>Twitchdle</h1>
      
      <div className="instructions-container" style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 100 }}>
        <button 
          className="instructions-toggle-button"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          INSTRUCCIONES
        </button>
      </div>

      {showInstructions && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowInstructions(false)}>&times;</span>
            <div className="instructions-content">
              <p>
                El objetivo del juego es simple, adivinar la palabra oculta. La palabra puede tener entre 3 y 7 letras y tenes 6 intentos para adivinarla.
              </p>
              <p> 
                La tematica es de twitch/kick o el ambiente del streaming en si. La palabra puede ser un streamer u otra cosa relacionada con el stream.
              </p>
              <p> 
                La palabra es la misma para todas las personas en ese día. Cada intento debe ser una palabra válida. En cada ronda, el juego 
                pinta cada letra de un color indicando si esa letra se encuentra o no en la palabra y si está en la posición correcta.
              </p>
              <p>
                <span style={{color: 'var(--col-correct)', fontWeight: 'bold'}}>VERDE</span> 
                significa que la letra está en la palabra y en la posición CORRECTA 
                <img src="/games/twitchdle/media/VERDE.png" alt="Letra verde" className="instruction-icon" />
              </p>
              <p>
                <span style={{color: 'var(--col-present)', fontWeight: 'bold'}}>AMARILLO</span> 
                significa que la letra está presente en la palabra pero en la posición INCORRECTA 
                <img src="/games/twitchdle/media/AMARILLO.png" alt="Letra amarilla" className="instruction-icon" />
              </p>
              <p>
                <span style={{color: 'var(--col-absent)', fontWeight: 'bold'}}>GRIS</span> 
                significa que la letra NO está presente en la palabra 
                <img src="/games/twitchdle/media/GRIS.png" alt="Letra gris" className="instruction-icon" />
              </p>
              <p> 
                Cualquier aporte de palabra para adivinar o si intentaste alguna palabra que pensas que tiene que estar en el diccionario para validarse, mandamela por discord: 326820001879162880
              </p>
              <p> 
                El login con twitch solo guarda tu nombre de usuario para poder usarlo como &quot;cuenta&quot; y que no se repita.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <div 
          ref={boardRef} 
          id="board"
          style={{ '--word-length': gameState.wordToGuess.length } as React.CSSProperties}
        >
          {gameState.board.map((row, rowIndex) => (
            <div key={rowIndex} className="row">
              {row.map((cell, colIndex) => {
                // Si la celda tiene formato "letra:color", separar
                const parts = cell.split(':')
                const letter = parts[0]
                const color = parts[1]
                
                return (
                  <div 
                    key={colIndex} 
                    className={`cell ${color || ''}`}
                  >
                    {letter}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        
        <div ref={keyboardRef} id="keyboard">
          <div className="keyboard-row">
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(key => (
              <button key={key} className="key" onClick={() => handleKeyPress(key)}>
                {key}
              </button>
            ))}
          </div>
          <div className="keyboard-row">
            {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map(key => (
              <button key={key} className="key" onClick={() => handleKeyPress(key)}>
                {key}
              </button>
            ))}
          </div>
          <div className="keyboard-row">
            <button className="key wide" onClick={() => handleKeyPress('ENTER')}>ENTER</button>
            {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(key => (
              <button key={key} className="key" onClick={() => handleKeyPress(key)}>
                {key}
              </button>
            ))}
            <button className="key wide" onClick={() => handleKeyPress('BACKSPACE')}>⌫</button>
          </div>
        </div>
        
        {message && <div id="message">{message}</div>}
      </div>

      {showGameOverModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => {
              console.log('❌ Modal close clicked')
              setShowGameOverModal(false)
              setShowStatsScreen(true)
            }}>&times;</span>
            <p>{modalMessage}</p>
            <p>{modalCountdown}</p>
            
            {/* Iconos de redes sociales */}
            <div className="social-icons">
              <a href="https://github.com/daantesiito" target="_blank" rel="noopener noreferrer" className="social-icon github">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="https://ko-fi.com/dantesito" target="_blank" rel="noopener noreferrer" className="social-icon kofi">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798S-.238 6.45.026 8.948c.164 1.52.54 3.042 1.363 4.411 1.502 2.554 4.57 4.004 7.926 4.004 3.356 0 6.424-1.45 7.926-4.004.823-1.369 1.199-2.891 1.363-4.411zm-11.89 5.418c-1.462 0-2.654-1.192-2.654-2.654s1.192-2.654 2.654-2.654 2.654 1.192 2.654 2.654-1.192 2.654-2.654 2.654z"/>
                </svg>
              </a>
              <a href="https://instagram.com/dantesito" target="_blank" rel="noopener noreferrer" className="social-icon instagram">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://twitch.tv/dantesito" target="_blank" rel="noopener noreferrer" className="social-icon twitch">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
              </a>
              <a href="https://discord.gg/dantesito" target="_blank" rel="noopener noreferrer" className="social-icon discord">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Pantalla de estadísticas */}
      {showStatsScreen && (
        <div className="stats-screen">
          <div className="stats-content">
            <h1>Twitchdle</h1>
            <h2>¡Ya jugaste!</h2>
            
            {gameStats.lastGameResult && (
              <>
                <p className="game-result">
                  {gameStats.lastGameResult.won 
                    ? `¡Felicidades! ¡Adivinaste la palabra: "${gameStats.lastGameResult.wordToGuess}"!`
                    : `No lograste acertar, palabra correcta: "${gameStats.lastGameResult.wordToGuess}"`
                  }
                </p>
                
                <div className="emoji-grid">
                  <pre>{gameStats.emojiGrid}</pre>
                </div>
                
                <p className="next-word-countdown">{modalCountdown}</p>
                
                <div className="stats-section">
                  <h3>Estadísticas</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">Jugadas:</div>
                      <div className="stat-value">{gameStats.gamesPlayed}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Victorias:</div>
                      <div className="stat-value">{gameStats.gamesPlayed > 0 ? ((gameStats.victories / gameStats.gamesPlayed) * 100).toFixed(2) : '0.00'}%</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Racha Actual:</div>
                      <div className="stat-value">{gameStats.currentStreak}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Mejor Racha:</div>
                      <div className="stat-value">{gameStats.maxStreak}</div>
                    </div>
                  </div>
                  
                  <div className="guess-distribution">
                    <h4>Distribución de intentos:</h4>
                    {gameStats.guessDistribution.map((count, index) => (
                      <div key={index} className="guess-row">
                        <span className="guess-number">{index + 1}:</span>
                        <div className="guess-bar">
                          <div 
                            className="guess-fill" 
                            style={{ 
                              width: gameStats.gamesPlayed > 0 ? `${(count / gameStats.gamesPlayed) * 100}%` : '0%' 
                            }}
                          ></div>
                        </div>
                        <span className="guess-count">
                          {count} ({gameStats.gamesPlayed > 0 ? ((count / gameStats.gamesPlayed) * 100).toFixed(2) : '0.00'}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Iconos de redes sociales */}
                <div className="social-icons">
                  <a href="https://github.com/daantesiito" target="_blank" rel="noopener noreferrer" className="social-icon github">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                  <a href="https://ko-fi.com/dantesito" target="_blank" rel="noopener noreferrer" className="social-icon kofi">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798S-.238 6.45.026 8.948c.164 1.52.54 3.042 1.363 4.411 1.502 2.554 4.57 4.004 7.926 4.004 3.356 0 6.424-1.45 7.926-4.004.823-1.369 1.199-2.891 1.363-4.411zm-11.89 5.418c-1.462 0-2.654-1.192-2.654-2.654s1.192-2.654 2.654-2.654 2.654 1.192 2.654 2.654-1.192 2.654-2.654 2.654z"/>
                    </svg>
                  </a>
                  <a href="https://instagram.com/dantesito" target="_blank" rel="noopener noreferrer" className="social-icon instagram">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="https://twitch.tv/dantesito" target="_blank" rel="noopener noreferrer" className="social-icon twitch">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                    </svg>
                  </a>
                  <a href="https://discord.gg/dantesito" target="_blank" rel="noopener noreferrer" className="social-icon discord">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
