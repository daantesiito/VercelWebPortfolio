import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Forzar Node.js runtime para Prisma
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
