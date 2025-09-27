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

  const generateEmojiGrid = (board: string[][], wordLength: number, attempts: number) => {
    let emojiGrid = ''
    for (let row = 0; row < attempts; row++) {
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
      if (row < attempts - 1) emojiGrid += '\n'
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
  }, [session?.user?.id]) // Solo el ID para evitar re-renders

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

  // Debug: Monitor state changes (removed to prevent infinite loop)
  // useEffect(() => {
  //   console.log('🔄 State changed:', { showGameOverModal, showStatsScreen, showPostGame })
  // }, [showGameOverModal, showStatsScreen, showPostGame])

  // Prevent body scroll when stats screen is shown
  useEffect(() => {
    if (showStatsScreen) {
      document.body.classList.add('stats-screen-active')
    } else {
      document.body.classList.remove('stats-screen-active')
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('stats-screen-active')
    }
  }, [showStatsScreen])

  // Guardar estado del juego en tiempo real
  useEffect(() => {
    console.log('🔍 useEffect guardar estado - gameState:', {
      wordToGuess: gameState.wordToGuess,
      gameFinished: gameState.gameFinished,
      currentRow: gameState.currentRow,
      won: gameState.won
    })
    
    // Solo guardar si el juego está en progreso (no terminado y no ganado)
    if (gameState.wordToGuess && !gameState.gameFinished && gameState.currentRow < 6 && !gameState.won) {
      console.log('💾 Guardando estado del juego en tiempo real')
      localStorage.setItem('twitchdleGame', JSON.stringify(gameState))
    } else {
      console.log('❌ No guardando estado - condiciones no cumplidas')
    }
  }, [gameState.wordToGuess, gameState.board, gameState.currentRow, gameState.currentCol, gameState.gameFinished, gameState.won])

  // Initialize emote rain animation
  useEffect(() => {
    const initEmoteRain = () => {
      console.log('🎭 Initializing emote rain...');
      let numEmotes = 100;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        numEmotes = 30;
      }
      
      const emoteSources = [
        '/games/twitchdle/media/7tv/1.gif',
        '/games/twitchdle/media/7tv/2.gif',
        '/games/twitchdle/media/7tv/3.gif',
        '/games/twitchdle/media/7tv/3x.gif',
        '/games/twitchdle/media/7tv/4.gif',
        '/games/twitchdle/media/7tv/5.gif',
        '/games/twitchdle/media/7tv/6.gif',
        '/games/twitchdle/media/7tv/7.gif',
        '/games/twitchdle/media/7tv/8.gif',
        '/games/twitchdle/media/7tv/9.gif',
        '/games/twitchdle/media/7tv/10.gif',
        '/games/twitchdle/media/7tv/11.gif',
        '/games/twitchdle/media/7tv/12.gif',
        '/games/twitchdle/media/7tv/13.gif',
        '/games/twitchdle/media/7tv/14.gif',
        '/games/twitchdle/media/7tv/15.gif',
        '/games/twitchdle/media/7tv/32.gif',
        '/games/twitchdle/media/7tv/44.gif',
        '/games/twitchdle/media/7tv/BASEDCIGAR.gif',
        '/games/twitchdle/media/7tv/catJam.gif',
        '/games/twitchdle/media/7tv/Nerd.gif',
        '/games/twitchdle/media/7tv/happi.gif',
        '/games/twitchdle/media/7tv/JIJO.gif',
        '/games/twitchdle/media/7tv/nowaying.gif',
        '/games/twitchdle/media/7tv/omegalul.gif',
        '/games/twitchdle/media/7tv/Nerdd.png',
        '/games/twitchdle/media/7tv/sadcat.gif',
        '/games/twitchdle/media/7tv/Sadge.gif',
        '/games/twitchdle/media/7tv/nerd.png',
        '/games/twitchdle/media/7tv/Nerdge.gif',
        '/games/twitchdle/media/7tv/sigma.gif',
        '/games/twitchdle/media/7tv/sigmaArrive.gif',
        '/games/twitchdle/media/7tv/yipe.gif',
        '/games/twitchdle/media/7tv/yump.gif'
      ];

      const emoteContainer = document.getElementById('emote-container');
      if (!emoteContainer) {
        console.log('❌ Emote container not found!');
        return;
      }
      console.log('✅ Emote container found, creating', numEmotes, 'emotes');

      for (let i = 0; i < numEmotes; i++) {
        const emote = document.createElement('img');
        emote.src = emoteSources[Math.floor(Math.random() * emoteSources.length)];
        emote.className = 'emote';
        emote.style.left = Math.random() * 100 + '%';
        emote.style.animationDelay = Math.random() * 20 + 's';
        emote.style.animationDuration = (Math.random() * 5 + 5) + 's';
        emoteContainer.appendChild(emote);
        
        // Debug: verificar que el emote se creó correctamente
        if (i === 0) {
          console.log('🎭 First emote created:', {
            src: emote.src,
            className: emote.className,
            style: emote.style.cssText,
            computedStyle: window.getComputedStyle(emote)
          });
        }
      }
      console.log('🎭 Created', numEmotes, 'emotes in container');
    };

    // Initialize emote rain after component mounts
    const timer = setTimeout(initEmoteRain, 1000);
    
    return () => {
      clearTimeout(timer);
      // Clean up emotes on unmount
      const emoteContainer = document.getElementById('emote-container');
      if (emoteContainer) {
        emoteContainer.innerHTML = '';
      }
    };
  }, [])

  const initializeGame = () => {
    console.log('🔧 initializeGame called - gameInitialized:', gameInitialized.current)
    
    const today = new Date().toDateString()
    const savedGame = localStorage.getItem('twitchdleGame')
    const gameFinished = localStorage.getItem('twitchdleGameFinished')
    const lastPlayedDate = localStorage.getItem('twitchdleLastPlayedDate')
    
    const wordToGuess = getDailyWord()
    
    // --- NUEVA LÓGICA: Manejar el cambio de día explícitamente ---
    if (lastPlayedDate !== today) {
      console.log('🆕 Nuevo día detectado. Reiniciando juego y limpiando datos anteriores.')
      localStorage.removeItem('twitchdleGame') // Borrar el juego guardado anterior
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
      return; // Salir de la función, ya hemos inicializado el juego para el nuevo día
    }

    // --- VERIFICAR SI EL JUEGO GUARDADO ES DEL DÍA CORRECTO ---
    if (savedGame) {
      try {
        const gameData = JSON.parse(savedGame)
        if (gameData.lastPlayedDate !== today) {
          console.log('🆕 Juego guardado es de otro día. Limpiando y creando nuevo juego.')
          localStorage.removeItem('twitchdleGame')
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
          return; // Salir de la función
        }
      } catch (error) {
        console.log('❌ Error parsing saved game, creating new game')
        localStorage.removeItem('twitchdleGame')
      }
    }
    // --- FIN VERIFICACIÓN ---
    
    console.log('🔧 initializeGame called:', {
      today,
      lastPlayedDate,
      gameFinished,
      hasSavedGame: !!savedGame,
      wordToGuess,
      wordLength: wordToGuess.length,
      isSameDay: lastPlayedDate === today,
      isGameFinished: gameFinished === 'true'
    })
    
    if (savedGame && lastPlayedDate === today && gameFinished === 'false') {
      // Cargar juego guardado del mismo día
      const gameData = JSON.parse(savedGame)
      console.log('📁 Cargando juego guardado:', gameData)
      setGameState({
        ...gameData,
        wordToGuess
      })
    } else if (savedGame && lastPlayedDate === today && gameFinished === 'true') {
      // Mostrar pantalla de post-juego del mismo día
      const gameData = JSON.parse(savedGame)
      console.log('🎮 Mostrando pantalla de post-juego:', gameData)
      console.log('🎮 gameData.gameFinished:', gameData.gameFinished)
      console.log('🎮 gameData.won:', gameData.won)
      console.log('🎮 gameData.attempts:', gameData.attempts)
      console.log('🎮 gameData.currentRow:', gameData.currentRow)
      
      // Cargar estadísticas existentes
      const existingStats = JSON.parse(localStorage.getItem('twitchdleStats') || '{"gamesPlayed": 0, "victories": 0, "currentStreak": 0, "maxStreak": 0, "guessDistribution": [0, 0, 0, 0, 0, 0]}')
      
      // Generar esquema de emojis
      const emojiGrid = generateEmojiGrid(gameData.board, gameData.wordToGuess.length, gameData.attempts)
      
      // Actualizar estado de estadísticas
      setGameStats({
        ...existingStats,
        lastGameResult: gameData,
        emojiGrid
      })
      
      showPostGameScreen(gameData)
    } else {
      // Nuevo juego
      console.log('🆕 Creando nuevo juego - Condiciones:', {
        hasSavedGame: !!savedGame,
        isSameDay: lastPlayedDate === today,
        isGameFinished: gameFinished === 'true',
        condition1: savedGame && lastPlayedDate === today && gameFinished === 'false',
        condition2: savedGame && lastPlayedDate === today && gameFinished === 'true'
      })
      
      // Verificar si ya hay un juego guardado con won: true para evitar sobrescribirlo
      if (savedGame) {
        try {
          const existingGameData = JSON.parse(savedGame)
          if (existingGameData.won === true) {
            console.log('🚫 Juego ya ganado detectado, no sobrescribir:', existingGameData)
            return
          }
        } catch (error) {
          console.log('❌ Error parsing existing game data:', error)
        }
      }
      
      // Limpiar localStorage del juego anterior
      localStorage.removeItem('twitchdleGame')
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
    
    // NO usar el sistema viejo (showPostGame)
    // setShowPostGame(true) // REMOVIDO - esto causa el problema
    
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
    console.log('🏆 handleWin called - this should NOT happen on page reload!')
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
    console.log('💾 Guardando gameData en handleWin:', gameData)
    console.log('💾 gameData.won:', gameData.won)
    console.log('💾 gameData.gameFinished:', gameData.gameFinished)
    localStorage.setItem('twitchdleGame', JSON.stringify(gameData))
    localStorage.setItem('twitchdleGameFinished', 'true')
    localStorage.setItem('twitchdleStreak', newStreak.toString())
    localStorage.setItem('twitchdleMaxStreak', newMaxStreak.toString())
    
    // Actualizar estadísticas
    updateGameStats(gameData, true, attempts)
    
    // Guardar en la base de datos
    await saveStreakToDatabase(newStreak)
    
    setGameState(prev => {
      const newState = { ...prev, gameFinished: true, won: true }
      console.log('🎯 setGameState en handleWin:', newState)
      return newState
    })
    
    // Mostrar modal primero
    setModalMessage(`¡Felicidades! ¡Adivinaste la palabra: "${gameData.wordToGuess}"!`)
    setShowGameOverModal(true)
    
    // Countdown para el próximo juego
    startCountdown()
  }

  const handleLose = async () => {
    console.log('💀 handleLose called - this should NOT happen on page reload!')
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
    const emojiGrid = generateEmojiGrid(gameData.board, gameData.wordToGuess.length, gameData.attempts)
    
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

  // Debug: Log modal states (removed to prevent infinite loop)
  // console.log('🔍 Render states:', { showGameOverModal, showStatsScreen, showPostGame })

  return (
    <>
      <div id="emote-container"></div>
      <div className="twitchdle-container">
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
        {!showStatsScreen ? (
          <>
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
          </>
        ) : (
          <div className="stats-content">
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
                      <span className="stat-label">Jugadas:</span>
                      <span className="stat-value">{gameStats.gamesPlayed}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Victorias:</span>
                      <span className="stat-value">
                        {gameStats.gamesPlayed > 0 ? ((gameStats.victories / gameStats.gamesPlayed) * 100).toFixed(2) : '0.00'}%
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Racha Actual:</span>
                      <span className="stat-value">{gameStats.currentStreak}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Mejor Racha:</span>
                      <span className="stat-value">{gameStats.maxStreak}</span>
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
                              width: gameStats.victories > 0 ? `${(count / gameStats.victories) * 100}%` : '0%' 
                            }}
                          ></div>
                        </div>
                        <span className="guess-count">
                          {count} ({gameStats.victories > 0 ? ((count / gameStats.victories) * 100).toFixed(2) : '0.00'}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Social buttons */}
                <div className="social-buttons">
                  <a href="https://cafecito.app/dantesiito" target="_blank" className="social-button cafecito">
                    <i className="fas fa-coffee"></i>
                  </a>
                  <a href="https://github.com/daantesiito" target="_blank" className="social-button github">
                    <i className="fab fa-github"></i>
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
              </>
            )}
          </div>
        )}
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
            
            {/* Social buttons */}
            <div className="social-buttons">
              <a href="https://github.com/daantesiito" target="_blank" rel="noopener noreferrer" className="social-button github">
                <i className="fab fa-github"></i>
              </a>
              <a href="https://cafecito.app/dantesiito" target="_blank" rel="noopener noreferrer" className="social-button cafecito">
                <i className="fas fa-coffee"></i>
              </a>
              <a href="https://www.instagram.com/dante_puddu/" target="_blank" rel="noopener noreferrer" className="social-button instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://www.twitch.tv/daantesiito" target="_blank" rel="noopener noreferrer" className="social-button twitch">
                <i className="fab fa-twitch"></i>
              </a>
              <a href="https://discordapp.com/users/326820001879162880" target="_blank" rel="noopener noreferrer" className="social-button discord">
                <i className="fab fa-discord"></i>
              </a>
            </div>
          </div>
        </div>
      )}

      </div>
    </>
  )
}
