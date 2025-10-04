import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        followers: true,
        isStreamer: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        followers: user.followers,
        isStreamer: user.isStreamer,
      },
    })

  } catch (error) {
    console.error('Error getting streamer status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { followers, isStreamer } = await request.json()

    if (typeof followers !== 'number' || typeof isStreamer !== 'boolean') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        followers,
        isStreamer,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        followers: user.followers,
        isStreamer: user.isStreamer,
      },
    })

  } catch (error) {
    console.error('Error updating streamer status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
