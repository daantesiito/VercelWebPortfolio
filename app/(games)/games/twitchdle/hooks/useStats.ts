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

export function useLeaderboardLive(dateKey: string) {
  return useQuery({
    queryKey: ['leaderboard', 'streak', dateKey],
    queryFn: async () => {
      const res = await fetch(`/api/scores?game=twitchdle&limit=10&streak=true`, { 
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.status === 304) {
        return queryClient.getQueryData(['leaderboard','streak',dateKey]);
      }
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const serverData = await res.json() as Array<{ 
        value: number; 
        displayName: string; 
        avatarUrl: string | null; 
        twitchLogin: string; 
        userId?: string;
      }>;
      
      // Verificar si hay datos optimistas que necesitan ser preservados
      const currentData = queryClient.getQueryData(['leaderboard', 'streak', dateKey]) as any[]
      
      if (currentData && currentData.length > 0) {
        console.log('🔄 Checking if server has updated data for optimistic users')
        console.log('📊 Current optimistic data:', currentData.map(u => ({ userId: u.userId, displayName: u.displayName, value: u.value })))
        console.log('📊 Server data:', serverData.map(u => ({ userId: u.userId, displayName: u.displayName, value: u.value })))
        
        // Crear un mapa de usuarios del servidor
        const serverUserMap = new Map(serverData.map(user => [user.userId, user]))
        const mergedData = [...serverData]
        
        // Verificar si hay usuarios optimistas que no están en el servidor o tienen datos más recientes
        let hasOptimisticData = false
        
        currentData.forEach(optimisticUser => {
          if (!optimisticUser.userId) {
            console.log('⚠️ Optimistic user has no userId:', optimisticUser)
            return
          }
          
          const serverUser = serverUserMap.get(optimisticUser.userId)
          console.log(`🔍 Checking user ${optimisticUser.displayName} (${optimisticUser.userId}):`, {
            foundInServer: !!serverUser,
            serverUser: serverUser ? { displayName: serverUser.displayName, value: serverUser.value, updatedAt: serverUser.updatedAt } : null
          })
          
          if (!serverUser) {
            // Usuario no existe en servidor, mantener optimista
            mergedData.push(optimisticUser)
            hasOptimisticData = true
            console.log('✅ Keeping optimistic user (not in server yet):', optimisticUser.displayName)
          } else {
            // Usuario existe en servidor, verificar si el servidor tiene datos más recientes
            const optimisticTime = new Date(optimisticUser.updatedAt || 0).getTime()
            const serverTime = new Date(serverUser.updatedAt || 0).getTime()
            
            console.log(`⏰ Time comparison for ${optimisticUser.displayName}:`, {
              optimisticTime: new Date(optimisticTime).toISOString(),
              serverTime: new Date(serverTime).toISOString(),
              optimisticIsNewer: optimisticTime > serverTime
            })
            
            if (optimisticTime > serverTime) {
              // Datos optimistas son más recientes, mantener optimista
              const index = mergedData.findIndex(u => u.userId === optimisticUser.userId)
              if (index !== -1) {
                mergedData[index] = optimisticUser
                hasOptimisticData = true
                console.log('✅ Keeping optimistic data (more recent):', optimisticUser.displayName)
              }
            } else {
              // Servidor tiene datos más recientes, usar servidor
              console.log('✅ Using server data (more recent):', serverUser.displayName)
            }
          }
        })
        
        if (hasOptimisticData) {
          // Reordenar con datos optimistas incluidos
          mergedData.sort((a, b) => {
            const valueA = a.value || 0
            const valueB = b.value || 0
            if (valueA !== valueB) return valueB - valueA
            
            const timeA = new Date(a.updatedAt || 0).getTime()
            const timeB = new Date(b.updatedAt || 0).getTime()
            return timeA - timeB
          })
          
          return mergedData.slice(0, 10)
        }
      }
      
      // Si no hay datos optimistas o el servidor tiene datos más recientes, usar servidor
      console.log('🔄 Using server data directly')
      
      const sortedData = serverData.sort((a, b) => {
        const valueA = a.value || 0
        const valueB = b.value || 0
        if (valueA !== valueB) return valueB - valueA
        
        const timeA = new Date(a.updatedAt || 0).getTime()
        const timeB = new Date(b.updatedAt || 0).getTime()
        return timeA - timeB
      })
      
      return sortedData.slice(0, 10)
    },
    placeholderData: (prev) => prev,     // paint instantáneo
    staleTime: 15000,
    refetchInterval: 15000,              // "en vivo"
    refetchOnWindowFocus: false,
    gcTime: 24 * 60 * 60 * 1000,
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

// Función para limpiar duplicados del leaderboard
function removeDuplicates(leaderboard: any[]): any[] {
  const seen = new Map<string, any>()
  
  leaderboard.forEach(user => {
    if (user.userId) {
      // Si ya existe, mantener el que tiene el updatedAt más reciente
      const existing = seen.get(user.userId)
      if (!existing || new Date(user.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
        seen.set(user.userId, user)
      }
    } else {
      // Si no tiene userId, intentar usar twitchLogin como fallback
      const fallbackKey = user.twitchLogin || user.displayName
      if (fallbackKey) {
        const existing = seen.get(fallbackKey)
        if (!existing || new Date(user.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
          seen.set(fallbackKey, user)
        }
      }
    }
  })
  
  return Array.from(seen.values())
}

// Función para actualización optimista del leaderboard cuando el usuario gana
export function bumpMyStreakOptimistic(
  userId: string, 
  dateKey: string, 
  userInfo?: { displayName?: string; twitchLogin?: string; avatarUrl?: string },
  bestStreak?: number
) {
  console.log('🚀 Updating leaderboard optimistically:', { userId, userInfo, bestStreak })
  
  queryClient.setQueryData<any[]>(['leaderboard', 'streak', dateKey], (prev) => {
    if (!prev) return prev
    
    // Limpiar duplicados primero
    const cleanData = removeDuplicates(prev)
    const copy = cleanData.map(r => ({ ...r }))
    const me = copy.find(r => r.userId === userId)
    
    if (me) {
      // Usuario ya existe en el leaderboard - usar la racha máxima si se proporciona
      const newValue = bestStreak || Math.max(me.value ?? 0, (me.value ?? 0) + 1)
      me.value = newValue
      me.updatedAt = new Date().toISOString()
      console.log('✅ Updated existing user in leaderboard:', me)
    } else {
      // Usuario nuevo en el leaderboard
      const newEntry = {
        userId,
        value: bestStreak || 1,
        displayName: userInfo?.displayName || userInfo?.twitchLogin || 'Jugador',
        twitchLogin: userInfo?.twitchLogin || 'unknown',
        avatarUrl: userInfo?.avatarUrl || null,
        updatedAt: new Date().toISOString()
      }
      copy.push(newEntry)
      console.log('✅ Added new user to leaderboard:', newEntry)
    }
    
    // Reordenar por streak descendente, luego por orden de llegada (updatedAt ascendente)
    copy.sort((a, b) => {
      const streakA = a.value || 0
      const streakB = b.value || 0
      if (streakA !== streakB) return streakB - streakA
      
      // Para empates, el que llegó primero (updatedAt más antiguo) va arriba
      const timeA = new Date(a.updatedAt || 0).getTime()
      const timeB = new Date(b.updatedAt || 0).getTime()
      return timeA - timeB // Ascendente: más antiguo primero
    })
    
    console.log('📊 Updated leaderboard order:', copy.slice(0, 3))
    return copy
  })
}
