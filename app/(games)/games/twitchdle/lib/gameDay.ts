// Implementación simple sin dependencias externas para evitar problemas de build
export const GAME_TZ_OFFSET = -3; // Buenos Aires es UTC-3

// "YYYY-MM-DD" del día lógico del juego en Buenos Aires
export function gameDateString(base: Date = new Date()): string {
  // Convertir a zona horaria de Buenos Aires (UTC-3)
  const buenosAiresTime = new Date(base.getTime() + (GAME_TZ_OFFSET * 60 * 60 * 1000));
  
  // Formatear como YYYY-MM-DD
  const year = buenosAiresTime.getUTCFullYear();
  const month = String(buenosAiresTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(buenosAiresTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Devuelve un Date "zoned" (simulado para Buenos Aires)
export function nowInGameTZ(base: Date = new Date()): Date {
  return new Date(base.getTime() + (GAME_TZ_OFFSET * 60 * 60 * 1000));
}

// Inicio del día (00:00) del juego en BA, en UTC
export function gameDayStartUtc(dateStr: string): Date {
  // Crear fecha en BA y convertir a UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  const baDate = new Date(year, month - 1, day, 0, 0, 0);
  // Convertir de BA a UTC (sumar 3 horas)
  return new Date(baDate.getTime() - (GAME_TZ_OFFSET * 60 * 60 * 1000));
}

// Por si necesitás comparar "hoy" con otra fecha "YYYY-MM-DD"
export function isSameGameDate(a: string, b: string): boolean {
  return a === b;
}
