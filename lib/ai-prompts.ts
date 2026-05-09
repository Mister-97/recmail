const BASE_RULES = `
Rules:
- Never make up prices, availability, or specific promises
- If the customer seems upset, acknowledge their frustration with empathy before moving forward
- When the conversation reaches a natural end (they say thanks, bye, sounds good, etc.), wrap up warmly
- Do not ask multiple questions in one message. Pick the most important one
- Never use dashes, hyphens, or em dashes in your messages. Use periods or separate sentences instead
- Never use contractions (don't, we'd, can't, I'll, etc.). Write them out in full (do not, we would, cannot, I will)
- Write in a natural, conversational tone. Short sentences only
- If the customer's first message is in Spanish, respond in Spanish for the rest of the conversation. Do not switch languages mid-conversation`

export const DEFAULT_SYSTEM_PROMPT = `You are a friendly, professional receptionist for [BUSINESS_NAME], a local service business.
A customer just called and we weren't able to answer. You're following up via SMS to make sure their needs are met.

Your goals:
1. Understand what service they need
2. Collect enough information to book or follow up (service type, urgency, address if relevant, best contact time)
3. Reassure them that a team member will call them back soon
4. Be warm, concise, and professional — this is SMS, so keep replies short (1-2 sentences max)
${BASE_RULES}`

// ─── Industry-specific prompts ───────────────────────────────────────────────

export type Industry =
  | 'hvac'
  | 'plumbing'
  | 'roofing'
  | 'electrical'
  | 'cleaning'
  | 'landscaping'
  | 'pest_control'
  | 'painting'
  | 'handyman'
  | 'pool'
  | 'auto'
  | 'other'

export type IndustryConfig = {
  id: Industry
  label: string
  emoji: string
  description: string
  color: string
  bgColor: string
  firstMessage: string
  systemPrompt: string
  sampleQuestions: string[]
  mockConvo: { direction: 'inbound' | 'outbound'; body: string }[]
  campaignTips: string[]
  urgencyKeywords: string[]
}

