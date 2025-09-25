import { prisma } from './prisma'

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

    // Try to get follower count using a public API approach
    // Since moderator:read:followers requires special permissions, we'll use a different approach
    let followers = 0
    try {
      console.log(`🔍 Attempting to get follower count for ${user.display_name} (ID: ${twitchId})`)
      
      // Try using the Helix API with just the client ID (no auth required for basic info)
      const publicResponse = await fetch(`https://api.twitch.tv/helix/users?id=${twitchId}`, {
        headers: {
          'Client-ID': clientId,
        },
      })

      console.log(`📊 Public API response status: ${publicResponse.status}`)
      
      if (publicResponse.ok) {
        const publicData = await publicResponse.json()
        const publicUser = publicData.data[0]
        
        if (publicUser) {
          // Unfortunately, the public API doesn't include follower count
          // We'll set a placeholder value and mark for manual review
          followers = -1 // -1 indicates "unknown" - needs manual review
          console.log(`⚠️ Follower count not available via public API for ${user.display_name}`)
        }
      } else {
        console.log(`❌ Public API failed: ${publicResponse.status}`)
        followers = -1
      }
    } catch (error) {
      console.log('Error fetching follower count:', error)
      followers = -1
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
