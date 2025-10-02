import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTopStreakScores, type TopScore } from '@/lib/scores';
import AuthButton from '@/components/AuthButton';
import ClientProviders from './ClientProviders';
import './styles.css';
import Head from 'next/head';

// Forzar Node.js runtime para Prisma
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Twitchdle - dantesito.dev',
  description: 'Adivina el Streamer del día. Juga todos los días para mantener tu racha!',
  openGraph: {
    title: 'Twitchdle - dantesito.dev',
    description: 'Adivina el Streamer del día. Juga todos los días para mantener tu racha!',
    images: ['/images/twitchdle.jpg'],
  },
};

export default async function TwitchdlePage() {
  const session = await getServerSession(authOptions);

  // Obtener scores de racha con manejo de errores
  let streakScores: TopScore[] = [];
  
  try {
    console.log('🔍 Fetching streak scores for Twitchdle...');
    streakScores = await getTopStreakScores('twitchdle', 100);
    console.log('✅ Streak scores fetched successfully:', { 
      streakScoresCount: streakScores.length 
    });
  } catch (error) {
    console.error('❌ Error fetching streak scores:', error);
    // Continuar con array vacío si hay error
    streakScores = [];
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e5d4ff' }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8" style={{ color: '#634e83' }}>Twitchdle</h1>
          <h2 className="text-2xl font-bold text-white mb-4" style={{ color: '#634e83' }}>El Wordle de Streamers</h2>
          <p className="text-xl text-gray-300 mb-8" style={{ color: '#634e83' }}>
            Adivina el streamer del día. Juga todos los días para mantener tu racha!
          </p>
          <div className="flex justify-center">
            <AuthButton callbackUrl="/games/twitchdle" />
          </div>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const userId = session.user.id;

  return (
    <>
      <Head>
        {/* Preloads críticos - NYT style */}
        <link rel="preconnect" href="https://static-cdn.jtvnw.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://static-cdn.jtvnw.net" />
        
        {/* Preload de recursos críticos del juego */}
        <link rel="preload" as="image" href="/games/twitchdle/media/VERDE.png" />
        <link rel="preload" as="image" href="/games/twitchdle/media/AMARILLO.png" />
        <link rel="preload" as="image" href="/games/twitchdle/media/GRIS.png" />
        <link rel="preload" as="image" href="/games/twitchdle/media/twitchLogo.png" />
        
        {/* Preload de algunos emotes críticos */}
        <link rel="preload" as="image" href="/games/twitchdle/media/7tv/1.gif" />
        <link rel="preload" as="image" href="/games/twitchdle/media/7tv/2.gif" />
        <link rel="preload" as="image" href="/games/twitchdle/media/7tv/3.gif" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e5d4ff' }}>
        <ClientProviders streakScores={streakScores} />
      </div>
    </>
  );
}

