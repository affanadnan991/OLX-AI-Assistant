import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up database...')
  await prisma.aIDecision.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.followUp.deleteMany()
  await prisma.leadScoreHistory.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.product.deleteMany()
  await prisma.customer.deleteMany()

  console.log('Seeding products...')
  const iphone13 = await prisma.product.create({
    data: {
      name: 'iPhone 13 128GB Midnight',
      brand: 'Apple',
      model: 'iPhone 13',
      price: 155000,
      minAcceptablePrice: 145000,
      batteryHealth: 87,
      condition: '9/10 (Minor scratches on bezel)',
      ptaApproved: true,
      location: 'Gulshan-e-Iqbal, Karachi',
      deliveryAvailable: false,
      exchangePossible: true,
      warranty: 'Seller 7-day checking warranty',
      specifications: {
        storage: '128GB',
        color: 'Midnight Black',
        ram: '4GB',
        box: 'With original box & cable'
      },
      images: [
        'https://images.unsplash.com/photo-1632649635142-d40d9d40b493?q=80&w=600'
      ],
      status: 'ACTIVE'
    }
  })

  const iphone14Pro = await prisma.product.create({
    data: {
      name: 'iPhone 14 Pro Max 256GB Deep Purple',
      brand: 'Apple',
      model: 'iPhone 14 Pro Max',
      price: 290000,
      minAcceptablePrice: 275000,
      batteryHealth: 91,
      condition: 'Like New 10/10',
      ptaApproved: true,
      location: 'DHA Phase 6, Karachi',
      deliveryAvailable: true,
      exchangePossible: false,
      warranty: 'Official Apple warranty till Nov 2026',
      specifications: {
        storage: '256GB',
        color: 'Deep Purple',
        ram: '6GB',
        box: 'Box, cable, invoice'
      },
      images: [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600'
      ],
      status: 'ACTIVE'
    }
  })

  const s22Ultra = await prisma.product.create({
    data: {
      name: 'Samsung Galaxy S22 Ultra 12GB/256GB',
      brand: 'Samsung',
      model: 'Galaxy S22 Ultra',
      price: 175000,
      minAcceptablePrice: 160000,
      batteryHealth: 84,
      condition: '8.5/10 (Slight scuffs, stylus working perfectly)',
      ptaApproved: false,
      location: 'Saddar, Karachi',
      deliveryAvailable: true,
      exchangePossible: true,
      warranty: 'No warranty',
      specifications: {
        storage: '256GB',
        color: 'Phantom Black',
        ram: '12GB',
        box: 'Device and stylus only'
      },
      images: [
        'https://images.unsplash.com/photo-1644026360447-9759c25ffb6c?q=80&w=600'
      ],
      status: 'ACTIVE'
    }
  })

  console.log('Seeding customers, leads, and conversations...')

  // Lead 1: Negotiation on iPhone 13 (Urdu/Roman Urdu, High intent)
  const customer1 = await prisma.customer.create({
    data: {
      externalId: 'olx_usr_9921',
      name: 'Muhammad Affan',
      phone: '+923001234567',
      platform: 'OLX',
      behaviorProfile: {
        buyerType: 'price_negotiator',
        responsiveness: 'high',
        languagePreference: 'Roman Urdu'
      }
    }
  })

  const lead1 = await prisma.lead.create({
    data: {
      customerId: customer1.id,
      productId: iphone13.id,
      source: 'OLX',
      status: 'NEGOTIATING',
      temperature: 'HOT',
      currentScore: 80,
      tags: ['active_negotiation', 'karachi_buyer'],
      notes: 'Wants to meet today. Offering 140k but listed price is 155k. Minimum is 145k.'
    }
  })

  const conv1 = await prisma.conversation.create({
    data: {
      leadId: lead1.id,
      customerId: customer1.id,
      channel: 'OLX_CHAT',
      status: 'ACTIVE',
      summary: 'Buyer is bargaining on the iPhone 13. Offered 140k PKR and wants to close deal today.',
      messageCount: 3,
      lastMessageAt: new Date()
    }
  })

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        role: 'CUSTOMER',
        content: 'Assalam-o-Alaikum bhai, iPhone 13 available hai?',
        aiGenerated: false,
        approved: true,
        createdAt: new Date(Date.now() - 3600000 * 2)
      },
      {
        conversationId: conv1.id,
        role: 'SELLER',
        content: 'Walaikum-assalam. Ji bhai available hai. Bilkul fresh condition mein hai.',
        aiGenerated: false,
        approved: true,
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        conversationId: conv1.id,
        role: 'CUSTOMER',
        content: 'Bhai iski battery health 87 hai, thora price mein discount mil sakta hai? 140k final? Main aaj hi le loonga.',
        aiGenerated: false,
        approved: true,
        createdAt: new Date()
      }
    ]
  })

  // Lead 2: Question about S22 Ultra PTA status (Warm intent)
  const customer2 = await prisma.customer.create({
    data: {
      externalId: 'olx_usr_4401',
      name: 'Sarah Khan',
      phone: '+923129876543',
      platform: 'OLX',
      behaviorProfile: {
        buyerType: 'info_gatherer',
        responsiveness: 'medium',
        languagePreference: 'English'
      }
    }
  })

  const lead2 = await prisma.lead.create({
    data: {
      customerId: customer2.id,
      productId: s22Ultra.id,
      source: 'OLX',
      status: 'CONTACTED',
      temperature: 'WARM',
      currentScore: 55,
      tags: ['pta_query'],
      notes: 'Inquiring about PTA tax. Reluctant due to PTA-not-approved status.'
    }
  })

  const conv2 = await prisma.conversation.create({
    data: {
      leadId: lead2.id,
      customerId: customer2.id,
      channel: 'OLX_CHAT',
      status: 'ACTIVE',
      summary: 'Buyer asking if the device can be PTA approved and if price can be lowered for that.',
      messageCount: 2,
      lastMessageAt: new Date(Date.now() - 600000)
    }
  })

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv2.id,
        role: 'CUSTOMER',
        content: 'Hi, is this S22 Ultra available? How much tax will it cost to get PTA approved?',
        aiGenerated: false,
        approved: true,
        createdAt: new Date(Date.now() - 1200000)
      },
      {
        conversationId: conv2.id,
        role: 'SELLER',
        content: 'Hi, yes it is available. The PTA tax for this is around 80k-90k PKR. We have already priced it lower due to this.',
        aiGenerated: false,
        approved: true,
        createdAt: new Date(Date.now() - 600000)
      }
    ]
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
