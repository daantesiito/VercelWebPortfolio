import { NextAuthOptions } from 'next-auth'
import TwitchProvider from 'next-auth/providers/twitch'
import { prisma } from './prisma'

// Helpers para Twitch API
const TW_CLIENT_ID = process.env.TWITCH_CLIENT_ID!
const TW_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET!

// App access token para fallback (/users/follows?to_id=)
async function getAppAccessToken(): Promise<string> {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TW_CLIENT_ID,
      client_secret: TW_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`App token error ${res.status}`)
  const json = await res.json()
  return json.access_token as string
}

// 1) Preferido: channels/followers con **user access token** + scope moderator:read:followers
async function getFollowersViaChannels(userAccessToken: string, broadcasterId: string): Promise<number> {
  const url = `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}&first=1`
  const res = await fetch(url, {
    headers: {
      'Client-Id': TW_CLIENT_ID,
      'Authorization': `Bearer ${userAccessToken}`,
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`channels/followers ${res.status}`)
  }
  const data = await res.json()
  const total = typeof data?.total === 'number' ? data.total : 0
  return total
}

// 2) Fallback: users/follows con **app access token**
async function getFollowersViaUsersFollows(broadcasterId: string): Promise<number> {
  const appToken = await getAppAccessToken()
  const url = `https://api.twitch.tv/helix/users/follows?to_id=${broadcasterId}&first=1`
  const res = await fetch(url, {
    headers: {
      'Client-Id': TW_CLIENT_ID,
      'Authorization': `Bearer ${appToken}`,
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`users/follows ${res.status}`)
  const data = await res.json()
  return typeof data?.total === 'number' ? data.total : 0
}

// Orquestador: intenta channels/followers con user token; si falla, usa users/follows (app token)
async function resolveFollowersCount({
  broadcasterId,
  userAccessToken,
}: {
  broadcasterId: string
  userAccessToken?: string | null
}): Promise<number> {
  // 1) si tenemos user token, intentamos channels/followers
  if (userAccessToken) {
    try {
      const total = await getFollowersViaChannels(userAccessToken, broadcasterId)
      if (Number.isFinite(total) && total >= 0) return total
    } catch (e) {
      // cae al fallback
    }
  }
  // 2) fallback robusto
  try {
    return await getFollowersViaUsersFollows(broadcasterId)
  } catch (e) {
    console.warn('followers fallback failed:', e)
    return 0
  }
}

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
      // primer login: guardar tokens de usuario
      if (account?.provider === 'twitch') {
        token.twitchAccessToken = account.access_token ?? token.twitchAccessToken
        token.twitchRefreshToken = account.refresh_token ?? token.twitchRefreshToken
        token.twitchId = account.providerAccountId
        token.twitchLogin = (profile as any)?.preferred_username ?? token.twitchLogin
        token.name = (profile as any)?.preferred_username ?? token.name
        token.picture = (profile as any)?.picture ?? token.picture
      }

      // throttling: refrescar followers máx cada 6h (evita rate limit)
      const now = Date.now()
      const nextAllowed = (token.followersCheckedAt as number | undefined) ?? 0
      const shouldRefresh = now - nextAllowed > 6 * 60 * 60 * 1000

      if (token.twitchId && shouldRefresh) {
        try {
          const followers = await resolveFollowersCount({
            broadcasterId: String(token.twitchId),
            userAccessToken: String(token.twitchAccessToken ?? ''),
          })

          const isStreamer = followers >= 2000

          // Upsert en BD
          const user = await prisma.user.upsert({
            where: { id: String(token.twitchId) },
            update: {
              twitchLogin: String(token.twitchLogin ?? ''),
              displayName: String(token.name ?? token.twitchLogin ?? ''),
              avatarUrl: String(token.picture ?? ''),
              followers,
              isStreamer,
              updatedAt: new Date(),
            },
            create: {
              id: String(token.twitchId),
              name: String(token.name ?? token.twitchLogin ?? ''),
              twitchLogin: String(token.twitchLogin ?? ''),
              displayName: String(token.name ?? token.twitchLogin ?? ''),
              avatarUrl: String(token.picture ?? ''),
              followers,
              isStreamer,
            },
          })

          token.followers = user.followers ?? 0
          token.isStreamer = user.isStreamer ?? false
        } catch (e) {
          console.warn('upsert followers error:', e)
        } finally {
          token.followersCheckedAt = now
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        ;(session.user as any).twitchId = token.twitchId
        ;(session.user as any).twitchLogin = token.twitchLogin
        ;(session.user as any).followers = token.followers ?? 0
        ;(session.user as any).isStreamer = token.isStreamer ?? false
      }
      return session
    },
    // Opcional: al signIn refrescar followers inmediatamente
    async signIn({ account, profile }) {
      try {
        if (account?.provider === 'twitch' && profile) {
          const followers = await resolveFollowersCount({
            broadcasterId: String(account.providerAccountId),
            userAccessToken: account.access_token,
          })
          const isStreamer = followers >= 2000
          await prisma.user.upsert({
            where: { id: String(account.providerAccountId) },
            update: {
              twitchLogin: String((profile as any)?.preferred_username ?? ''),
              displayName: String((profile as any)?.preferred_username ?? ''),
              avatarUrl: String((profile as any)?.picture ?? ''),
              followers,
              isStreamer,
              updatedAt: new Date(),
            },
            create: {
              id: String(account.providerAccountId),
              name: String((profile as any)?.preferred_username ?? ''),
              twitchLogin: String((profile as any)?.preferred_username ?? ''),
              displayName: String((profile as any)?.preferred_username ?? ''),
              avatarUrl: String((profile as any)?.picture ?? ''),
              followers,
              isStreamer,
            },
          })
        }
      } catch (e) {
        console.warn('signIn followers error:', e)
        // no bloquear login
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
