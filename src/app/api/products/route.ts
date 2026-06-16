import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const productCreateSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  price: z.number().int().positive(),
  minAcceptablePrice: z.number().int().positive().optional(),
  batteryHealth: z.number().int().min(0).max(100).optional(),
  condition: z.string().optional(),
  ptaApproved: z.boolean().default(false),
  location: z.string().optional(),
  deliveryAvailable: z.boolean().default(false),
  exchangePossible: z.boolean().default(false),
  warranty: z.string().optional(),
  specifications: z.record(z.any()).default({}),
  images: z.array(z.string()).default([]),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const brand = searchParams.get('brand')
    const status = searchParams.get('status')
    
    const where: any = {}
    if (brand) where.brand = { equals: brand, mode: 'insensitive' }
    if (status) where.status = status

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve products' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = productCreateSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })
    }

    const { images, ...rest } = parsed.data

    const product = await prisma.product.create({
      data: {
        ...rest,
        images: JSON.stringify(images)
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
