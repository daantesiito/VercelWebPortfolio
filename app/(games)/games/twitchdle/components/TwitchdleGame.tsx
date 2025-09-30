'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useTwitchdleGame } from '../hooks/useTwitchdleGame'

export default function TwitchdleGame() {
  const { data: session } = useSession()
  const { gameState, loading, error, saveGame, updateLocalState, createNewGame, validateWord, setGameState, onType, onBackspace, onEnter } = useTwitchdleGame()
  
  // Función para obtener la palabra del día desde la base de datos
  const getDailyWord = async () => {
    try {
      const response = await fetch(`/api/twitchdle/daily-word?date=${new Date().toISOString().split('T')[0]}`)
      if (response.ok) {
        const data = await response.json()
        return data.word
      }
      throw new Error('No se pudo obtener la palabra del día')
    } catch (error) {
      console.error('Error obteniendo palabra del día:', error)
      throw error
    }
  }
  
  const [showInstructions, setShowInstructions] = useState(false)
  const [message, setMessage] = useState('')
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
  const gameInitialized = useRef(false)

  // Función para manejar mensajes de error
  const showMessage = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2000)
  }, [])

  const handleKeyPress = useCallback(async (key: string) => {
    if (!gameState || gameState.gameFinished) return

    if (key === 'BACKSPACE') {
      onBackspace()
    } else if (key === 'ENTER') {
      // Validar que la palabra esté completa
      if (gameState.draftRow.length !== gameState.wordLength) {
        showMessage('Palabra incompleta')
        return
      }

      // Si no hay ID del juego, crear uno nuevo antes de validar
      if (!gameState.id) {
        const wordLength = gameState.wordLength || 4
        console.log('🎮 Creating new game before validation with wordLength:', wordLength)
        
        // Crear el juego en paralelo con la validación para reducir delay
        const gameCreationPromise = createNewGame(wordLength)
        
        // Mientras se crea el juego, proceder con la validación
        await onEnter(showMessage)
        
        // Esperar a que termine la creación del juego
        await gameCreationPromise
      } else {
        await onEnter(showMessage)
      }
    } else if (gameState.draftRow.length < gameState.wordLength) {
      onType(key)
    }
  }, [gameState, createNewGame, onType, onBackspace, onEnter, showMessage])


  // Event listener para teclado físico
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState?.gameFinished) return
      
      // Evitar teclas especiales
      if (event.ctrlKey || event.metaKey || event.altKey) return
      
      // Solo procesar teclas de letras, números, backspace y enter
      const key = event.key.toUpperCase()
      if (key === 'BACKSPACE' || key === 'ENTER' || /^[A-Z0-9]$/.test(key)) {
        console.log('🎹 Physical key pressed:', key)
        handleKeyPress(key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState?.gameFinished, handleKeyPress])

      // Initialize emote rain animation
      useEffect(() => {
        const initEmoteRain = () => {
          let numEmotes = 100
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
          if (isMobile) numEmotes = 30
          
          const emoteSources = [
            '/games/twitchdle/media/7tv/1.gif', '/games/twitchdle/media/7tv/2.gif',
            '/games/twitchdle/media/7tv/3.gif', '/games/twitchdle/media/7tv/4.gif',
            '/games/twitchdle/media/7tv/5.gif', '/games/twitchdle/media/7tv/6.gif',
            '/games/twitchdle/media/7tv/7.gif', '/games/twitchdle/media/7tv/8.gif',
            '/games/twitchdle/media/7tv/9.gif', '/games/twitchdle/media/7tv/10.gif'
          ]

          const emoteContainer = document.getElementById('emote-container')
          
          if (!emoteContainer) {
            setTimeout(initEmoteRain, 200)
            return
          }

          for (let i = 0; i < numEmotes; i++) {
            const emote = document.createElement('img')
            emote.src = emoteSources[Math.floor(Math.random() * emoteSources.length)]
            emote.className = 'emote'
            emote.style.left = Math.random() * 100 + '%'
            emote.style.animationDelay = Math.random() * 20 + 's'
            emote.style.animationDuration = (Math.random() * 5 + 5) + 's'
            emoteContainer.appendChild(emote)
          }
        }

        // Esperar más tiempo para que el DOM esté completamente listo
        const timer = setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(initEmoteRain)
          })
        }, 1500)
        
        return () => {
          clearTimeout(timer)
          const emoteContainer = document.getElementById('emote-container')
          if (emoteContainer) {
            emoteContainer.innerHTML = ''
          }
        }
      }, [])

  // Actualizar gameStats cuando se carga el juego
  useEffect(() => {
    if (gameState) {
      const updateStats = async () => {
        // Crear distribución de intentos basada en el juego actual
        const guessDistribution = [0, 0, 0, 0, 0, 0]
        if (gameState.gameFinished && gameState.won) {
          guessDistribution[gameState.attempts - 1] = 1
        }
        
        // Si el juego terminó, obtener la palabra del día primero
        if (gameState.gameFinished) {
          try {
            const dailyWord = await getDailyWord()
            setGameStats({
              gamesPlayed: 1, // Por ahora solo contamos el juego actual
              victories: gameState.won ? 1 : 0,
              currentStreak: gameState.streak,
              maxStreak: gameState.maxStreak,
              guessDistribution,
              lastGameResult: {
                won: gameState.won,
                wordToGuess: dailyWord,
                attempts: gameState.attempts
              },
              emojiGrid: generateEmojiGrid(gameState.committedBoard, gameState.attempts)
            })
          } catch (error) {
            // Si falla, mostrar error
            setGameStats({
              gamesPlayed: 1,
              victories: gameState.won ? 1 : 0,
              currentStreak: gameState.streak,
              maxStreak: gameState.maxStreak,
              guessDistribution,
              lastGameResult: {
                won: gameState.won,
                wordToGuess: 'Error al cargar',
                attempts: gameState.attempts
              },
              emojiGrid: generateEmojiGrid(gameState.committedBoard, gameState.attempts)
            })
          }
        } else {
          // Si el juego no terminó, solo actualizar estadísticas básicas
          setGameStats(prev => ({
            ...prev,
            gamesPlayed: 1,
            victories: gameState.won ? 1 : 0,
            currentStreak: gameState.streak,
            maxStreak: gameState.maxStreak,
            guessDistribution,
            lastGameResult: null,
            emojiGrid: ''
          }))
        }
      }
      
      updateStats()
    }
  }, [gameState])

  // Mostrar pantalla de estadísticas cuando el juego termina
  useEffect(() => {
    if (gameState?.gameFinished) {
      setShowStatsScreen(true)
      // Disparar evento para actualizar el leaderboard si ganó
      if (gameState.won) {
        window.dispatchEvent(new CustomEvent('streakUpdated'))
      }
    }
  }, [gameState?.gameFinished, gameState?.won])

      // Función para generar el emoji grid
      const generateEmojiGrid = (committedBoard: any[][], attempts: number) => {
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

      // Función para calcular el estado de cada letra del teclado
      const getKeyboardStatus = (committedBoard: any[][]) => {
        const letterStatus: { [key: string]: 'correct' | 'present' | 'absent' } = {}
        
        // Recorrer todas las filas evaluadas
        for (let row = 0; row < committedBoard.length; row++) {
          if (committedBoard[row] && committedBoard[row].some(cell => cell && cell.status)) {
            for (let col = 0; col < committedBoard[row].length; col++) {
              const cell = committedBoard[row][col]
              if (cell && cell.status) {
                const letter = cell.letter
                const status = cell.status
                
                // Prioridad: correct > present > absent
                if (!letterStatus[letter] || 
                    (status === 'correct') || 
                    (status === 'present' && letterStatus[letter] === 'absent')) {
                  letterStatus[letter] = status
                }
              }
            }
          }
        }
        
        return letterStatus
      }

  // Mostrar pantalla de carga
  if (loading) {
    return (
      <div className="twitchdle-container">
        <h1>Twitchdle</h1>
        <div className="container">
          <p>Cargando juego...</p>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (error) {
    return (
      <div className="twitchdle-container">
        <h1>Twitchdle</h1>
        <div className="container">
          <p>Error: {error}</p>
        </div>
      </div>
    )
  }

  // Si no hay estado del juego, no renderizar nada
  if (!gameState) {
    return null
  }

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
          {!showStatsScreen && !gameState.gameFinished ? (
            <>
              <div 
                ref={boardRef} 
                id="board"
                style={{ '--word-length': gameState.wordLength } as React.CSSProperties}
              >
                {Array(6).fill(null).map((_, rowIndex) => (
                  <div key={rowIndex} className="row">
                    {Array(gameState.wordLength).fill(null).map((_, colIndex) => {
                      let letter = ''
                      let status = ''
                      
                      // Verificar si la fila tiene contenido evaluado (con status)
                      const hasEvaluatedContent = rowIndex < gameState.committedBoard.length && 
                        gameState.committedBoard[rowIndex] && 
                        gameState.committedBoard[rowIndex].some(cell => cell && cell.status)
                      
                      if (hasEvaluatedContent) {
                        // Fila ya evaluada
                        const cell = gameState.committedBoard[rowIndex][colIndex]
                        if (cell) {
                          letter = cell.letter || ''
                          status = cell.status || ''
                        }
                      } else if (rowIndex === gameState.currentRow) {
                        // Fila actual con draft
                        letter = gameState.draftRow[colIndex] || ''
                      }
                      
                      return (
                        <div 
                          key={colIndex} 
                          className={`cell ${status || ''}`}
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
                  {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(key => {
                    const keyboardStatus = getKeyboardStatus(gameState.committedBoard)
                    const keyStatus = keyboardStatus[key] || ''
                    return (
                      <button 
                        key={key} 
                        className={`key ${keyStatus}`} 
                        onClick={() => handleKeyPress(key)}
                      >
                        {key}
                      </button>
                    )
                  })}
                </div>
                <div className="keyboard-row">
                  {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map(key => {
                    const keyboardStatus = getKeyboardStatus(gameState.committedBoard)
                    const keyStatus = keyboardStatus[key] || ''
                    return (
                      <button 
                        key={key} 
                        className={`key ${keyStatus}`} 
                        onClick={() => handleKeyPress(key)}
                      >
                        {key}
                      </button>
                    )
                  })}
                </div>
                <div className="keyboard-row">
                  <button className="key wide" onClick={() => handleKeyPress('ENTER')}>ENTER</button>
                  {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(key => {
                    const keyboardStatus = getKeyboardStatus(gameState.committedBoard)
                    const keyStatus = keyboardStatus[key] || ''
                    return (
                      <button 
                        key={key} 
                        className={`key ${keyStatus}`} 
                        onClick={() => handleKeyPress(key)}
                      >
                        {key}
                      </button>
                    )
                  })}
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
              <div className="social-buttons">
                <a href="https://ko-fi.com/dantesito" target="_blank" className="social-button kofi">
                  <i className="fas fa-coffee"></i>
                </a>
                <a href="https://github.com/dantesito" target="_blank" className="social-button github">
                  <i className="fab fa-github"></i>
                </a>
                <a href="https://www.instagram.com/dantesito.dev/" target="_blank" className="social-button instagram">
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
          </div>
        )}
      </div>
    </>
  )
}
