/**
 * Auto-qualification scoring.
 * Runs against the full inbound message history for a conversation.
 * Returns { qualified: boolean, score: number, reasons: string[] }
 */

// Street address pattern: starts with a number followed by a word (e.g. "123 Oak", "1842 Ridge")
const ADDRESS_PATTERN = /\b\d{1,5}\s+[a-z]/i

// Zip code pattern
const ZIP_PATTERN = /\b\d{5}(-\d{4})?\b/

// Street suffixes
const STREET_SUFFIXES = /\b(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|way|ct|court|pl|place|circle|cir)\b/i

// Scheduling intent
const SCHEDULE_KEYWORDS = [
  'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'next week', 'this week', 'morning', 'afternoon', 'evening',
  'can you come', 'can someone come', 'send someone', 'come out', 'come by',
  'schedule', 'appointment', 'book', 'available', 'availability', 'when can you',
  'what time', 'what day', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm',
]

// Confirmation of intent
const CONFIRMATION_KEYWORDS = [
  'yes please', 'yes!', 'sounds good', 'that works', 'perfect', 'great',
  'let\'s do it', 'lets do it', 'book it', 'sign me up', 'please send',
  'go ahead', 'i\'m ready', 'im ready', 'confirmed', 'okay', 'ok',
  'yes that', 'yes i', 'absolutely', 'for sure', 'definitely',
]

// Urgency signals (also count as intent)
const URGENCY_KEYWORDS = [
  'emergency', 'urgent', 'asap', 'right now', 'today', 'immediately',
  'flooding', 'leak', 'no ac', 'no heat', 'no hot water', 'burst', 'sparks',
  'kids', 'elderly', 'baby', 'no power', 'burning smell',
]

function hasAddress(text: string): boolean {
  return (
    (ADDRESS_PATTERN.test(text) && STREET_SUFFIXES.test(text)) ||
    ZIP_PATTERN.test(text)
  )
}

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw))
}

export type QualifyResult = {
  qualified: boolean
  score: number
  reasons: string[]
}

export function scoreConversation(inboundMessages: string[]): QualifyResult {
  const combined = inboundMessages.join(' ')
  const reasons: string[] = []
  let score = 0

  // +2 — address given (strongest signal)
  if (inboundMessages.some(m => hasAddress(m))) {
    score += 2
    reasons.push('address provided')
  }

  // +2 — scheduling intent
  if (containsAny(combined, SCHEDULE_KEYWORDS)) {
    score += 2
    reasons.push('scheduling intent')
  }

  // +2 — confirmed they want service
  if (containsAny(combined, CONFIRMATION_KEYWORDS)) {
    score += 2
    reasons.push('confirmed intent')
  }

  // +1 — urgency signal
  if (containsAny(combined, URGENCY_KEYWORDS)) {
    score += 1
    reasons.push('urgency signal')
  }

  // +1 — gave their name ("I'm John", "my name is", "this is Sarah")
  if (/\b(i'm|i am|my name is|this is)\s+[A-Z][a-z]+/.test(combined)) {
    score += 1
    reasons.push('gave name')
  }

  return {
    qualified: score >= 3,
    score,
    reasons,
  }
}
