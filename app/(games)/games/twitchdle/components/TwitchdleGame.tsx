'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useTwitchdleGame } from '../hooks/useTwitchdleGame'
import { useNextWordCountdown } from '../hooks/useNextWordCountdown'

export default function TwitchdleGame() {
  const { data: session } = useSession()
  const { gameState, loading, error, saveGame, updateLocalState, validateWord, setGameState, onType, onBackspace, onEnter, stats } = useTwitchdleGame()
  const nextWordCountdown = useNextWordCountdown()
  
  // Función para construir la distribución de intentos
  const buildDistribution = (gameState: any) => {
    const distribution = [0, 0, 0, 0, 0, 0]
    if (gameState.gameFinished && gameState.won) {
      distribution[gameState.attempts - 1] = 1
    }
    return distribution
  }
  
  const [showInstructions, setShowInstructions] = useState(false)
  const [message, setMessage] = useState('')
  

  const boardRef = useRef<HTMLDivElement>(null)
  const keyboardRef = useRef<HTMLDivElement>(null)
  const gameInitialized = useRef(false)

  // Función para manejar mensajes de error
  const showMessage = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2000)
  }, [])

  const handleKeyPress = useCallback((key: string) => {
    if (!gameState || gameState.gameFinished) return

    if (key === 'BACKSPACE') {
      onBackspace()
    } else if (key === 'ENTER') {
      // Validar que la palabra esté completa
      if (gameState.draftRow.length !== gameState.wordLength) {
        showMessage('Palabra incompleta')
        return
      }
      
      // Proceder con la validación (instantáneo)
      onEnter(showMessage)
    } else if (gameState.draftRow.length < gameState.wordLength) {
      onType(key)
    }
  }, [gameState, onType, onBackspace, onEnter, showMessage])


  // Event listener para teclado físico
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState?.gameFinished) return
      
      // Evitar teclas especiales
      if (event.ctrlKey || event.metaKey || event.altKey) return
      
      // Solo procesar teclas de letras, números, backspace y enter
      const key = event.key.toUpperCase()
      if (key === 'BACKSPACE' || key === 'ENTER' || /^[A-Z0-9]$/.test(key)) {
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
                '/games/twitchdle/media/7tv/yump.gif',
                '/games/twitchdle/media/7tv/aJugar-2x.gif',
                '/games/twitchdle/media/7tv/BANGER-3x.gif',
                '/games/twitchdle/media/7tv/c32-3x.gif',
                '/games/twitchdle/media/7tv/cobrixDance-4x.gif',
                '/games/twitchdle/media/7tv/Cooked-3x.png',
                '/games/twitchdle/media/7tv/dans-4x.gif',
                '/games/twitchdle/media/7tv/davoDance-2x.gif',
                '/games/twitchdle/media/7tv/enfadao-3x.png',
                '/games/twitchdle/media/7tv/FINALLY-3x.gif',
                '/games/twitchdle/media/7tv/LO-3x.png',
                '/games/twitchdle/media/7tv/LOL-3x.gif',
                '/games/twitchdle/media/7tv/ome45-3x.gif',
                '/games/twitchdle/media/7tv/omeScrajj-3x.gif',
                '/games/twitchdle/media/7tv/RingWide-3x.gif',
                '/games/twitchdle/media/7tv/thatsCrazy-3x.gif',
                '/games/twitchdle/media/7tv/VOIDJ-3x.png',
                '/games/twitchdle/media/7tv/WHAAAT-3x.gif',
                '/games/twitchdle/media/7tv/YAAAY-3x.gif'
            ];

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

  // Disparar evento para actualizar el leaderboard si ganó
  useEffect(() => {
    if (gameState?.gameFinished && gameState.won) {
      window.dispatchEvent(new CustomEvent('streakUpdated'))
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
          <h2 className="text-2xl font-bold mt-14"> Cargando streamer del día...</h2>
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
                  El objetivo del juego es adivinar el streamer del día. Tenes 6 intentos para adivinarlo.
                </p>
                <p>
                  El nombre del streamer es como se lo conoce. Hay nombres recortados por ser muy largos o contener letras repetidas.
                </p>
                <p>
                  Por ejemplo con mi user: &quot;daantesiito&quot; se deberia adivinar &quot;dantesito&quot;.
                </p>
                <p> 
                  La palabra es la misma para todas las personas en ese día. En cada ronda, el juego 
                  pinta cada letra de un color indicando si esa letra se encuentra o no en la palabra y si está en la posición correcta.
                </p>
                <p>
                  <img src="/games/twitchdle/media/VERDE.png" alt="Letra verde" className="instruction-icon" />
                  <span style={{color: 'var(--col-correct)', fontWeight: 'bold'}}>VERDE </span> 
                  significa que la letra está en la palabra y en la posición CORRECTA 
                </p>
                <p>
                  <img src="/games/twitchdle/media/AMARILLO.png" alt="Letra amarilla" className="instruction-icon" />
                  <span style={{color: 'var(--col-present)', fontWeight: 'bold'}}>AMARILLO </span> 
                  significa que la letra está presente en la palabra pero en la posición INCORRECTA 
                </p>
                <p>
                  <img src="/games/twitchdle/media/GRIS.png" alt="Letra gris" className="instruction-icon" />
                  <span style={{color: 'var(--col-absent)', fontWeight: 'bold'}}>GRIS </span> 
                  significa que la letra NO está presente en la palabra 
                </p>
                <p> 
                  El login con twitch solo guarda tu nombre de usuario para poder usarlo como &quot;cuenta&quot; y que no se repita.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="container">
          {!gameState.gameFinished ? (
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
              <h2>{gameState.won ? '¡Felicidades!' : '¡Intentalo de nuevo mañana!'}</h2>
              
              <p className="game-result">
                {gameState.won 
                  ? `¡Adivinaste el streamer de hoy: ${stats.wordOfDay || gameState.wordOfDay}!`
                  : `No lograste acertar, streamer de hoy: "${stats.wordOfDay || gameState.wordOfDay}"`
                }
              </p>
              
              <div className="emoji-grid">
                <pre>{stats.emojiGrid}</pre>
              </div>
              
              <p className="next-word-countdown">
                Siguiente palabra en: {nextWordCountdown}
              </p>
              
              <div className="stats-section">
                <h3>Estadísticas</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Jugadas:</span>
                    <span className="stat-value">{stats.totalGames}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Victorias:</span>
                    <span className="stat-value">{stats.successRate}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Racha Actual:</span>
                    <span className="stat-value">{stats.currentStreak}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Mejor Racha:</span>
                    <span className="stat-value">{stats.maxStreak}</span>
                  </div>
                </div>
                
                <div className="guess-distribution">
                  <h4>Distribución de wins:</h4>
                  {stats.winDistribution.map((count, index) => (
                    <div key={index} className="guess-row">
                      <span className="guess-number">{index + 1}:</span>
                      <div className="guess-bar">
                        <div 
                          className="guess-fill" 
                          style={{ 
                            width: stats.victories > 0 ? `${(count / stats.victories) * 100}%` : '0%' 
                          }}
                        ></div>
                      </div>
                      <span className="guess-count">
                        {count} ({stats.victories > 0 ? ((count / stats.victories) * 100).toFixed(2) : '0.00'}%)
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
            </div>
          )}
        </div>

      </div>
    </>
  )
}
