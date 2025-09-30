'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '../queryClient';

export function useLeaderboard(date: string) {
  return useQuery({
    queryKey: ['leaderboard', 'streak', date],
    queryFn: async () => {
      const res = await fetch(`/api/scores?game=twitchdle&limit=10&streak=true`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.status === 304) {
        // react-query conserva data previa
        return queryClient.getQueryData(['leaderboard', 'streak', date])
      }
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json() as Promise<Array<{ 
        value: number; 
        displayName: string; 
        avatarUrl: string | null; 
        twitchLogin: string; 
        userId?: string;
      }>>;
    },
    // "en vivo" simple
    refetchInterval: 15000,        // 15s
    refetchOnWindowFocus: false,
    staleTime: 15000,
    gcTime: 24 * 60 * 60 * 1000,
    placeholderData: (prev) => prev, // instant paint con cache previo
  });
}

export function useMyStats(userId: string | undefined | null) {
  return useQuery({
    enabled: !!userId,
    queryKey: ['stats', 'me', userId],
    queryFn: async () => {
      const res = await fetch(`/api/twitchdle/stats?userId=${userId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json() as Promise<{
        gamesPlayed: number;
        victories: number;
        currentStreak: number;
        maxStreak: number;
        guessDistribution: number[];
      }>;
    },
  });
}

// Función para hint optimista cuando el usuario gana
export function bumpMyStreakOptimistic(userId: string, dateKey: string) {
  queryClient.setQueryData<any[]>(['leaderboard', 'streak', dateKey], (prev) => {
    if (!prev) return prev
    const copy = prev.map(r => ({ ...r }))
    const me = copy.find(r => r.userId === userId)
    if (me) {
      me.currentStreak = Math.max(me.currentStreak ?? 0, (me.currentStreak ?? 0) + 1)
      me.maxStreak = Math.max(me.maxStreak ?? 0, me.currentStreak)
      me.updatedAt = new Date().toISOString()
    } else {
      copy.push({ userId, currentStreak: 1, maxStreak: 1, updatedAt: new Date().toISOString() })
    }
    // reordenar como servidor
    copy.sort((a, b) =>
      b.currentStreak - a.currentStreak || b.maxStreak - a.maxStreak || +new Date(b.updatedAt) - +new Date(a.updatedAt)
    )
    return copy
  })
}
