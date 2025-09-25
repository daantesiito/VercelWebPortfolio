import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import TwitchProvider from 'next-auth/providers/twitch'
import { prisma } from './prisma'
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
  // Usar JWT en lugar de database sessions para serverless
  // adapter: PrismaAdapter(prisma),
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
        token.twitchLogin = profile.preferred_username
        console.log('✅ JWT: Added twitchId to token:', profile.sub)
        console.log('✅ JWT: Added twitchLogin to token:', profile.preferred_username)
      }
      return token
    },
    async session({ session, token }) {
      console.log('👤 Session callback called:', { 
        hasSession: !!session, 
        hasToken: !!token,
        tokenSub: token?.sub,
        tokenTwitchId: token?.twitchId,
        tokenTwitchLogin: token?.twitchLogin
      })
      if (token.sub) {
        session.user.id = token.sub
        console.log('✅ Session: Added user.id:', token.sub)
      }
      if (token.twitchId) {
        session.user.twitchId = token.twitchId as string
        console.log('✅ Session: Added twitchId:', token.twitchId)
      }
      if (token.twitchLogin) {
        session.user.twitchLogin = token.twitchLogin as string
        console.log('✅ Session: Added twitchLogin:', token.twitchLogin)
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
      
      // Con JWT, no necesitamos actualizar la base de datos aquí
      // Los datos se almacenan en el token JWT
      if (account?.provider === 'twitch' && profile) {
        console.log('Twitch login successful:', {
          twitchId: profile.sub,
          twitchLogin: profile.preferred_username,
          displayName: profile.display_name
        })
        
        // Actualizar información de streamer en background (no bloquear el login)
        if (account.access_token) {
          updateUserStreamerStatus(user.id, account.access_token, profile.sub as string)
            .catch(error => {
              console.error('Error updating streamer status:', error)
            })
        }
      }
      
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
