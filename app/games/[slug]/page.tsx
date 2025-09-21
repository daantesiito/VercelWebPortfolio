'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { gameUrls } from '@/data/projects';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const gameUrl = gameUrls[slug];
  const gameTitle = slug.charAt(0).toUpperCase() + slug.slice(1);

  useEffect(() => {
    // Timeout para detectar si el iframe no carga
    const timer = setTimeout(() => {
      if (isLoading) {
        setIframeError(true);
        setIsLoading(false);
      }
    }, 10000); // 10 segundos timeout

    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIsLoading(false);
  };

  const openInNewTab = () => {
    window.open(gameUrl, '_blank', 'noopener,noreferrer');
  };

  if (!gameUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Juego no encontrado</h1>
          <p className="text-gray-300 mb-6">El juego que buscas no existe.</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-2xl hover:bg-primary/80 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header del juego */}
      <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                aria-label="Volver al inicio"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver
              </Link>
              <h1 className="text-xl font-semibold text-white">{gameTitle}</h1>
            </div>
            <button
              onClick={openInNewTab}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/80 transition-colors"
              aria-label="Abrir juego en nueva pestaña"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Abrir en nueva pestaña
            </button>
          </div>
        </div>
      </div>

      {/* Contenido del juego */}
      <div className="relative">
        {isLoading && !iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-300">Cargando juego...</p>
            </div>
          </div>
        )}

        {iframeError ? (
          <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">No se puede cargar el juego</h2>
              <p className="text-gray-300 mb-6">
                El juego no se puede mostrar aquí debido a restricciones de seguridad. 
                Puedes abrirlo directamente en una nueva pestaña.
              </p>
              <button
                onClick={openInNewTab}
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-2xl hover:bg-primary/80 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Abrir {gameTitle} en nueva pestaña
              </button>
            </div>
          </div>
        ) : (
          <iframe
            src={gameUrl}
            className="w-full h-[calc(100vh-120px)] border-0"
            title={`${gameTitle} - Juego embebido`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            allow="fullscreen; gamepad"
          />
        )}
      </div>

      {/* Botón flotante para volver */}
      <Link
        href="/"
        className="fixed bottom-6 right-6 z-50 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/80 transition-all duration-300 hover:scale-110"
        aria-label="Volver al inicio"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </Link>
    </div>
  );
}



