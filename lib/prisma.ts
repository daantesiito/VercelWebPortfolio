import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuración optimizada para Vercel/serverless
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// En Vercel, crear una nueva instancia para cada request para evitar prepared statements duplicados
export const prisma = process.env.VERCEL 
  ? createPrismaClient() 
  : (globalForPrisma.prisma ?? createPrismaClient())

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

// En Vercel, desconectar automáticamente después de un timeout
if (process.env.VERCEL) {
  // Desconectar después de 5 segundos para evitar prepared statements duplicados
  setTimeout(() => {
    disconnectPrisma().catch(() => {
      // Ignorar errores de desconexión en timeout
    })
  }, 5000)
}
