import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        lead: {
          include: {
            product: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json(conversation)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve conversation details' }, { status: 500 })
  }
}
