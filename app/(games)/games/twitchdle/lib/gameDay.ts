import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { format, startOfDay } from 'date-fns';

export const GAME_TZ = 'America/Argentina/Buenos_Aires';

// Devuelve un Date "zoned" (ojo: sigue siendo Date, pero pensado en TZ elegida)
export function nowInGameTZ(base: Date = new Date()): Date {
  return utcToZonedTime(base, GAME_TZ);
}

// "YYYY-MM-DD" del día lógico del juego en BA
export function gameDateString(base: Date = new Date()): string {
  const zoned = nowInGameTZ(base);
  return format(zoned, 'yyyy-MM-dd'); // format respeta el "zoned"
}

// Inicio del día (00:00) del juego en BA, en UTC (útil para DB DateTime si alguna vez lo usás)
export function gameDayStartUtc(dateStr: string): Date {
  // convierte "YYYY-MM-DD 00:00" BA -> UTC
  const d = zonedTimeToUtc(`${dateStr}T00:00:00`, GAME_TZ);
  return d;
}

// Por si necesitás comparar "hoy" con otra fecha "YYYY-MM-DD"
export function isSameGameDate(a: string, b: string): boolean {
  return a === b;
}
