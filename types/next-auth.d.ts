import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      twitchId?: string
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }

  interface Profile {
    sub: string
    preferred_username: string
    display_name: string
    profile_image_url: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string
    twitchId?: string
  }
}
