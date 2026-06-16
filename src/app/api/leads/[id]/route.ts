import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const leadUpdateSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
  temperature: z.enum(['HOT', 'WARM', 'COLD', 'SPAM']).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  currentScore: z.number().int().min(0).max(100).optional()
})

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        product: true,
        scoreHistory: {
          orderBy: { createdAt: 'desc' }
        },
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve lead details' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const body = await req.json()
    const parsed = leadUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })
    }

    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        customer: true,
        product: true
      }
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}
