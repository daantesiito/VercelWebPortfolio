import { prisma } from './prisma'

// Function to get Twitch user info including follower count
export async function getTwitchUserInfo(accessToken: string, twitchId: string): Promise<{ followers: number; displayName: string } | null> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID
    if (!clientId) {
      return null
    }

    // Get user details
    const userResponse = await fetch(`https://api.twitch.tv/helix/users?id=${twitchId}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      return null
    }

    const userData = await userResponse.json()
    const user = userData.data[0]

    if (!user) {
      return null
    }

    // Try to get follower count using the /channels/followers endpoint
    // This endpoint requires the user to be the broadcaster or have moderator access
    let followers = 0
    try {
      const followersResponse = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${twitchId}`, {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (followersResponse.ok) {
        const followersData = await followersResponse.json()
        followers = followersData.total || 0
      } else {
        
        // Fallback: try to get basic channel info
        try {
          const channelResponse = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${twitchId}`, {
            headers: {
              'Client-ID': clientId,
              'Authorization': `Bearer ${accessToken}`,
            },
          })
          
          if (channelResponse.ok) {
            const channelData = await channelResponse.json()
            const channel = channelData.data[0]
            if (channel) {
              // Unfortunately, the channel endpoint doesn't include follower count
              // But we can at least get the display name
            }
          }
        } catch (channelError) {
        }
      }
    } catch (error) {
    }

    return {
      followers,
      displayName: user.display_name || user.login
    }
  } catch (error) {
    return null
  }
}

export async function updateUserStreamerStatus(userId: string, accessToken: string, twitchId: string): Promise<void> {
  try {
    // Verificar si el usuario ya tiene followers actualizados recientemente
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { followers: true, updatedAt: true }
    })
    
    // Si el usuario ya tiene followers y fue actualizado en las últimas 24 horas, no actualizar
    if (existingUser && existingUser.followers && existingUser.followers > 0 && existingUser.updatedAt) {
      const hoursSinceUpdate = (Date.now() - existingUser.updatedAt.getTime()) / (1000 * 60 * 60)
      if (hoursSinceUpdate < 24) {
        return
      }
    }
    
    const userInfo = await getTwitchUserInfo(accessToken, twitchId)
    
    if (userInfo && userInfo.followers > 0) {
      const isStreamer = userInfo.followers >= 2000
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          followers: userInfo.followers,
          isStreamer,
          displayName: userInfo.displayName,
          updatedAt: new Date(),
        },
      })
      
    } else {
    }
  } catch (error) {
    console.log('Error updating streamer status:', error)
    // Don't throw - this is not critical for login
  }
}
