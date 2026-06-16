import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Basic DB check
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'DOWN',
        database: 'DISCONNECTED',
        error: error instanceof Error ? error.message : 'Unknown database error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
