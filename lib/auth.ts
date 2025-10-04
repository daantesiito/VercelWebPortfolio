import { NextAuthOptions } from 'next-auth'
import TwitchProvider from 'next-auth/providers/twitch'

export const authOptions: NextAuthOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      authorization: { 
        params: { 
          scope: "openid user:read:email moderator:read:followers" 
        } 
      },
      profile: (profile: any) => ({
        id: profile.sub,
        name: profile.preferred_username ?? profile.name ?? null,
        email: profile.email ?? null,
        image: profile.picture ?? null,
      }),
    }),
  ],
  debug: true,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === 'twitch') {
        token.twitchId = account.providerAccountId
        token.twitchLogin = (profile as any)?.preferred_username
        token.twitchAccessToken = account.access_token
        token.twitchRefreshToken = account.refresh_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        ;(session.user as any).twitchId = token.twitchId
        ;(session.user as any).twitchLogin = token.twitchLogin
        ;(session.user as any).followers = 0
        ;(session.user as any).isStreamer = false
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
