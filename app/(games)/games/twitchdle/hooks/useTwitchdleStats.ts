'use client';

import { useState, useEffect } from 'react'

type GuessDist = [number, number, number, number, number, number];

export type TwitchdleStats = {
  // totales
  totalGames: number;
  victories: number;
  successRate: number; // 0..100 redondeado
  // rachas
  currentStreak: number;
  maxStreak: number;
  // distribución de victorias por fila (1..6) => index 0..5
  winDistribution: GuessDist;
  // housekeeping
  lastGameDate?: string;   // "YYYY-MM-DD" del último juego procesado (para UI)
  lastWinDate?: string;    // "YYYY-MM-DD" del último día con WIN (para racha por días)
  lastGameWon?: boolean;
  // opcional: sirve para postGame sin fetch
  wordOfDay?: string;
  emojiGrid?: string;
};

const LS_KEY = 'twitchdle-stats';

export function loadStatsLS(): TwitchdleStats {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return blankStats();
    const obj = JSON.parse(raw) as TwitchdleStats;
    // saneo básico
    if (!Array.isArray(obj.winDistribution) || obj.winDistribution.length !== 6) {
      obj.winDistribution = [0,0,0,0,0,0];
    }
    return obj;
  } catch {
    return blankStats();
  }
}

export function saveStatsLS(stats: TwitchdleStats) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(stats));
    //console.log('💾 Stats saved to localStorage:', stats);
  } catch (error) {
    //console.warn('⚠️ Could not save stats to localStorage:', error);
  }
}

function blankStats(): TwitchdleStats {
  return {
    totalGames: 0,
    victories: 0,
    successRate: 0,
    currentStreak: 0,
    maxStreak: 0,
    winDistribution: [0,0,0,0,0,0],
    lastGameDate: undefined,
    lastWinDate: undefined,
    lastGameWon: undefined,
    wordOfDay: undefined,
    emojiGrid: undefined,
  };
}

/**
 * Regla de racha por días:
 * - Si win y lastWinDate existe:
 *   - Si gameDate == lastWinDate => racha NO sube (mismo día)
 *   - Si gameDate es el día siguiente a lastWinDate => racha++
 *   - Si gameDate saltó días => racha = 1 (nuevo día con win reinicia)
 * - Si win sin lastWinDate => racha = 1
 * - Si lose => racha = 0
 */
function daysDiff(a: string, b: string): number {
  // a, b en formato YYYY-MM-DD
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  const ms = da.getTime() - db.getTime();
  return Math.round(ms / 86400000);
}

export type GameResultPayload = {
  gameDate: string;   // "YYYY-MM-DD" en TZ del juego
  won: boolean;
  attempts: number;   // 1..6 si win; si lose, ignorado para dist
  wordOfDay: string;  // para postGame y trazabilidad local
  emojiGrid?: string; // opcional
};

export function applyGameResult(prev: TwitchdleStats, p: GameResultPayload): TwitchdleStats {
  const next: TwitchdleStats = { ...prev };

  //console.log('📊 Applying game result:', { 
    //gameDate: p.gameDate, 
    //won: p.won, 
    //attempts: p.attempts,
    //prevStats: {
      //totalGames: prev.totalGames,
      //victories: prev.victories,
      //currentStreak: prev.currentStreak,
      //maxStreak: prev.maxStreak,
      //lastWinDate: prev.lastWinDate
    //}
  //});

  // 1) totales
  next.totalGames = (prev.totalGames ?? 0) + 1;
  if (p.won) {
    next.victories = (prev.victories ?? 0) + 1;
  }
  next.successRate = next.totalGames > 0 ? Math.round((next.victories / next.totalGames) * 100) : 0;

  // 2) racha por días
  if (p.won) {
    if (prev.lastWinDate) {
      if (p.gameDate === prev.lastWinDate) {
        // mismo día: NO sumamos a racha (pero sí a totales y dist)
        next.currentStreak = prev.currentStreak;
        //console.log('📊 Same day win - streak unchanged:', next.currentStreak);
      } else {
        const diff = daysDiff(p.gameDate, prev.lastWinDate);
        if (diff === 1) {
          next.currentStreak = prev.currentStreak + 1;
          //console.log('📊 Consecutive day win - streak increased:', next.currentStreak);
        } else {
          // saltó días: racha se resetea y este win arranca en 1
          next.currentStreak = 1;
          //console.log('📊 Skipped days - streak reset to 1');
        }
        next.lastWinDate = p.gameDate;
      }
    } else {
      // primer win
      next.currentStreak = 1;
      next.lastWinDate = p.gameDate;
      //console.log('📊 First win - streak set to 1');
    }
  } else {
    // pierde => racha a 0, no tocamos lastWinDate
    next.currentStreak = 0;
    //console.log('📊 Loss - streak reset to 0');
  }

  // 3) mejor racha
  if (p.won) {
    const prevMaxStreak = prev.maxStreak ?? 0;
    const newMaxStreak = Math.max(prevMaxStreak, next.currentStreak ?? 0);
    next.maxStreak = newMaxStreak;
    //console.log('📊 Max streak calculation:', {
      //prevMaxStreak,
      //currentStreak: next.currentStreak,
      //newMaxStreak,
      //gameDate: p.gameDate,
      //lastWinDate: prev.lastWinDate
    //});
  } else {
    next.maxStreak = prev.maxStreak ?? 0;
  }

  // 4) distribución (solo win)
  if (p.won) {
    const idx = Math.max(1, Math.min(6, p.attempts)) - 1;
    const dist = [...(prev.winDistribution ?? [0,0,0,0,0,0])] as GuessDist;
    dist[idx] = (dist[idx] ?? 0) + 1;
    next.winDistribution = dist;
    //console.log(`📊 Win distribution updated - index ${idx}:`, dist[idx]);
  } else {
    next.winDistribution = prev.winDistribution ?? [0,0,0,0,0,0];
  }

  // 5) housekeeping para postGame
  next.lastGameDate = p.gameDate;
  next.lastGameWon = p.won;
  next.wordOfDay = p.wordOfDay;
  next.emojiGrid = p.emojiGrid ?? prev.emojiGrid;

  //console.log('📊 Final stats:', {
    //totalGames: next.totalGames,
    //victories: next.victories,
    //successRate: next.successRate,
    //currentStreak: next.currentStreak,
    //maxStreak: next.maxStreak,
    //winDistribution: next.winDistribution
  //});

  return next;
}