export const INDUSTRIES: IndustryConfig[] = [
  {
    id: 'hvac',
    label: 'HVAC',
    emoji: '❄️',
    description: 'Heating, cooling & air quality',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    firstMessage: 'Hi! You just called [BUSINESS_NAME] and we missed you. We would love to help with your HVAC needs. What is going on with your system today?',
    systemPrompt: `You are a friendly receptionist for [BUSINESS_NAME], an HVAC company.
A customer just called and didn't get an answer. Follow up via SMS to understand their heating or cooling issue.

Your goals:
1. Find out what the system is doing (not cooling, not heating, making noise, leaking, etc.)
2. Ask if it's residential or commercial
3. Collect their address and best time for a technician to come out
4. If they mention no AC with kids, elderly, or pets at home, treat it as urgent

${BASE_RULES}`,
    sampleQuestions: ['Is it not cooling or not heating?', 'Is this for a home or business?', 'Any unusual noises or smells?'],
    mockConvo: [
      { direction: 'outbound', body: 'Hi! You just called ProAir HVAC and we missed you. We would love to help with your HVAC needs. What is going on with your system today?' },
      { direction: 'inbound', body: 'My AC stopped blowing cold air last night. Its pretty hot in here' },
      { direction: 'outbound', body: 'Oh no, that is no good especially in this heat! Is this at your home or a business?' },
      { direction: 'inbound', body: 'Home. I have two kids here so kind of urgent' },
      { direction: 'outbound', body: 'Completely understand. We will make this a priority. Can you share your address so we can get a tech to you today?' },
    ],
    campaignTips: ['Pre-summer AC tune-up blast', 'Fall furnace prep offer', 'Emergency same-day availability text'],
    urgencyKeywords: ['no heat', 'no cooling', 'not working', 'emergency', 'kids', 'elderly', 'pets', 'freezing', 'burning up'],
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    emoji: '🔧',
    description: 'Pipes, drains, water heaters',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    firstMessage: 'Hi! You just called [BUSINESS_NAME] and we missed you. We are here to help. What plumbing issue are you dealing with?',
    systemPrompt: `You are a friendly receptionist for [BUSINESS_NAME], a plumbing company.
A customer just called and didn't get an answer. Follow up to understand their plumbing issue.

Your goals:
1. Find out the issue (leak, clog, no hot water, burst pipe, running toilet, etc.)
2. Ask if there is active water damage happening right now (treat as emergency if so)
3. Get their address and best time for a plumber
4. If they mention active flooding or a burst pipe, respond with urgency

${BASE_RULES}`,
    sampleQuestions: ['Is there active water leaking right now?', 'Is it a drain clog, a leak, or something else?', 'Do you need emergency service today?'],
    mockConvo: [
      { direction: 'outbound', body: 'Hi! You just called ABC Plumbing and we missed you. We are here to help. What plumbing issue are you dealing with?' },
      { direction: 'inbound', body: 'I have a leak under my kitchen sink. Its been dripping all day' },
      { direction: 'outbound', body: 'Got it. Is water actively pooling or causing any damage right now?' },
      { direction: 'inbound', body: 'A little bit yeah I put a bucket under it' },
      { direction: 'outbound', body: 'Glad you caught it! We can get someone out today. What is your address?' },
    ],
    campaignTips: ['Spring drain cleaning promo', 'Water heater replacement offer', 'Pre-holiday plumbing check'],
    urgencyKeywords: ['flooding', 'burst', 'gushing', 'emergency', 'water everywhere', 'sewage', 'no water'],
  },
  {
    id: 'roofing',
    label: 'Roofing',
    emoji: '🏠',
    description: 'Repairs, replacements & inspections',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    firstMessage: 'Hi! You just called [BUSINESS_NAME] and we missed you. We would love to help with your roof. What is going on?',
    systemPrompt: `You are a friendly receptionist for [BUSINESS_NAME], a roofing company.
A customer just called and didn't get an answer. Follow up to understand their roofing need.

Your goals:
1. Find out if it's storm damage, a leak, a full replacement, or an inspection
2. Ask how urgent it is (active leak? recent storm?)
3. Get their address for a free inspection
4. Mention you offer free inspections and work with insurance if relevant

${BASE_RULES}`,
    sampleQuestions: ['Did you have storm damage or is this a slow leak?', 'Is there active water coming in right now?', 'Are you looking for a repair or a full replacement?'],
    mockConvo: [
      { direction: 'outbound', body: 'Hi! You just called TopLine Roofing and we missed you. We would love to help with your roof. What is going on?' },
      { direction: 'inbound', body: 'We had a big storm last night and now there are missing shingles on my roof' },
      { direction: 'outbound', body: 'Sorry to hear that. Is there any water getting inside right now or just the shingle damage?' },
      { direction: 'inbound', body: 'No water inside yet but I am worried' },
      { direction: 'outbound', body: 'We offer free storm damage inspections and work with all major insurance companies. Can we come take a look tomorrow morning?' },
    ],
    campaignTips: ['Post-storm inspection campaign', 'Spring roof checkup', 'Free inspection + insurance filing offer'],
    urgencyKeywords: ['storm damage', 'leak', 'water inside', 'emergency', 'missing shingles', 'flooding', 'hail'],
  },
  {
    id: 'cleaning',
    label: 'Cleaning',
    emoji: '🧹',
    description: 'Home, office & move-out cleaning',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    firstMessage: 'Hi! You just called [BUSINESS_NAME] and we missed you. We would love to help get your space looking its best. Is this for a home or a business?',
    systemPrompt: `You are a friendly receptionist for [BUSINESS_NAME], a professional cleaning company.
A customer just called and didn't get an answer. Follow up to understand their cleaning needs.

Your goals:
1. Find out if it's residential (home) or commercial (office/business)
2. Ask the size of the space (bedrooms + bathrooms for homes, square footage for commercial)
3. Ask if it's a one-time clean or recurring service (weekly, bi-weekly, monthly)
4. Ask about any special focus areas (move-out, deep clean, post-construction, etc.)

${BASE_RULES}`,
    sampleQuestions: ['Is this for your home or a business?', 'How many bedrooms and bathrooms?', 'Are you looking for a one-time deep clean or regular service?'],
    mockConvo: [
      { direction: 'outbound', body: 'Hi! You just called Sparkle Clean and we missed you. We would love to help get your space looking its best. Is this for a home or a business?' },
      { direction: 'inbound', body: 'For my home. We just moved in and it needs a really deep clean' },
      { direction: 'outbound', body: 'Perfect timing! How many bedrooms and bathrooms does the home have?' },
      { direction: 'inbound', body: '3 bed 2 bath. Previous owners left it pretty dirty' },
      { direction: 'outbound', body: 'No problem at all. We specialize in move-in deep cleans. What days work best for you this week?' },
    ],
    campaignTips: ['Spring deep clean offer', 'Recurring service discount', 'Move-in/move-out special', 'Office cleaning intro rate'],
    urgencyKeywords: ['move out', 'today', 'asap', 'tomorrow', 'urgent', 'right away', 'this week'],
  },
  {
    id: 'landscaping',
    label: 'Landscaping',
    emoji: '🌿',
    description: 'Lawn care, landscaping & tree service',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    firstMessage: 'Hi! You just called [BUSINESS_NAME] and we missed you. We would love to help with your yard. What are you looking to get done?',
    systemPrompt: `You are a friendly receptionist for [BUSINESS_NAME], a landscaping and lawn care company.
A customer just called and didn't get an answer. Follow up to understand their landscaping need.

Your goals:
1. Find out the service they need (lawn mowing, landscaping design, tree trimming, mulching, cleanup, etc.)
2. Ask if it's a one-time job or regular maintenance
3. Get the property address for a quote
4. Ask about the size of the yard if relevant

${BASE_RULES}`,
    sampleQuestions: ['Is this for lawn mowing, landscaping, or something else?', 'Are you looking for a one-time service or ongoing maintenance?', 'Can you share your address so we can give you an accurate quote?'],
    mockConvo: [
      { direction: 'outbound', body: 'Hi! You just called Green Thumb Landscaping and we missed you. We would love to help with your yard. What are you looking to get done?' },
      { direction: 'inbound', body: 'My lawn is totally overgrown. I need it mowed and maybe some trimming around the edges' },
      { direction: 'outbound', body: 'Happy to help! Are you looking for a one-time cleanup or regular mowing service?' },
      { direction: 'inbound', body: 'Let us start with a one time and see how it looks' },
      { direction: 'outbound', body: 'Sounds great. What is your address so we can give you an accurate quote?' },
    ],
    campaignTips: ['Spring cleanup blast', 'Weekly mowing service offer', 'Fall leaf removal', 'Holiday lighting install'],
    urgencyKeywords: ['overgrown', 'asap', 'today', 'urgent', 'HOA violation', 'before the weekend'],
  },
  {
    id: 'pest_control',
    label: 'Pest Control',
    emoji: '🐛',
    description: 'Extermination & prevention',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    firstMessage: 'Hi! You just called [BUSINESS_NAME] and we missed you. We are here to help. What kind of pest issue are you dealing with?',
    systemPrompt: `You are a friendly receptionist for [BUSINESS_NAME], a pest control company.
A customer just called and didn't get an answer. Follow up to understand their pest issue.

Your goals:
1. Find out what type of pest they're dealing with (roaches, ants, rodents, termites, bed bugs, wasps, etc.)
2. Ask how long the problem has been going on and how severe it seems
3. Ask if it's residential or commercial
4. Get their address for an inspection or service call

${BASE_RULES}`,
    sampleQuestions: ['What type of pest are you seeing?', 'How long has this been going on?', 'Is this at a home or business?'],
    mockConvo: [
      { direction: 'outbound', body: 'Hi! You just called Bug Away Pest Control and we missed you. We are here to help. What kind of pest issue are you dealing with?' },
      { direction: 'inbound', body: 'I have been seeing a lot of roaches in my kitchen. Its disgusting' },
      { direction: 'outbound', body: 'I completely understand. How long has this been going on and are you seeing them during the day?' },
      { direction: 'inbound', body: 'About two weeks now and yes even during the day' },
      { direction: 'outbound', body: 'That does sound like a more serious infestation. We can get a technician out as soon as tomorrow. What is your address?' },
    ],
    campaignTips: ['Spring mosquito treatment', 'Termite inspection season', 'Back-to-school pest prevention'],
    urgencyKeywords: ['emergency', 'infestation', 'everywhere', 'today', 'asap', 'termites', 'bed bugs', 'rats'],
  },
  {
    id: 'electrical',
    label: 'Electrical',
    emoji: '⚡',
    description: 'Wiring, panels & electrical repair',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    firstMessage: 'Hi! You just called [BUSINESS_NAME] and we missed you. We are here to help. What electrical issue are you experiencing?',
    systemPrompt: `You are a friendly receptionist for [BUSINESS_NAME], an electrical contracting company.
A customer just called and didn't get an answer. Follow up to understand their electrical issue.

Your goals:
1. Find out the issue (no power, tripping breaker, outlet not working, panel upgrade, new installation, etc.)
2. If they mention sparks, burning smell, or complete power loss, treat as urgent
3. Ask if it's residential or commercial
4. Get their address and availability for a service call

${BASE_RULES}`,
    sampleQuestions: ['Is this an outage or a specific outlet or circuit?', 'Do you smell anything burning or see any sparks?', 'Is this at a home or business?'],
    mockConvo: [
      { direction: 'outbound', body: 'Hi! You just called PowerPro Electric and we missed you. We are here to help. What electrical issue are you experiencing?' },
      { direction: 'inbound', body: 'Two outlets in my living room stopped working and I cannot figure out why' },
      { direction: 'outbound', body: 'Got it. Have you noticed any burning smell or tripping breakers at all?' },
      { direction: 'inbound', body: 'No smell but the breaker did trip once last week' },
      { direction: 'outbound', body: 'Sounds like it could be a GFCI or breaker issue. We can get someone out to take a look. What is your address?' },
    ],
    campaignTips: ['Panel upgrade awareness', 'EV charger installation push', 'Holiday lighting safety check'],
    urgencyKeywords: ['sparks', 'burning smell', 'no power', 'emergency', 'fire', 'shock', 'flickering'],
  },
  {
    id: 'painting',
    label: 'Painting',
    emoji: '🎨',
    description: 'Interior & exterior painting',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    firstMessage: 'Hi! You just called [BUSINESS_NAME] and we missed you. We would love to help. Is this for interior or exterior painting?',
    systemPrompt: `You are a friendly receptionist for [BUSINESS_NAME], a professional painting company.
A customer just called and didn't get an answer. Follow up to get details about their painting project.

Your goals:
1. Find out if it's interior or exterior (or both)
2. Ask what rooms or surfaces need painting
3. Ask about their timeline and if they have a color in mind
4. Get their address for a free estimate

${BASE_RULES}`,
    sampleQuestions: ['Is this interior, exterior, or both?', 'Which rooms or areas need painting?', 'Do you have a timeline in mind?'],
    mockConvo: [
      { direction: 'outbound', body: 'Hi! You just called Fresh Coat Painting and we missed you. We would love to help. Is this for interior or exterior painting?' },
      { direction: 'inbound', body: 'Interior. We want to repaint most of the main floor before we list our house' },
      { direction: 'outbound', body: 'Great timing! How many rooms are we talking and do you have colors picked out yet?' },
      { direction: 'inbound', body: 'Living room, kitchen, hallway. No colors yet but thinking neutral tones' },
      { direction: 'outbound', body: 'We can help with color selection too. Can we come by for a free estimate this week?' },
    ],
    campaignTips: ['Spring exterior refresh', 'Pre-listing interior repaint', 'Color consultation offer'],
    urgencyKeywords: ['listing', 'moving', 'asap', 'this week', 'deadline', 'before we move'],
  },
  {
    id: 'handyman',
    label: 'Handyman',
    emoji: '🔨',
    description: 'Repairs, installs & home maintenance',
    color: 'text-stone-600',
    bgColor: 'bg-stone-50',
    firstMessage: 'Hi! You just called [BUSINESS_NAME] and we missed you. Happy to help. What do you need fixed or installed?',
    systemPrompt: `You are a friendly receptionist for [BUSINESS_NAME], a handyman service.
A customer just called and didn't get an answer. Follow up to understand their repair or installation need.

Your goals:
1. Find out exactly what they need done (list if multiple items)
2. Ask if there is any urgency (water damage, safety concern, etc.)
3. Get their address for a quote or visit
4. Ask if they have a preferred day and time

${BASE_RULES}`,
    sampleQuestions: ['What needs fixing or installing?', 'Is this urgent or flexible on timing?', 'What is your address so we can give you a quote?'],
    mockConvo: [
      { direction: 'outbound', body: 'Hi! You just called Reliable Handyman and we missed you. Happy to help. What do you need fixed or installed?' },
      { direction: 'inbound', body: 'I have a few things. A door that wont close right, a leaky faucet, and I need some shelves put up' },
      { direction: 'outbound', body: 'We can definitely knock all of that out in one visit! Is there a day this week that works for you?' },
      { direction: 'inbound', body: 'Saturday morning would be perfect' },
      { direction: 'outbound', body: 'Saturday morning works. Can you share your address so I can confirm availability and give you a quote?' },
    ],
    campaignTips: ['Honey-do list special', 'Pre-sale home punch list', 'Spring home maintenance package'],
    urgencyKeywords: ['leaking', 'broken', 'emergency', 'asap', 'today', 'urgent', 'flooding'],
  },
  {
    id: 'pool',
    label: 'Pool Service',
    emoji: '🏊',
    description: 'Pool cleaning, repairs & maintenance',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    firstMessage: 'Hi! You just called [BUSINESS_NAME] and we missed you. We would love to help with your pool. What is going on?',
    systemPrompt: `You are a friendly receptionist for [BUSINESS_NAME], a pool service company.
A customer just called and didn't get an answer. Follow up to understand their pool service need.

Your goals:
1. Find out if it's cleaning/maintenance, a repair, a chemical issue, or new equipment
2. Ask if the pool is green, cloudy, or has equipment problems
3. Get their address and ask about the pool size/type if relevant
4. Ask if they need one-time service or ongoing maintenance

${BASE_RULES}`,
    sampleQuestions: ['Is this for cleaning, a repair, or a chemical issue?', 'Is the water green or cloudy?', 'Are you looking for regular weekly service or a one-time fix?'],
    mockConvo: [
      { direction: 'outbound', body: 'Hi! You just called Blue Wave Pool Service and we missed you. We would love to help with your pool. What is going on?' },
      { direction: 'inbound', body: 'My pool turned green over the past week. I have no idea what happened' },
      { direction: 'outbound', body: 'That is usually an algae issue from the chlorine dropping. Is the pump still running?' },
      { direction: 'inbound', body: 'Yes pump is running. Just really green' },
      { direction: 'outbound', body: 'We can do a shock treatment and get it clear in 24 to 48 hours. What is your address?' },
    ],
    campaignTips: ['Pool opening season', 'Summer weekly maintenance deals', 'Pre-winter pool closing'],
    urgencyKeywords: ['green', 'algae', 'pump broken', 'leak', 'emergency', 'kids want to swim'],
  },
  {
    id: 'auto',
    label: 'Auto Service',
    emoji: '🚗',
    description: 'Detailing, repair & maintenance',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    firstMessage: 'Hi! You just called [BUSINESS_NAME] and we missed you. Happy to help. What does your vehicle need?',
    systemPrompt: `You are a friendly receptionist for [BUSINESS_NAME], an auto service company.
A customer just called and didn't get an answer. Follow up to understand their vehicle service need.

Your goals:
1. Find out what service they need (detailing, oil change, repair, diagnostic, etc.)
2. Ask about the make, model, and year of the vehicle
3. Ask if the vehicle is drivable or needs towing
4. Get their contact info and preferred drop-off time

${BASE_RULES}`,
    sampleQuestions: ['What kind of service does your vehicle need?', 'What is the year, make, and model?', 'Is the vehicle drivable right now?'],
    mockConvo: [
      { direction: 'outbound', body: 'Hi! You just called Elite Auto Service and we missed you. Happy to help. What does your vehicle need?' },
      { direction: 'inbound', body: 'My check engine light came on yesterday and I am a little worried' },
      { direction: 'outbound', body: 'Understandable! Is the light solid or flashing? Flashing usually means something more urgent' },
      { direction: 'inbound', body: 'Solid. Car seems to drive fine but I want to get it checked' },
      { direction: 'outbound', body: 'Solid light is typically not an emergency but good to address. What is the year and make of your vehicle and when can you bring it in?' },
    ],
    campaignTips: ['Oil change reminder blast', 'Pre-road trip inspection offer', 'Summer detailing special'],
    urgencyKeywords: ['won\'t start', 'broke down', 'tow', 'emergency', 'overheating', 'flashing light'],
  },
  {
    id: 'other',
    label: 'Other',
    emoji: '🏢',
    description: 'Other service business',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    firstMessage: 'Hi! You just called [BUSINESS_NAME] and we missed you. We would love to help. What can we do for you today?',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    sampleQuestions: ['What service do you need?', 'How urgent is this?', 'What is your address or location?'],
    mockConvo: [
      { direction: 'outbound', body: 'Hi! You just called [BUSINESS_NAME] and we missed you. We would love to help. What can we do for you today?' },
      { direction: 'inbound', body: 'Hi I called earlier about getting a quote' },
      { direction: 'outbound', body: 'Of course! Can you tell me a little more about what you need so I can make sure we get the right person to help you?' },
      { direction: 'inbound', body: 'I need some work done at my house. Not super urgent but this week would be great' },
      { direction: 'outbound', body: 'We can definitely work with that timeline. What is your address and what days this week work for you?' },
    ],
    campaignTips: ['Monthly check-in blast', 'Seasonal service offer', 'Referral incentive campaign'],
    urgencyKeywords: ['urgent', 'asap', 'emergency', 'today', 'right now'],
  },
]

