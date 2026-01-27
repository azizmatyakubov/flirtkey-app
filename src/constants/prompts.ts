/**
 * Prompts - Versioned prompt templates for AI
 * Phase 5.2: Prompt Engineering
 */

import { Girl, Culture } from '../types';

// ==========================================
// 5.2.5: Prompt Versioning
// ==========================================

export const PROMPT_VERSION = '1.0.0';

export interface PromptMetadata {
  version: string;
  type: PromptType;
  createdAt: string;
  description: string;
}

export type PromptType = 
  | 'flirt_response'
  | 'screenshot_analysis'
  | 'conversation_starter'
  | 'date_idea'
  | 'what_to_avoid'
  | 'interest_level'
  | 'red_flag_detection'
  | 'timing_suggestion';

// ==========================================
// Culture & Stage Definitions (moved from ai.ts)
// ==========================================

export const CULTURE_STYLES: Record<Culture, { traits: string[]; avoid: string[] }> = {
  uzbek: {
    traits: [
      'Respectful and traditional approach',
      'Family values are important',
      'Subtle compliments work better than direct',
      'Building trust through patience',
    ],
    avoid: ['Too sexual too early', 'Disrespecting traditions', 'Rushing physical intimacy'],
  },
  russian: {
    traits: [
      'Confidence is key',
      'Intellectual conversations appreciated',
      'Being a gentleman matters',
      'Romantic gestures valued',
    ],
    avoid: ['Being cheap', 'Weak/indecisive behavior', 'Excessive flattery without substance'],
  },
  western: {
    traits: [
      'Be direct but not creepy',
      'Humor and wit are attractive',
      'Keep it casual initially',
      'Independence is respected',
    ],
    avoid: ['Love bombing', 'Being too serious too fast', 'Playing games'],
  },
  asian: {
    traits: [
      'Patience is important',
      'Subtle hints over direct statements',
      'Emotional support valued',
      'Respect for privacy',
    ],
    avoid: ['Being too aggressive', 'Rushing', 'Public confrontation'],
  },
  universal: {
    traits: [
      'Be genuine and authentic',
      'Listen more than talk',
      'Match her energy',
      'Show consistent interest',
    ],
    avoid: ['Generic pickup lines', 'Being desperate', 'Inconsistent behavior'],
  },
};

export const STAGES = {
  just_met: { 
    name: 'Just Met', 
    tone: 'Friendly, curious, light',
    tips: ['Keep it light', 'Show genuine interest', 'Ask open questions'],
  },
  talking: { 
    name: 'Talking Stage', 
    tone: 'Warmer, more personal',
    tips: ['Share more about yourself', 'Find common interests', 'Build rapport'],
  },
  flirting: { 
    name: 'Active Flirting', 
    tone: 'Playful, suggestive, confident',
    tips: ['Tease gently', 'Use callbacks', 'Create tension'],
  },
  dating: { 
    name: 'Dating', 
    tone: 'Romantic, caring, future-oriented',
    tips: ['Plan activities', 'Show commitment', 'Be consistent'],
  },
  serious: { 
    name: 'Serious', 
    tone: 'Loving, supportive, playful',
    tips: ['Maintain excitement', 'Communicate openly', 'Support her goals'],
  },
};

// ==========================================
// 5.2.17: Prompt Injection Protection
// ==========================================

export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove potential injection patterns
  const sanitized = input
    // Remove system/assistant role injection attempts
    .replace(/\b(system|assistant|user)\s*:/gi, '')
    // Remove JSON structure manipulation attempts
    .replace(/[{}[\]]/g, (match) => `\\${match}`)
    // Remove prompt override attempts
    .replace(/\b(ignore|forget|disregard)\s+(all|previous|above|prior)\b/gi, '')
    // Limit length
    .slice(0, 2000);
  
  return sanitized.trim();
}

// ==========================================
// 5.2.3: Base Flirt Prompt (Enhanced)
// ==========================================

export interface FlirtPromptParams {
  girl: Girl;
  herMessage: string;
  userCulture: Culture;
  context?: string;
}

