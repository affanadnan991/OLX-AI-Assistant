import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const leadCreateSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().optional(),
  productId: z.string(),
  source: z.enum(['OLX', 'WHATSAPP', 'DIRECT', 'OTHER']).default('OLX'),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST']).default('NEW'),
  temperature: z.enum(['HOT', 'WARM', 'COLD', 'SPAM']).default('COLD'),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const temperature = searchParams.get('temperature')

    const where: any = {}
    if (status) where.status = status
    if (temperature) where.temperature = temperature

    const leads = await prisma.lead.findMany({
      where,
      include: {
        customer: true,
        product: true,
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(leads)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve leads' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = leadCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })
    }

    const { customerId, customerName, customerPhone, productId, source, status, temperature, notes } = parsed.data

    let finalCustomerId = customerId

    // If no customer ID is passed, create or find customer
    if (!finalCustomerId) {
      if (customerPhone) {
        const existingCustomer = await prisma.customer.findFirst({
          where: { phone: customerPhone }
        })
        if (existingCustomer) {
          finalCustomerId = existingCustomer.id
        }
      }

      if (!finalCustomerId) {
        const newCustomer = await prisma.customer.create({
          data: {
            name: customerName || 'Anonymous OLX Buyer',
            phone: customerPhone,
            platform: source,
          }
        })
        finalCustomerId = newCustomer.id
      }
    }

    const lead = await prisma.lead.create({
      data: {
        customerId: finalCustomerId,
        productId,
        source,
        status,
        temperature,
        notes,
      },
      include: {
        customer: true,
        product: true
      }
    })

    // Auto-create initial conversation for the lead
    await prisma.conversation.create({
      data: {
        leadId: lead.id,
        customerId: finalCustomerId,
        channel: source === 'WHATSAPP' ? 'WHATSAPP' : 'OLX_CHAT',
        status: 'ACTIVE'
      }
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}
