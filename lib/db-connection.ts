// Utilidades para manejar conexiones de base de datos en Vercel
import { prisma, disconnectPrisma, createNewPrismaClient, checkPrismaConnection } from './prisma'
import { vercelConfig } from './vercel-config'

// Wrapper para operaciones de base de datos que maneja desconexión automática
export const withDatabase = async <T>(
  operation: () => Promise<T>,
  retries: number = vercelConfig.retryAttempts
): Promise<T> => {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Verificar conexión antes de la operación en Vercel
      if (process.env.VERCEL && attempt > 0) {
        const isConnected = await checkPrismaConnection()
        if (!isConnected) {
          console.log(`Attempt ${attempt + 1}: Recreating Prisma client due to connection issues`)
          // Crear nueva instancia si la conexión falla
          const newPrisma = createNewPrismaClient()
          // Reemplazar la instancia global temporalmente
          ;(globalThis as any).__tempPrisma = newPrisma
        }
      }
      
      const result = await operation()
      
      // En Vercel, desconectar después de la operación exitosa
      if (process.env.VERCEL) {
        setImmediate(() => {
          disconnectPrisma().catch(() => {
            // Ignorar errores de desconexión
          })
        })
      }
      
      return result
    } catch (error) {
      lastError = error as Error
      console.error(`Database operation attempt ${attempt + 1} failed:`, error)
      
      // Si es un error de conexión y tenemos reintentos, esperar un poco
      if (attempt < retries && process.env.VERCEL) {
        await new Promise(resolve => setTimeout(resolve, vercelConfig.retryDelay * (attempt + 1)))
        continue
      }
      
      // En caso de error final, intentar desconectar
      if (process.env.VERCEL) {
        setImmediate(() => {
          disconnectPrisma().catch(() => {
            // Ignorar errores de desconexión
          })
        })
      }
      
      throw error
    }
  }
  
  throw lastError || new Error('Database operation failed after all retries')
}

// Función específica para operaciones de NextAuth
export const withAuthDatabase = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  return withDatabase(operation, 3) // Más reintentos para operaciones críticas de auth
}
