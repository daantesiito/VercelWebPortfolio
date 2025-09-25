import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTopScores, getTopStreamerScores, type TopScore } from '@/lib/scores';
import GameWithLeaderboard from './components/GameWithLeaderboard';
import AuthButton from '@/components/AuthButton';
import './styles.css';
import './leaderboard.css';

// Forzar Node.js runtime para Prisma
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '2048 — dantesito.dev',
  description: 'Jugá al juego 2048 con emotes de Twitch. Combina fichas para llegar al OMEGALUL.',
  keywords: ['2048', 'juego', 'twitch', 'emotes', 'dantesito.dev'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: '2048 — dantesito.dev',
    description: 'Jugá al juego 2048 con emotes de Twitch. Combina fichas para llegar al OMEGALUL.',
    url: 'https://dantesito.dev/games/2048',
    siteName: 'dantesito.dev',
    images: [
      {
        url: '/games/2048/logo.png',
        width: 512,
        height: 512,
        alt: '2048 Game',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
};

export default async function Game2048Page() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e5d4ff' }}>
        <div className="text-center flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-8" style={{ color: '#634e83' }}>2048</h1>
          <p className="text-xl mb-8" style={{ color: '#634e83' }}>
            Autorizá con twitch para jugar
          </p>
          <div className="flex justify-center">
            <AuthButton callbackUrl="/games/2048" />
          </div>
        </div>
      </div>
    );
  }

  // Obtener scores con manejo de errores
  let topScores: TopScore[] = [];
  let streamerScores: TopScore[] = [];
  
  try {
    console.log('🔍 Fetching scores for 2048 game...');
    [topScores, streamerScores] = await Promise.all([
      getTopScores('2048', 100), // Obtener hasta 100 scores globales
      getTopStreamerScores('2048', 100) // Obtener hasta 100 scores de streamers
    ]);
    console.log('✅ Scores fetched successfully:', { 
      topScoresCount: topScores.length, 
      streamerScoresCount: streamerScores.length 
    });
  } catch (error) {
    console.error('❌ Error fetching scores:', error);
    // Continuar con arrays vacíos si hay error
    topScores = [];
    streamerScores = [];
  }

  return <GameWithLeaderboard initialScores={topScores} initialStreamerScores={streamerScores} />;
}
