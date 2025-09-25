// Utilidades para manejar conexiones de base de datos en Vercel
import { prisma, disconnectPrisma } from './prisma'

// Wrapper para operaciones de base de datos que maneja desconexión automática
export const withDatabase = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  try {
    const result = await operation()
    
    // En Vercel, desconectar después de la operación
    if (process.env.VERCEL) {
      // Usar setImmediate para no bloquear la respuesta
      setImmediate(() => {
        disconnectPrisma().catch(() => {
          // Ignorar errores de desconexión
        })
      })
    }
    
    return result
  } catch (error) {
    // En caso de error, también intentar desconectar
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

// Función específica para operaciones de NextAuth
export const withAuthDatabase = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  return withDatabase(operation)
}
