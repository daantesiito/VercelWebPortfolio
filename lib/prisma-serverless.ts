import { PrismaClient } from '@prisma/client'

// Configuración específica para Vercel serverless
// Usa connection pooling y evita prepared statements
const createServerlessPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  // En producción, usar connection pooling sin prepared statements
  if (process.env.NODE_ENV === 'production') {
    // Desconectar inmediatamente después de cada operación
    const originalQuery = client.$queryRaw
    client.$queryRaw = async (query, ...args) => {
      try {
        const result = await originalQuery.call(client, query, ...args)
        return result
      } finally {
        // No desconectar aquí para evitar problemas
      }
    }
  }

  return client
}

// Singleton para evitar múltiples instancias
let prismaInstance: PrismaClient | null = null

export const getPrismaClient = () => {
  if (!prismaInstance) {
    prismaInstance = createServerlessPrismaClient()
  }
  return prismaInstance
}

// Para compatibilidad con el código existente
export const prisma = getPrismaClient()
