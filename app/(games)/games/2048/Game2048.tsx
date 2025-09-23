'use client';

import { useEffect, useRef, useState } from 'react';
import { GameManager } from './lib/GameManager';
import { KeyboardInputManager } from './lib/KeyboardInputManager';
import { HTMLActuator } from './lib/HTMLActuator';
import { LocalStorageManager } from './lib/LocalStorageManager';

export default function Game2048() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const [isKickTheme, setIsKickTheme] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Wait till the browser is ready to render the game (avoids glitches)
    const initGame = () => {
      if (gameContainerRef.current && !gameManagerRef.current) {
        gameManagerRef.current = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(initGame);
    }

    // Cleanup function
    return () => {
      // Clean up any event listeners if needed
      if (gameManagerRef.current) {
        // The GameManager doesn't expose cleanup methods, but we can nullify the reference
        gameManagerRef.current = null;
      }
    };
  }, []);

  const handleThemeSwitch = () => {
    setIsKickTheme(!isKickTheme);
    if (typeof document !== 'undefined') {
      const body = document.body;
      if (isKickTheme) {
        body.classList.remove('kick-theme');
      } else {
        body.classList.add('kick-theme');
      }
    }
  };

  const handleGuideClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  return (
    <div className={`game-2048 ${isKickTheme ? 'kick-theme' : ''}`}>
      <div className="container">
        <div className="theme-switcher">
          <h5>Cambiar colores -&gt; </h5>
          <button id="themeSwitcherButton" onClick={handleThemeSwitch}>
            TWITCH / KICK
          </button>
        </div>

        <div className="heading">
          <h1 className="title">2048</h1>
          <div className="scores-container">
            <div className="score-container">0</div>
            <div className="best-container">0</div>
          </div>
        </div>

        <div className="above-game">
          <p className="game-intro">Juntá los EMOTES para conseguir <strong>la ficha del OMEGALUL</strong></p>
          <button className="restart-button">Nuevo Juego</button>
        </div>

        <div className="game-container" ref={gameContainerRef}>
          <div className="game-message">
            <p></p>
            <div className="lower">
              <a className="keep-playing-button">Continuar</a>
              <a className="retry-button">Reintentar</a>
            </div>
          </div>

          <div className="grid-container">
            <div className="grid-row">
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
            </div>
            <div className="grid-row">
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
            </div>
            <div className="grid-row">
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
            </div>
            <div className="grid-row">
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
              <div className="grid-cell"></div>
            </div>
          </div>
          <div className="tile-container">
          </div>
        </div>

        <p className="game-explanation">
          <strong className="important">Como Jugar:</strong> Usá las <strong>flechas del teclado</strong> para mover las fichas. Cuando dos fichas con el mismo emote se tocan, <strong>se fusionan en una sola</strong>.
        </p>

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

      {showModal && (
        <div id="imageModal" onClick={handleModalClick}>
          <button className="close" onClick={handleCloseModal}>&times;</button>
          <img src="/games/2048/media/guia.png" alt="Guia" />
        </div>
      )}

      {/* Font Awesome CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
    </div>
  );
}