// Función para generar emoji grid
function generateEmojiGrid(committedBoard: any[][], attempts: number): string {
  let grid = ''
  // Solo mostrar filas que realmente tienen contenido evaluado
  for (let row = 0; row < attempts; row++) {
    if (committedBoard[row]) {
      for (let col = 0; col < committedBoard[row].length; col++) {
        const cell = committedBoard[row][col]
        if (cell && cell.status) {
          if (cell.status === 'correct') {
            grid += '🟩'
          } else if (cell.status === 'present') {
            grid += '🟨'
          } else {
            grid += '⬛'
          }
        } else {
          grid += '⬛'
        }
      }
      if (row < attempts - 1) {
        grid += '\n'
      }
    }
  }
  return grid
}

// Hook para usar las estadísticas
export const useTwitchdleStats = () => {
  const [stats, setStats] = useState<TwitchdleStats>(blankStats())
  
  useEffect(() => {
    // Cargar estadísticas al montar el componente
    const loadedStats = loadStatsLS()
    if (loadedStats) {
      setStats(loadedStats)
    }
  }, [])
  
  const updateStats = (attempts: number, won: boolean, emojiGrid: string, gameDate: string, wordOfDay: string) => {
    //console.log('📊 Updating stats:', { attempts, won, gameDate, wordOfDay })
    
    const payload: GameResultPayload = {
      gameDate,
      won,
      attempts,
      wordOfDay,
      emojiGrid
    }
    
    const newStats = applyGameResult(stats, payload)
    setStats(newStats)
    saveStatsLS(newStats)
    
    return newStats
  }
  
  const resetStats = () => {
    const blank = blankStats()
    setStats(blank)
    saveStatsLS(blank)
  }
  
  return {
    stats,
    updateStats,
    resetStats,
    loadStats: () => {
      const loadedStats = loadStatsLS()
      if (loadedStats) {
        setStats(loadedStats)
      }
    }
  }
}

