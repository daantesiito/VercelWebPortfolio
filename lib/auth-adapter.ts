// Adaptador personalizado para NextAuth que maneja mejor los errores de conexión en Vercel
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma, createNewPrismaClient, checkPrismaConnection } from './prisma'

class VercelPrismaAdapter extends PrismaAdapter(prisma) {
  // Override getUserByEmail para manejar errores de conexión
  async getUserByEmail(email: string) {
    try {
      return await super.getUserByEmail(email)
    } catch (error) {
      console.error('getUserByEmail failed, attempting to reconnect:', error)
      
      if (process.env.VERCEL) {
        // Verificar conexión y recrear si es necesario
        const isConnected = await checkPrismaConnection()
        if (!isConnected) {
          console.log('Recreating Prisma client for getUserByEmail')
          const newPrisma = createNewPrismaClient()
          // Usar la nueva instancia temporalmente
          return await newPrisma.user.findUnique({
            where: { email }
          })
        }
      }
      
      throw error
    }
  }

  // Override getUserByAccount para manejar errores de conexión
  async getUserByAccount(providerAccountId: { provider: string; providerAccountId: string }) {
    try {
      return await super.getUserByAccount(providerAccountId)
    } catch (error) {
      console.error('getUserByAccount failed, attempting to reconnect:', error)
      
      if (process.env.VERCEL) {
        // Verificar conexión y recrear si es necesario
        const isConnected = await checkPrismaConnection()
        if (!isConnected) {
          console.log('Recreating Prisma client for getUserByAccount')
          const newPrisma = createNewPrismaClient()
          // Usar la nueva instancia temporalmente
          return await newPrisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: providerAccountId.provider,
                providerAccountId: providerAccountId.providerAccountId,
              },
            },
          }).then(account => {
            if (!account) return null
            return newPrisma.user.findUnique({
              where: { id: account.userId }
            })
          })
        }
      }
      
      throw error
    }
  }

  // Override createUser para manejar errores de conexión
  async createUser(user: any) {
    try {
      return await super.createUser(user)
    } catch (error) {
      console.error('createUser failed, attempting to reconnect:', error)
      
      if (process.env.VERCEL) {
        const isConnected = await checkPrismaConnection()
        if (!isConnected) {
          console.log('Recreating Prisma client for createUser')
          const newPrisma = createNewPrismaClient()
          return await newPrisma.user.create({
            data: user
          })
        }
      }
      
      throw error
    }
  }

  // Override updateUser para manejar errores de conexión
  async updateUser(user: any) {
    try {
      return await super.updateUser(user)
    } catch (error) {
      console.error('updateUser failed, attempting to reconnect:', error)
      
      if (process.env.VERCEL) {
        const isConnected = await checkPrismaConnection()
        if (!isConnected) {
          console.log('Recreating Prisma client for updateUser')
          const newPrisma = createNewPrismaClient()
          return await newPrisma.user.update({
            where: { id: user.id },
            data: user
          })
        }
      }
      
      throw error
    }
  }
}

export const vercelPrismaAdapter = new VercelPrismaAdapter()
