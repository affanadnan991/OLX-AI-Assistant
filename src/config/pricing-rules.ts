export const PRICING_RULES = {
  maxDiscountPercentage: 0.15, // Maximum 15% discount allowed off original listed price
  warningThresholdPercentage: 0.10, // Warn seller if discount exceeds 10%
  minIncrementPKR: 1000, // Minimum negotiation increment unit in PKR
  negotiationSteps: [
    { step: 1, discountFactor: 0.03, argumentUrgency: 'Market price is higher, but since you are buying today, can do a small discount.' },
    { step: 2, discountFactor: 0.06, argumentUrgency: 'I can match your interest if we deal near my location.' },
    { step: 3, discountFactor: 0.10, argumentUrgency: 'This is my final price. It has original box/accessories which add value.' }
  ]
} as const;
