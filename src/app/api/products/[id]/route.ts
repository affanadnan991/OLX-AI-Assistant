import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const productUpdateSchema = z.object({
  name: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  price: z.number().int().positive().optional(),
  minAcceptablePrice: z.number().int().positive().optional(),
  batteryHealth: z.number().int().min(0).max(100).optional(),
  condition: z.string().optional(),
  ptaApproved: z.boolean().optional(),
  location: z.string().optional(),
  deliveryAvailable: z.boolean().optional(),
  exchangePossible: z.boolean().optional(),
  warranty: z.string().optional(),
  specifications: z.record(z.any()).optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'RESERVED', 'DRAFT']).optional()
})

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id }
    })
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve product' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const body = await req.json()
    const parsed = productUpdateSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })
    }

    const { images, ...rest } = parsed.data
    const updateData: any = { ...rest }
    if (images) {
      updateData.images = JSON.stringify(images)
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await prisma.product.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ success: true, message: 'Product deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
