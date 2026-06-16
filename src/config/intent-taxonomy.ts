export const INTENT_TAXONOMY = [
  'AVAILABILITY',           // "Is this available?"
  'PRICE_INQUIRY',          // "What's the price?"
  'NEGOTIATION',            // "Last price?" / "Discount?"
  'PRODUCT_DETAILS',        // "Battery health? Storage?"
  'WARRANTY_INQUIRY',       // "Any warranty?"
  'DELIVERY_INQUIRY',       // "Do you deliver?"
  'EXCHANGE_INQUIRY',       // "Exchange possible?"
  'WHATSAPP_REQUEST',       // "WhatsApp number?"
  'LOCATION_INQUIRY',       // "Where are you located?"
  'PTA_STATUS',             // "PTA approved?"
  'PURCHASE_READINESS',     // "I want to buy today"
  'COMPARISON',             // "Do you have other options?"
  'SERIOUS_BUYER_SIGNAL',   // Multiple questions, returning customer
  'OBJECTION',              // "Too expensive", "Condition looks bad"
  'GREETING',               // "Hi, hello"
  'SPAM',                   // Irrelevant, promotional
  'UNKNOWN',                // Cannot classify
] as const;

export type Intent = typeof INTENT_TAXONOMY[number];
