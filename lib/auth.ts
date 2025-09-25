import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import TwitchProvider from 'next-auth/providers/twitch'
import { prisma, disconnectPrisma } from './prisma'
import { withAuthDatabase } from './db-connection'
import { updateUserStreamerStatus } from './twitch'

// Log de configuración de variables de entorno
console.log('🔧 NextAuth Configuration:', {
  hasClientId: !!process.env.TWITCH_CLIENT_ID,
  hasClientSecret: !!process.env.TWITCH_CLIENT_SECRET,
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  clientId: process.env.TWITCH_CLIENT_ID,
  nextAuthUrl: process.env.NEXTAUTH_URL
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authorization: { params: { scope: "openid user:read:email" } },
      profile: (profile: any) => ({
        id: profile.sub, // OIDC subject
        name: profile.preferred_username ?? profile.name ?? null,
        email: profile.email ?? null,
        image: profile.picture ?? null,
      }),
    }),
  ],
  debug: true, // Habilitar debug de NextAuth
  session: {
    strategy: 'jwt',
  },
  events: {
    // Desconectar Prisma después de operaciones críticas en producción
    async signIn({ user, account, profile }) {
      if (process.env.NODE_ENV === 'production') {
        // Desconectar después de un breve delay para permitir que termine la operación
        setTimeout(() => {
          disconnectPrisma().catch(console.error)
        }, 2000)
      }
    },
    async signOut() {
      if (process.env.NODE_ENV === 'production') {
        setTimeout(() => {
          disconnectPrisma().catch(console.error)
        }, 1000)
      }
    },
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      console.log('🎫 JWT callback called:', { 
        hasToken: !!token, 
        hasAccount: !!account, 
        hasProfile: !!profile,
        tokenSub: token?.sub,
        profileSub: profile?.sub
      })
      if (account && profile) {
        token.twitchId = profile.sub
        console.log('✅ JWT: Added twitchId to token:', profile.sub)
      }
      return token
    },
    async session({ session, token }) {
      console.log('👤 Session callback called:', { 
        hasSession: !!session, 
        hasToken: !!token,
        tokenSub: token?.sub,
        tokenTwitchId: token?.twitchId
      })
      if (token.sub) {
        session.user.id = token.sub
        console.log('✅ Session: Added user.id:', token.sub)
      }
      if (token.twitchId) {
        session.user.twitchId = token.twitchId as string
        console.log('✅ Session: Added twitchId:', token.twitchId)
      }
      return session
    },
    async signIn({ user, account, profile }) {
      console.log('🔐 signIn callback called:', { 
        userId: user.id, 
        provider: account?.provider, 
        hasProfile: !!profile,
        profileData: profile,
        accountData: account
      })
      
      if (account?.provider === 'twitch' && profile) {
        try {
          console.log('Updating User with Twitch data:', {
            userId: user.id,
            twitchId: profile.sub,
            twitchLogin: profile.preferred_username,
            displayName: profile.display_name
          })
          
          // Actualizar User directamente con datos de Twitch usando wrapper
          const result = await withAuthDatabase(async () => {
            return await prisma.user.update({
              where: { id: user.id },
              data: {
                twitchId: profile.sub as string,
                twitchLogin: profile.preferred_username as string,
                displayName: profile.display_name || profile.preferred_username || user.name,
                avatarUrl: profile.profile_image_url || user.image,
                updatedAt: new Date(),
              },
            })
          })
          
          console.log('User updated successfully with Twitch data:', result.id)
          
          // Actualizar información de streamer en background (no bloquear el login)
          if (account.access_token) {
            updateUserStreamerStatus(user.id, account.access_token, profile.sub as string)
              .catch(error => {
                console.error('Error updating streamer status:', error)
              })
          }
        } catch (error) {
          console.error('Error updating user with Twitch data:', error)
          // No retornar false aquí para no bloquear el login
        }
      } else {
        console.log('Not updating user - conditions not met:', {
          isTwitch: account?.provider === 'twitch',
          hasProfile: !!profile
        })
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
