import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        customer: true,
        lead: {
          include: {
            product: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    return NextResponse.json(conversations)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve conversations' }, { status: 500 })
  }
}
export async function POST(req: NextRequest) {
  try {
    const { leadId, customerId, channel } = await req.json()
    if (!leadId || !customerId) {
      return NextResponse.json({ error: 'leadId and customerId are required' }, { status: 400 })
    }

    const conversation = await prisma.conversation.create({
      data: {
        leadId,
        customerId,
        channel: channel || 'OLX_CHAT',
        status: 'ACTIVE'
      }
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