// Función para sincronizar con el servidor
export async function syncStatsToServer(stats: TwitchdleStats & { userId: string; gameDate: string; processedAt: string }) {
  try {
    //console.log('🔄 Syncing stats to server:', { userId: stats.userId, gameDate: stats.gameDate })
    const response = await fetch('/api/twitchdle/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const result = await response.json()
    //console.log('✅ Stats synced to server:', result)
    return result
  } catch (error) {
    console.error('❌ Error syncing stats to server:', error)
    // No bloquear la UI si falla
  }
}

// Exportar funciones para uso directo
export { generateEmojiGrid }

// ===== FUNCIONES DE DEBUG PARA PROBAR RACHA =====

// Función de debug para simular fechas diferentes
export function getDebugDate(offsetDays: number = 0): string {
  const today = new Date();
  const debugDate = new Date(today);
  debugDate.setDate(today.getDate() + offsetDays);
  return debugDate.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Función global para debug desde la consola
if (typeof window !== 'undefined') {
  // Función para simular un juego ganado con fecha específica
  (window as any).simulateWin = (offsetDays: number, attempts: number = 3) => {
    //console.log('🎯 DEBUG: Simulating win with date offset:', offsetDays, 'attempts:', attempts);
    
    const debugDate = getDebugDate(offsetDays);
    const stats = loadStatsLS();
    
    //console.log('📊 Current stats before simulation:', {
      //totalGames: stats.totalGames,
      //victories: stats.victories,
      //currentStreak: stats.currentStreak,
      //maxStreak: stats.maxStreak,
      //lastWinDate: stats.lastWinDate,
      //lastGameDate: stats.lastGameDate
    //});
    
    // Simular un juego ganado
    const payload = {
      gameDate: debugDate,
      won: true,
      attempts: attempts,
      wordOfDay: 'DEBUG',
      emojiGrid: '🟩🟩🟩🟩🟩'
    };
    
    const newStats = applyGameResult(stats, payload);
    saveStatsLS(newStats);
    
    //console.log('📊 New stats after simulation:', {
      //totalGames: newStats.totalGames,
      //victories: newStats.victories,
      //currentStreak: newStats.currentStreak,
      //maxStreak: newStats.maxStreak,
      //lastWinDate: newStats.lastWinDate,
      //lastGameDate: newStats.lastGameDate
    //});
    
    //console.log('🎯 DEBUG: Reload the page to see updated stats');
    return newStats;
  };
  
  // Función para simular un juego perdido
  (window as any).simulateLoss = (offsetDays: number) => {
    //console.log('🎯 DEBUG: Simulating loss with date offset:', offsetDays);
    
    const debugDate = getDebugDate(offsetDays);
    const stats = loadStatsLS();
    
    //console.log('📊 Current stats before simulation:', {
      //totalGames: stats.totalGames,
      //victories: stats.victories,
      //currentStreak: stats.currentStreak,
      //maxStreak: stats.maxStreak,
      //lastWinDate: stats.lastWinDate,
      //lastGameDate: stats.lastGameDate
    //});
    
    // Simular un juego perdido
    const payload = {
      gameDate: debugDate,
      won: false,
      attempts: 6,
      wordOfDay: 'DEBUG',
      emojiGrid: '⬛⬛⬛⬛⬛'
    };
    
    const newStats = applyGameResult(stats, payload);
    saveStatsLS(newStats);
    
    //console.log('📊 New stats after simulation:', {
      //totalGames: newStats.totalGames,
      //victories: newStats.victories,
      //currentStreak: newStats.currentStreak,
      //maxStreak: newStats.maxStreak,
      //lastWinDate: newStats.lastWinDate,
      //lastGameDate: newStats.lastGameDate
    //});
    
    //console.log('🎯 DEBUG: Reload the page to see updated stats');
    return newStats;
  };
  
  // Función para ver las estadísticas actuales
  (window as any).showStats = () => {
    const stats = loadStatsLS();
    //console.log('📊 Current stats:', stats);
    return stats;
  };
  
  // Función para resetear las estadísticas
  (window as any).resetStats = () => {
    const blank = blankStats();
    saveStatsLS(blank);
    //console.log('🔄 Stats reset to blank');
    return blank;
  };
  
  // Función para simular una secuencia de días
  (window as any).simulateStreak = (days: number) => {
    //console.log(`🎯 DEBUG: Simulating ${days} consecutive wins`);
    
    for (let i = 0; i < days; i++) {
      //console.log(`\n--- Day ${i + 1} ---`);
      (window as any).simulateWin(i, Math.floor(Math.random() * 6) + 1);
    }
    
    const finalStats = loadStatsLS();
    //console.log('\n🏆 Final streak simulation results:', {
      //totalGames: finalStats.totalGames,
      //victories: finalStats.victories,
      //currentStreak: finalStats.currentStreak,
      //maxStreak: finalStats.maxStreak
    //});
    
    return finalStats;
  };
  
  // Función para sincronizar el leaderboard con el maxStreak actual
  (window as any).syncLeaderboard = async () => {
    const stats = loadStatsLS();
    //console.log('🔄 Syncing leaderboard with current maxStreak:', stats.maxStreak);
    
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'twitchdle',
          value: stats.maxStreak
        })
      });
      
      if (response.ok) {
        //console.log('✅ Leaderboard synced successfully');
      } else {
        console.error('❌ Failed to sync leaderboard:', response.status);
      }
    } catch (error) {
      console.error('❌ Error syncing leaderboard:', error);
    }
  };
  
  // Mostrar ayuda automáticamente
  //console.log('🎯 Twitchdle Debug Tools loaded! Type debugHelp() for commands');
}