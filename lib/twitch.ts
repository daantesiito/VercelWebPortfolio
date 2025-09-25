import { prisma } from './prisma-serverless'

// Function to get Twitch user info including follower count
export async function getTwitchUserInfo(accessToken: string, twitchId: string): Promise<{ followers: number; displayName: string } | null> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID
    if (!clientId) {
      console.log('TWITCH_CLIENT_ID not set')
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
      console.log('Failed to fetch Twitch user info:', userResponse.status)
      return null
    }

    const userData = await userResponse.json()
    const user = userData.data[0]

    if (!user) {
      console.log('No user data found')
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
        console.log(`Fetched follower count for ${user.display_name}: ${followers}`)
      } else {
        console.log('Failed to fetch follower count:', followersResponse.status, await followersResponse.text())
        
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
              console.log(`Got channel info for ${channel.broadcaster_name}`)
            }
          }
        } catch (channelError) {
          console.log('Error fetching channel info:', channelError)
        }
      }
    } catch (error) {
      console.log('Error fetching follower count:', error)
    }

    return {
      followers,
      displayName: user.display_name || user.login
    }
  } catch (error) {
    console.log('Error fetching Twitch user info:', error)
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
      
      console.log(`User ${userId} updated: followers=${userInfo.followers}, isStreamer=${isStreamer}`)
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
      
      console.log(`User ${userId} updated with placeholder values (follower count unavailable)`)
    }
  } catch (error) {
    console.log('Error updating streamer status:', error)
    // Don't throw - this is not critical for login
  }
}
