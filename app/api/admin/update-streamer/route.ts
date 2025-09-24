import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateStreamerSchema = z.object({
  twitchLogin: z.string().min(1),
  followers: z.number().int().min(0),
  isStreamer: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Simple admin check - you can make this more sophisticated
    if (!session?.user?.email || !session.user.email.includes('dantepuddu')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { twitchLogin, followers, isStreamer } = UpdateStreamerSchema.parse(body)

    // Auto-determine isStreamer if not provided
    const shouldBeStreamer = isStreamer !== undefined ? isStreamer : followers >= 2000

    const updatedUser = await prisma.user.update({
      where: { twitchLogin },
      data: {
        followers,
        isStreamer: shouldBeStreamer,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        twitchLogin: updatedUser.twitchLogin,
        displayName: updatedUser.displayName,
        followers: updatedUser.followers,
        isStreamer: updatedUser.isStreamer,
      }
    })
  } catch (error) {
    console.error('Error updating streamer status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !session.user.email.includes('dantepuddu')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const users = await prisma.user.findMany({
      where: {
        twitchLogin: { not: null },
        followers: { not: null },
      },
      select: {
        id: true,
        twitchLogin: true,
        displayName: true,
        followers: true,
        isStreamer: true,
        updatedAt: true,
      },
      orderBy: {
        followers: 'desc',
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