export function buildFlirtPrompt(params: FlirtPromptParams): { prompt: string; metadata: PromptMetadata } {
  const { girl, herMessage, userCulture, context } = params;
  const culture = CULTURE_STYLES[girl.culture as Culture || userCulture || 'universal'];
  const stage = STAGES[girl.relationshipStage || 'just_met'];
  
  // Sanitize all user inputs
  const safeName = sanitizeInput(girl.name);
  const safeMessage = sanitizeInput(herMessage);
  const safeContext = context ? sanitizeInput(context) : '';
  
  const prompt = `You are FlirtKey, an expert dating assistant.

## ABOUT HER (${safeName}):
- Age: ${girl.age || 'Unknown'}
- Personality: ${sanitizeInput(girl.personality || 'Unknown')}
- Interests: ${sanitizeInput(girl.interests || 'Unknown')}
- How they met: ${sanitizeInput(girl.howMet || 'Unknown')}
- Relationship Stage: ${stage.name}
- Things she loves: ${sanitizeInput(girl.greenLights || 'Unknown')}
- Things to AVOID: ${sanitizeInput(girl.redFlags || 'Unknown')}
- Inside jokes: ${sanitizeInput(girl.insideJokes || 'None yet')}
- Her texting style: ${sanitizeInput(girl.herTextingStyle || 'Unknown')}
- Last topic: ${sanitizeInput(girl.lastTopic || 'Unknown')}

## CULTURAL GUIDELINES:
${culture.traits.map((t) => `- ${t}`).join('\n')}
AVOID: ${culture.avoid.join(', ')}

## STAGE TIPS (${stage.name}):
${stage.tips.map((t) => `- ${t}`).join('\n')}

${safeContext ? `## ADDITIONAL CONTEXT:\n${safeContext}\n` : ''}
## HER MESSAGE:
"${safeMessage}"

## YOUR TASK:
Generate 3 response options in JSON format:
{
  "suggestions": [
    {"type": "safe", "text": "...", "reason": "..."},
    {"type": "balanced", "text": "...", "reason": "..."},
    {"type": "bold", "text": "...", "reason": "..."}
  ],
  "proTip": "...",
  "interestLevel": 7,
  "mood": "playful"
}

RULES:
1. Keep ${stage.tone} tone
2. Be specific and actionable
3. Match the length and energy of her messages
4. Include her interests/inside jokes when relevant
5. interestLevel should be 1-10 based on her message enthusiasm
6. mood should describe her current vibe (playful, serious, flirty, distant, etc.)`;

  return {
    prompt,
    metadata: {
      version: PROMPT_VERSION,
      type: 'flirt_response',
      createdAt: new Date().toISOString(),
      description: 'Generate flirty response suggestions',
    },
  };
}

// ==========================================
// 5.2.4: Screenshot Analysis Prompt
// ==========================================

export interface ScreenshotPromptParams {
  girl: Girl | null;
  userCulture: Culture;
}

export function buildScreenshotPrompt(params: ScreenshotPromptParams): { prompt: string; metadata: PromptMetadata } {
  const { girl, userCulture } = params;
  const culture = CULTURE_STYLES[girl?.culture as Culture || userCulture || 'universal'];
  
  const girlContext = girl
    ? `## CONTEXT ABOUT HER (${sanitizeInput(girl.name)}):
- Relationship Stage: ${STAGES[girl.relationshipStage]?.name || 'Unknown'}
- Her interests: ${sanitizeInput(girl.interests || 'Unknown')}
- Things to avoid: ${sanitizeInput(girl.redFlags || 'Unknown')}
- Inside jokes: ${sanitizeInput(girl.insideJokes || 'None')}
- Her texting style: ${sanitizeInput(girl.herTextingStyle || 'Unknown')}`
    : 'No prior context about this person.';

  const prompt = `You are FlirtKey analyzing a chat screenshot.

${girlContext}

## CULTURAL GUIDELINES:
${culture.traits.map((t) => `- ${t}`).join('\n')}
AVOID: ${culture.avoid.join(', ')}

## ANALYSIS TASK:
1. Read all visible messages carefully
2. Identify the conversation flow and energy
3. Note topics, questions, or hooks to build on
4. Assess her interest level (1-10) and mood
5. Look for any red flags or positive signals

Respond with JSON only:
{
  "suggestions": [
    {"type": "safe", "text": "...", "reason": "..."},
    {"type": "balanced", "text": "...", "reason": "..."},
    {"type": "bold", "text": "...", "reason": "..."}
  ],
  "proTip": "specific advice about this conversation",
  "interestLevel": 1-10,
  "mood": "her current mood/vibe",
  "conversationSummary": "brief summary of visible conversation"
}`;

  return {
    prompt,
    metadata: {
      version: PROMPT_VERSION,
      type: 'screenshot_analysis',
      createdAt: new Date().toISOString(),
      description: 'Analyze screenshot and suggest responses',
    },
  };
}

// ==========================================
// 5.2.6: Conversation Starter Prompt
// ==========================================

export interface ConversationStarterParams {
  girl: Girl;
  userCulture: Culture;
  scenario?: 'first_message' | 'revive_conversation' | 'after_date' | 'morning' | 'night';
}

export function buildConversationStarterPrompt(params: ConversationStarterParams): { prompt: string; metadata: PromptMetadata } {
  const { girl, userCulture, scenario = 'first_message' } = params;
  const culture = CULTURE_STYLES[girl.culture as Culture || userCulture || 'universal'];
  const stage = STAGES[girl.relationshipStage || 'just_met'];
  
  const scenarioContext: Record<string, string> = {
    first_message: 'This is the FIRST message ever to her. Make it memorable but not overwhelming.',
    revive_conversation: 'The conversation went quiet for a while. Revive it naturally without being needy.',
    after_date: 'You just had a date. Follow up appropriately based on how it went.',
    morning: 'Morning message - keep it light and sweet, not too demanding.',
    night: 'Night message - can be more intimate/flirty depending on stage.',
  };
  
  const prompt = `You are FlirtKey helping start/continue a conversation.

## ABOUT HER (${sanitizeInput(girl.name)}):
- Age: ${girl.age || 'Unknown'}
- Personality: ${sanitizeInput(girl.personality || 'Unknown')}
- Interests: ${sanitizeInput(girl.interests || 'Unknown')}
- How they met: ${sanitizeInput(girl.howMet || 'Unknown')}
- Relationship Stage: ${stage.name}
- Inside jokes: ${sanitizeInput(girl.insideJokes || 'None yet')}
- Last topic: ${sanitizeInput(girl.lastTopic || 'Unknown')}

## CULTURAL GUIDELINES:
${culture.traits.map((t) => `- ${t}`).join('\n')}

## SCENARIO:
${scenarioContext[scenario]}

## YOUR TASK:
Generate 3 conversation starter options:
{
  "suggestions": [
    {"type": "safe", "text": "...", "reason": "..."},
    {"type": "balanced", "text": "...", "reason": "..."},
    {"type": "bold", "text": "...", "reason": "..."}
  ],
  "proTip": "timing or delivery advice",
  "bestTimeToSend": "suggested timing"
}

RULES:
1. Be ${stage.tone}
2. Reference her interests or inside jokes when possible
3. Don't ask "how are you" - be more creative
4. Keep it natural, not scripted`;

  return {
    prompt,
    metadata: {
      version: PROMPT_VERSION,
      type: 'conversation_starter',
      createdAt: new Date().toISOString(),
      description: 'Generate conversation starters',
    },
  };
}

// ==========================================
// 5.2.7: Date Idea Prompt
// ==========================================

export interface DateIdeaParams {
  girl: Girl;
  userCulture: Culture;
  dateNumber?: number;
  budget?: 'low' | 'medium' | 'high';
  location?: string;
}

export function buildDateIdeaPrompt(params: DateIdeaParams): { prompt: string; metadata: PromptMetadata } {
  const { girl, userCulture, dateNumber = 1, budget = 'medium', location } = params;
  const culture = CULTURE_STYLES[girl.culture as Culture || userCulture || 'universal'];
  
  const prompt = `You are FlirtKey suggesting date ideas.

## ABOUT HER (${sanitizeInput(girl.name)}):
- Age: ${girl.age || 'Unknown'}
- Personality: ${sanitizeInput(girl.personality || 'Unknown')}
- Interests: ${sanitizeInput(girl.interests || 'Unknown')}
- Things she loves: ${sanitizeInput(girl.greenLights || 'Unknown')}
- Things to AVOID: ${sanitizeInput(girl.redFlags || 'Unknown')}

## CULTURAL CONTEXT:
${culture.traits.map((t) => `- ${t}`).join('\n')}

## PARAMETERS:
- Date number: ${dateNumber} (${dateNumber === 1 ? 'First date - keep it casual' : dateNumber < 4 ? 'Still early - building connection' : 'Established - can be more intimate'})
- Budget: ${budget}
${location ? `- Location: ${sanitizeInput(location)}` : ''}

## YOUR TASK:
Generate 3 date ideas:
{
  "suggestions": [
    {
      "type": "safe",
      "idea": "...",
      "why": "why this fits her",
      "howToAsk": "how to suggest this date",
      "tips": ["tip1", "tip2"]
    },
    // balanced and bold options
  ],
  "proTip": "general dating advice for this stage"
}`;

  return {
    prompt,
    metadata: {
      version: PROMPT_VERSION,
      type: 'date_idea',
      createdAt: new Date().toISOString(),
      description: 'Generate personalized date ideas',
    },
  };
}

// ==========================================
// 5.2.8: What To Avoid Analysis Prompt
// ==========================================

export interface WhatToAvoidParams {
  girl: Girl;
  userCulture: Culture;
  recentMessages?: string[];
}

export function buildWhatToAvoidPrompt(params: WhatToAvoidParams): { prompt: string; metadata: PromptMetadata } {
  const { girl, userCulture, recentMessages } = params;
  const culture = CULTURE_STYLES[girl.culture as Culture || userCulture || 'universal'];
  
  const prompt = `You are FlirtKey analyzing what to AVOID with this person.

## ABOUT HER (${sanitizeInput(girl.name)}):
- Personality: ${sanitizeInput(girl.personality || 'Unknown')}
- Known red flags: ${sanitizeInput(girl.redFlags || 'None specified')}
- Her texting style: ${sanitizeInput(girl.herTextingStyle || 'Unknown')}

## CULTURAL CONTEXT:
Things to avoid in ${girl.culture || userCulture || 'universal'} culture:
${culture.avoid.map((a) => `- ${a}`).join('\n')}

${recentMessages?.length ? `## RECENT MESSAGES:\n${recentMessages.map(m => `- "${sanitizeInput(m)}"`).join('\n')}` : ''}

## YOUR TASK:
Analyze and list things to avoid:
{
  "topicsToAvoid": ["topic1", "topic2"],
  "behaviorsToAvoid": ["behavior1", "behavior2"],
  "timingToAvoid": ["timing1", "timing2"],
  "phrasesToAvoid": ["phrase1", "phrase2"],
  "proTip": "most important thing to remember"
}`;

  return {
    prompt,
    metadata: {
      version: PROMPT_VERSION,
      type: 'what_to_avoid',
      createdAt: new Date().toISOString(),
      description: 'Analyze what to avoid with this person',
    },
  };
}

// ==========================================
// 5.2.12: Interest Level Analysis Prompt
// ==========================================

export interface InterestLevelParams {
  girl: Girl;
  messages: Array<{ from: 'her' | 'me'; text: string }>;
}

export function buildInterestLevelPrompt(params: InterestLevelParams): { prompt: string; metadata: PromptMetadata } {
  const { girl, messages } = params;
  
  const messagesText = messages
    .slice(-10) // Last 10 messages
    .map((m) => `${m.from === 'her' ? girl.name : 'You'}: "${sanitizeInput(m.text)}"`)
    .join('\n');
  
  const prompt = `You are FlirtKey analyzing interest levels.

## ABOUT HER (${sanitizeInput(girl.name)}):
- Relationship Stage: ${STAGES[girl.relationshipStage]?.name || 'Unknown'}
- Her texting style: ${sanitizeInput(girl.herTextingStyle || 'Unknown')}

## RECENT MESSAGES:
${messagesText}

## YOUR TASK:
Analyze her interest level:
{
  "interestLevel": 1-10,
  "trend": "increasing" | "stable" | "decreasing",
  "indicators": {
    "positive": ["indicator1", "indicator2"],
    "negative": ["indicator1", "indicator2"]
  },
  "responseTime": "fast" | "moderate" | "slow",
  "engagementLevel": "high" | "medium" | "low",
  "recommendation": "what to do next",
  "warning": "any concerns (optional)"
}

Consider:
- Message length and effort
- Question asking (shows curiosity)
- Emoji usage
- Response enthusiasm
- Initiative (does she start conversations?)`;

  return {
    prompt,
    metadata: {
      version: PROMPT_VERSION,
      type: 'interest_level',
      createdAt: new Date().toISOString(),
      description: 'Analyze interest level from messages',
    },
  };
}

// ==========================================
// 5.2.13: Red Flag Detection Prompt
// ==========================================

export interface RedFlagParams {
  girl: Girl;
  messages: Array<{ from: 'her' | 'me'; text: string }>;
}

export function buildRedFlagPrompt(params: RedFlagParams): { prompt: string; metadata: PromptMetadata } {
  const { girl, messages } = params;
  
  const messagesText = messages
    .slice(-15)
    .map((m) => `${m.from === 'her' ? girl.name : 'You'}: "${sanitizeInput(m.text)}"`)
    .join('\n');
  
  const prompt = `You are FlirtKey detecting red flags in conversations.

## CONVERSATION:
${messagesText}

## YOUR TASK:
Analyze for red flags (be objective, not paranoid):
{
  "redFlags": [
    {
      "flag": "description",
      "severity": "low" | "medium" | "high",
      "evidence": "specific message or pattern",
      "advice": "what to do"
    }
  ],
  "greenFlags": [
    {
      "flag": "description",
      "evidence": "specific message or pattern"
    }
  ],
  "overallAssessment": "healthy" | "caution" | "concern",
  "recommendation": "overall advice"
}

RED FLAGS TO LOOK FOR:
- Inconsistent stories
- Avoiding questions
- Only talking about themselves
- Never initiating
- Hot/cold behavior
- Excessive jealousy early on
- Disrespect or rudeness

GREEN FLAGS TO LOOK FOR:
- Asks questions about you
- Remembers details
- Consistent communication
- Makes plans
- Shows genuine interest`;

  return {
    prompt,
    metadata: {
      version: PROMPT_VERSION,
      type: 'red_flag_detection',
      createdAt: new Date().toISOString(),
      description: 'Detect red and green flags in conversation',
    },
  };
}

// ==========================================
// 5.2.14: Timing Suggestion Prompt
// ==========================================

export interface TimingParams {
  girl: Girl;
  messageType: 'text' | 'ask_out' | 'follow_up' | 'morning' | 'night';
  lastMessageTime?: Date;
  timezone?: string;
}

export function buildTimingPrompt(params: TimingParams): { prompt: string; metadata: PromptMetadata } {
  const { girl, messageType, lastMessageTime, timezone } = params;
  
  const prompt = `You are FlirtKey advising on message timing.

## ABOUT HER:
- Her texting style: ${sanitizeInput(girl.herTextingStyle || 'Unknown')}
- Response time pattern: ${sanitizeInput(girl.responseTime || 'Unknown')}
- Relationship Stage: ${STAGES[girl.relationshipStage]?.name || 'Unknown'}

## CONTEXT:
- Message type: ${messageType}
${lastMessageTime ? `- Last message: ${lastMessageTime.toISOString()}` : ''}
${timezone ? `- Timezone: ${timezone}` : ''}

## YOUR TASK:
Suggest optimal timing:
{
  "recommendation": "specific timing advice",
  "bestTimes": ["time1", "time2"],
  "avoidTimes": ["time1", "time2"],
  "waitTime": "how long to wait if applicable",
  "reason": "why this timing works",
  "urgency": "low" | "medium" | "high"
}

TIMING PRINCIPLES:
- Don't double text too quickly
- Match her response patterns
- Consider her schedule/lifestyle
- Morning texts feel different than night texts
- Weekends vs weekdays matter`;

  return {
    prompt,
    metadata: {
      version: PROMPT_VERSION,
      type: 'timing_suggestion',
      createdAt: new Date().toISOString(),
      description: 'Suggest optimal message timing',
    },
  };
}

// ==========================================
// 5.2.11: Prompt Templates Registry
// ==========================================

export const PROMPT_TEMPLATES = {
  flirt_response: buildFlirtPrompt,
  screenshot_analysis: buildScreenshotPrompt,
  conversation_starter: buildConversationStarterPrompt,
  date_idea: buildDateIdeaPrompt,
  what_to_avoid: buildWhatToAvoidPrompt,
  interest_level: buildInterestLevelPrompt,
  red_flag_detection: buildRedFlagPrompt,
  timing_suggestion: buildTimingPrompt,
} as const;

// ==========================================
// 5.2.10: Token Estimation (rough)
// ==========================================

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for English
  // This is a simplified estimation
  return Math.ceil(text.length / 4);
}

export function isPromptWithinLimit(prompt: string, maxTokens: number = 4000): boolean {
  return estimateTokens(prompt) <= maxTokens;
}

// ==========================================
// 5.2.16: Prompt Strategy Documentation
// ==========================================

export const PROMPT_STRATEGIES = {
  persona: 'Always introduce the AI as "FlirtKey" - a knowledgeable dating assistant',
  context: 'Provide comprehensive context about the girl to enable personalized responses',
  structure: 'Request JSON output for consistent parsing',
  tone: 'Adjust tone based on relationship stage',
  culture: 'Include cultural guidelines to respect differences',
  safety: 'Include "things to avoid" to prevent inappropriate suggestions',
  examples: 'Show expected output structure in the prompt',
  constraints: 'Set clear rules and boundaries',
};

export default {
  PROMPT_VERSION,
  CULTURE_STYLES,
  STAGES,
  PROMPT_TEMPLATES,
  PROMPT_STRATEGIES,
  buildFlirtPrompt,
  buildScreenshotPrompt,
  buildConversationStarterPrompt,
  buildDateIdeaPrompt,
  buildWhatToAvoidPrompt,
  buildInterestLevelPrompt,
  buildRedFlagPrompt,
  buildTimingPrompt,
  sanitizeInput,
  estimateTokens,
  isPromptWithinLimit,
};
