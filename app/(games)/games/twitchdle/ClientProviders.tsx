'use client';

import Providers from './Providers';
import TwitchdleWithLeaderboard from './components/TwitchdleWithLeaderboard';
import type { TopScore } from '@/lib/scores';

interface ClientProvidersProps {
  streakScores: TopScore[];
}

export default function ClientProviders({ streakScores }: ClientProvidersProps) {
  return (
    <Providers>
      <TwitchdleWithLeaderboard initialStreakScores={streakScores} />
    </Providers>
  );
}
