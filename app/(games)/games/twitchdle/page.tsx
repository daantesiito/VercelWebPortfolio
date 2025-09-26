import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTopStreakScores, type TopScore } from '@/lib/scores';
import TwitchdleWithLeaderboard from './components/TwitchdleWithLeaderboard';
import AuthButton from '@/components/AuthButton';
import './styles.css';

// Forzar Node.js runtime para Prisma
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Twitchdle - Adivina la palabra del día',
  description: 'Adivina la palabra del día relacionada con Twitch y el streaming. ¡Juega todos los días y mantén tu racha!',
  openGraph: {
    title: 'Twitchdle - Adivina la palabra del día',
    description: 'Adivina la palabra del día relacionada con Twitch y el streaming. ¡Juega todos los días y mantén tu racha!',
    images: ['/images/twitchdle.jpg'],
  },
};

export default async function TwitchdlePage() {
  const session = await getServerSession(authOptions);

  // Obtener scores de racha con manejo de errores
  let streakScores: TopScore[] = [];
  
  try {
    console.log('🔍 Fetching streak scores for Twitchdle...');
    streakScores = await getTopStreakScores('twitchdle', 10);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Twitchdle</h1>
          <p className="text-xl text-gray-300 mb-8">
            Adivina la palabra del día relacionada con Twitch y el streaming
          </p>
          <div className="flex justify-center">
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <TwitchdleWithLeaderboard initialStreakScores={streakScores} />
    </div>
  );
}
