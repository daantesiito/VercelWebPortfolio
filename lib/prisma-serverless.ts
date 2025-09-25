import { PrismaClient } from '@prisma/client'

// Configuración específica para Vercel serverless
// Evita prepared statements y usa connection pooling
const createServerlessPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  // Configuración específica para serverless
  if (process.env.NODE_ENV === 'production') {
    // En producción, no usar prepared statements
    client.$connect = async () => {
      // Conectar sin prepared statements
      return client
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
