export const SCORING_SIGNALS = {
  // Positive signals (increase score)
  urgency: { weight: 30, description: 'Wants to buy today/soon ("aaj lena hai", "ready now")' },
  multipleQuestions: { weight: 20, description: 'Asking 3+ specific/detailed product questions' },
  negotiationStart: { weight: 25, description: 'Asks for best/last price or starts bargaining' },
  locationSharing: { weight: 15, description: 'Shares location or asks for meetup point' },
  returningCustomer: { weight: 20, description: 'Customer has history of previous purchases/interactions' },
  whatsappRequest: { weight: 10, description: 'Asks for phone number/WhatsApp details' },

  // Negative signals (decrease score)
  onlyGreeting: { weight: -5, description: 'Only sends greeting (Hi, hello) without asking about the product' },
  priceOnlyNoFollowUp: { weight: -10, description: 'Asks price and disappears/no follow-up question response' },
  spamLanguage: { weight: -50, description: 'Promotional, irrelevant, or inappropriate messages' },
  unrealisticOffer: { weight: -20, description: 'Offers a price more than 25% lower than listed price' },
} as const;

export const TEMPERATURE_THRESHOLDS = {
  SPAM: -20,
  COLD: 30,
  WARM: 65,
  HOT: 100
} as const;

export const TONE_STYLES = {
  warm_negotiator: 'Friendly, respectful, flexible but firm on quality',
  assertive_seller: 'Professional, emphasizes high value, creates soft urgency',
  helpful_assistant: 'Informative, detailed spec-oriented answers, patient'
} as const;
