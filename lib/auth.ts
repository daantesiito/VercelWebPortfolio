import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import TwitchProvider from 'next-auth/providers/twitch'
import { prisma } from './prisma'
import { updateUserStreamerStatus } from './twitch'

// NextAuth Configuration

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authorization: { params: { scope: "openid user:read:email moderator:read:followers" } },
      profile: (profile: any) => ({
        id: profile.sub, // OIDC subject
        name: profile.preferred_username ?? profile.name ?? null,
        email: profile.email ?? null,
        image: profile.picture ?? null,
      }),
    }),
  ],
  debug: false, // Debug disabled for production
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.twitchId = profile.sub
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
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'twitch' && profile) {
        try {
          // Actualizar User directamente con datos de Twitch
          await prisma.user.update({
            where: { id: user.id },
            data: {
              twitchId: profile.sub as string,
              twitchLogin: profile.preferred_username as string,
              displayName: profile.display_name || profile.preferred_username || user.name,
              avatarUrl: profile.profile_image_url || user.image,
              updatedAt: new Date(),
            },
          })
          
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
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