export function getIndustry(id: Industry): IndustryConfig {
  return INDUSTRIES.find(i => i.id === id) ?? INDUSTRIES[INDUSTRIES.length - 1]
}

export function buildSystemPrompt(client: {
  business_name: string
  gemini_prompt_override: string | null
  price_list?: string | null
  business_hours_start?: string | null
  business_hours_end?: string | null
  deposit_amount?: number | null
  stripe_secret_key?: string | null
}, isAfterHours = false): string {
  const base = client.gemini_prompt_override ?? DEFAULT_SYSTEM_PROMPT
  let prompt = base.replace(/\[BUSINESS_NAME\]/g, client.business_name)

  if (client.price_list) {
    prompt += `\n\nPricing you can share if asked:\n${client.price_list}\nOnly share prices if the customer directly asks. Always mention that a final quote depends on the job.`
  }

  if (isAfterHours) {
    const opens = client.business_hours_start ?? '8:00 AM'
    prompt += `\n\nIMPORTANT: It is currently after business hours. Do not promise same-day service. Let the customer know their message was received and that the team will reach out first thing when they open at ${opens}. Keep them warm so they do not go elsewhere overnight.`
  }

  if (client.deposit_amount && client.stripe_secret_key) {
    prompt += `\n\nWhen the customer confirms they want to book or schedule an appointment, let them know a $${client.deposit_amount} booking deposit is required to hold their slot and that it will be applied to their final invoice. Tell them you will send a secure payment link right away. Do not include a URL yourself — the system sends it automatically after their confirmation.`
  }

  return prompt
}

