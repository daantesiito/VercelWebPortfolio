import { PrismaClient } from '@prisma/client'
import { vercelConfig, getDatabaseConfig } from './vercel-config'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuración optimizada para Vercel/serverless
const createPrismaClient = () => {
  const dbConfig = getDatabaseConfig()
  
  return new PrismaClient({
    log: vercelConfig.enableDetailedLogs ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: dbConfig.url,
      },
    },
  })
}

// Función para crear una nueva instancia de Prisma
export const createNewPrismaClient = () => {
  return createPrismaClient()
}

// En Vercel, siempre crear una nueva instancia para evitar problemas de conexión
export const prisma = process.env.VERCEL 
  ? createNewPrismaClient()
  : (globalForPrisma.prisma ?? createNewPrismaClient())

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  globalForPrisma.prisma = prisma
}

// Función para manejar desconexión limpia en serverless
export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error disconnecting Prisma:', error)
  }
}

// Función para verificar la conexión
export const checkPrismaConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Prisma connection check failed:', error)
    return false
  }
}
