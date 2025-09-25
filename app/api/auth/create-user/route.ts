import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { upsertUser } from '@/lib/database';
import { updateUserStreamerStatus } from '@/lib/twitch';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { twitchId, twitchLogin, displayName, avatarUrl } = await request.json();

    console.log('🔧 Creating/updating user:', {
      userId: session.user.id,
      twitchId,
      twitchLogin,
      displayName,
      avatarUrl
    });

    // Crear o actualizar usuario usando SQL directo
    const user = await upsertUser({
      id: session.user.id,
      name: displayName || session.user.name,
      email: session.user.email,
      image: avatarUrl || session.user.image,
      twitchId: twitchId,
      twitchLogin: twitchLogin,
      displayName: displayName,
      avatarUrl: avatarUrl,
    });

    console.log('✅ User created/updated successfully:', user.id);

    // Actualizar información de streamer en background
    if (twitchId) {
      updateUserStreamerStatus(session.user.id, '', twitchId)
        .catch(error => {
          console.error('Error updating streamer status:', error);
        });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        name: displayName || session.user.name,
        email: session.user.email,
        twitchId: twitchId,
        twitchLogin: twitchLogin,
        displayName: displayName,
        avatarUrl: avatarUrl,
        followers: 0,
        isStreamer: false,
      }
    });

  } catch (error) {
    console.error('❌ Error creating/updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