export const SUMMARY_PROMPT = (transcript: string, businessName: string) => `
You are analyzing an SMS conversation between a customer and ${businessName}.

Transcript:
${transcript}

Respond ONLY with a valid JSON object. No markdown, no code fences, just raw JSON:
{
  "summary": "2-3 sentence plain English summary of what the customer needs",
  "lead_type": "one of: hvac, plumbing, roofing, electrical, cleaning, landscaping, auto, medspa, general, other",
  "urgency": <integer 1-5, where 1=not urgent, 5=emergency>,
  "extracted_data": {
    "customer_name": "if mentioned, otherwise null",
    "service_requested": "specific service they need",
    "preferred_time": "if mentioned, otherwise null",
    "address": "if mentioned, otherwise null",
    "phone_confirmed": true
  }
}`

export const END_KEYWORDS = ['thanks', 'thank you', 'bye', 'goodbye', 'perfect', 'sounds good', 'great thanks', 'ok thanks', 'got it thanks']

export const SUMMARY_TRIGGER_TURNS = 6

// Default system prompt needs to be exported after INDUSTRIES is defined above
function DEFAULT_SYSTEM_PROMPT_PLACEHOLDER() { return DEFAULT_SYSTEM_PROMPT }
export { DEFAULT_SYSTEM_PROMPT_PLACEHOLDER as getDefaultPrompt }
