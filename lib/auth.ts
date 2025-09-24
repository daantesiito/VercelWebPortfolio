import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import TwitchProvider from 'next-auth/providers/twitch'
import { prisma } from './prisma'
import { updateUserStreamerStatus } from './twitch'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authorization: { params: { scope: "user:read:email" } },
    }),
  ],
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
      console.log('signIn callback called:', { 
        userId: user.id, 
        provider: account?.provider, 
        hasProfile: !!profile,
        profileData: profile
      })
      
      if (account?.provider === 'twitch' && profile) {
        try {
          console.log('Updating User with Twitch data:', {
            userId: user.id,
            twitchId: profile.sub,
            twitchLogin: profile.preferred_username,
            displayName: profile.display_name
          })
          
          // Actualizar User directamente con datos de Twitch
          const result = await prisma.user.update({
            where: { id: user.id },
            data: {
              twitchId: profile.sub as string,
              twitchLogin: profile.preferred_username as string,
              displayName: profile.display_name || profile.preferred_username || user.name,
              avatarUrl: profile.profile_image_url || user.image,
              updatedAt: new Date(),
            },
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
