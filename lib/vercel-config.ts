// Configuración específica para Vercel
export const vercelConfig = {
  // Configuración de timeouts para operaciones de base de datos
  databaseTimeout: 10000, // 10 segundos
  retryAttempts: 3,
  retryDelay: 1000, // 1 segundo
  
  // Configuración de conexión
  connectionPool: {
    min: 1,
    max: 1, // En serverless, mantener solo 1 conexión
  },
  
  // Configuración de logging
  enableDetailedLogs: process.env.NODE_ENV === 'development',
  
  // Configuración de Prisma
  prisma: {
    // Configuración específica para Vercel
    logLevel: process.env.NODE_ENV === 'development' ? 'query' : 'error',
    // Configuración de conexión
    connectionTimeout: 5000,
    queryTimeout: 10000,
  }
}

// Función para verificar si estamos en Vercel
export const isVercel = () => {
  return process.env.VERCEL === '1' || process.env.VERCEL_ENV
}

// Función para obtener configuración de base de datos
export const getDatabaseConfig = () => {
  if (isVercel()) {
    return {
      url: process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_URL,
      // Configuración específica para Vercel
      ssl: true,
      connectionLimit: 1,
    }
  }
  
  return {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  }
}
