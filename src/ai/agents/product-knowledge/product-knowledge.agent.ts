import { Product } from '@prisma/client'

export class ProductKnowledgeEngine {
  static formatProductContext(product: Product): string {
    const specs = product.specifications as Record<string, any> || {}
    const specLines = Object.entries(specs)
      .map(([key, val]) => `- ${key}: ${val}`)
      .join('\n')

    return `
=== PRODUCT REFERENCE (GROUND TRUTH) ===
Name: ${product.name}
Brand: ${product.brand}
Model: ${product.model}
Listed Price: PKR ${product.price.toLocaleString()}
Minimum Acceptable Price (Floor): PKR ${product.minAcceptablePrice ? product.minAcceptablePrice.toLocaleString() : 'N/A'}
Battery Health: ${product.batteryHealth ? `${product.batteryHealth}%` : 'N/A'}
Condition: ${product.condition || 'N/A'}
PTA Approved Status: ${product.ptaApproved ? 'PTA APPROVED' : 'NOT PTA APPROVED'}
Warranty: ${product.warranty || 'No warranty'}
Location: ${product.location || 'N/A'}
Delivery: ${product.deliveryAvailable ? 'Available' : 'Not available'}
Exchange: ${product.exchangePossible ? 'Possible' : 'Not possible'}

Technical Specifications:
${specLines || 'None listed'}
========================================
`.trim()
  }
}
