import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import TwitchProvider from 'next-auth/providers/twitch'
import { prisma } from './prisma'
import { updateUserStreamerStatus } from './twitch'

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
      if (account && profile) {
        token.twitchId = profile.sub
        token.twitchLogin = profile.preferred_username
      }
      return token
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      if (token.twitchId) {
        session.user.twitchId = token.twitchId as string
      }
      if (token.twitchLogin) {
        session.user.twitchLogin = token.twitchLogin as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      
      if (account?.provider === 'twitch' && profile) {
        
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
