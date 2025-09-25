import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario esté autenticado
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { twitchLogin, followers } = await request.json()

    if (!twitchLogin || typeof followers !== 'number') {
      return NextResponse.json({ 
        error: 'twitchLogin and followers are required' 
      }, { status: 400 })
    }

    // Actualizar el usuario
    const updatedUser = await prisma.user.update({
      where: { twitchLogin },
      data: {
        followers,
        isStreamer: followers >= 2000,
        updatedAt: new Date(),
      },
    })

    console.log(`✅ Updated followers for ${twitchLogin}: ${followers} (isStreamer: ${followers >= 2000})`)

    return NextResponse.json({
      success: true,
      user: {
        twitchLogin: updatedUser.twitchLogin,
        displayName: updatedUser.displayName,
        followers: updatedUser.followers,
        isStreamer: updatedUser.isStreamer,
      }
    })

  } catch (error) {
    console.error('Error updating followers:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
