import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { executeSalesPipeline } from '@/ai/pipeline/sales-pipeline'
import { z } from 'zod'

const messageCreateSchema = z.object({
  content: z.string().min(1),
  role: z.enum(['CUSTOMER', 'SELLER']),
  approved: z.boolean().optional().default(true),
  suggestedMessageId: z.string().optional() // If the seller is approving a previous AI suggestion
})

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const conversationId = params.id

  try {
    const body = await req.json()
    const parsed = messageCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })
    }

    const { content, role, approved, suggestedMessageId } = parsed.data

    // 1. Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // 2. If seller is approving a previous AI suggestion
    if (role === 'SELLER' && suggestedMessageId) {
      // Find the suggested message and mark it approved
      const suggestedMsg = await prisma.message.findUnique({
        where: { id: suggestedMessageId }
      })

      if (suggestedMsg && suggestedMsg.role === 'AI_SUGGESTED') {
        // Create actual seller message
        const sellerMsg = await prisma.message.create({
          data: {
            conversationId,
            role: 'SELLER',
            content,
            aiGenerated: true,
            approved: true
          }
        })

        // Delete the draft suggestion or update it to mark it clean
        await prisma.message.update({
          where: { id: suggestedMessageId },
          data: { approved: true } // Mark it approved
        })

        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageAt: new Date(),
            messageCount: { increment: 1 }
          }
        })

        return NextResponse.json({ message: sellerMsg, pipelineTriggered: false })
      }
    }

    // 3. For customer messages, write to db and trigger AI sales pipeline
    if (role === 'CUSTOMER') {
      // The sales pipeline handles creating the customer message, executing agents,
      // creating AI suggestions, updating lead score, and updating summaries.
      const pipelineResult = await executeSalesPipeline(conversationId, content)

      if (!pipelineResult) {
        return NextResponse.json({ error: 'Pipeline failed to execute' }, { status: 500 })
      }

      // Fetch the updated messages list
      const updatedMessages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 5
      })

      return NextResponse.json({
        success: true,
        pipelineTriggered: true,
        pipelineResult,
        latestMessages: updatedMessages
      })
    }

    // 4. Manual seller message (no pipeline trigger, just save it)
    const newMsg = await prisma.message.create({
      data: {
        conversationId,
        role: 'SELLER',
        content,
        aiGenerated: false,
        approved: true
      }
    })

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 1 }
      }
    })

    return NextResponse.json({ message: newMsg, pipelineTriggered: false })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
