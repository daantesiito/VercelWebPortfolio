import { prisma } from './vercel-prisma'

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
      }
    } catch (error) {
      // Silent fail for follower count
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
    const userInfo = await getTwitchUserInfo(accessToken, twitchId)
    
    if (userInfo && userInfo.followers > 0) {
      const isStreamer = userInfo.followers >= 2000
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          followers: userInfo.followers,
          isStreamer,
          displayName: userInfo.displayName, // Update display name too
          updatedAt: new Date(),
        },
      })
      
      // User updated successfully
    } else {
      // Fallback: set default values and mark as potential streamer for manual review
      // Since we can't get follower count reliably, we'll set a placeholder
      await prisma.user.update({
        where: { id: userId },
        data: {
          followers: -1, // -1 indicates "unknown" - needs manual review
          isStreamer: false, // Default to false until manually verified
          updatedAt: new Date(),
        },
      })
      
      // User updated with placeholder values
    }
  } catch (error) {
    // Don't throw - this is not critical for login
  }
}
