/**
 * AI Service - OpenAI API integration
 * Phase 5.1: OpenAI Service
 */

import axios from 'axios';
import { Girl, Culture, AnalysisResult, Suggestion } from '../types';

// ==========================================
// Culture & Stage Definitions (5.2.1, 5.2.2)
// ==========================================

export const CULTURE_STYLES = {
  uzbek: {
    traits: [
      'Respectful and traditional approach',
      'Family values are important',
      'Subtle compliments work better than direct',
    ],
    avoid: ['Too sexual too early', 'Disrespecting traditions'],
  },
  russian: {
    traits: [
      'Confidence is key',
      'Intellectual conversations appreciated',
      'Being a gentleman matters',
    ],
    avoid: ['Being cheap', 'Weak/indecisive behavior'],
  },
  western: {
    traits: [
      'Be direct but not creepy',
      'Humor and wit are attractive',
      'Keep it casual initially',
    ],
    avoid: ['Love bombing', 'Being too serious too fast'],
  },
  asian: {
    traits: [
      'Patience is important',
      'Subtle hints over direct statements',
      'Emotional support valued',
    ],
    avoid: ['Being too aggressive', 'Rushing'],
  },
  universal: {
    traits: ['Be genuine and authentic', 'Listen more than talk', 'Match her energy'],
    avoid: ['Generic pickup lines', 'Being desperate'],
  },
};

export const STAGES = {
  just_met: { name: 'Just Met', tone: 'Friendly, curious, light' },
  talking: { name: 'Talking Stage', tone: 'Warmer, more personal' },
  flirting: { name: 'Active Flirting', tone: 'Playful, suggestive, confident' },
  dating: { name: 'Dating', tone: 'Romantic, caring, future-oriented' },
  serious: { name: 'Serious', tone: 'Loving, supportive, playful' },
};

// ==========================================
// Request Types
// ==========================================

export interface GenerateFlirtRequest {
  girl: Girl;
  herMessage: string;
  userCulture: Culture;
  context?: string;
  apiKey: string;
}

export interface AnalyzeScreenshotRequest {
  girl: Girl | null;
  imageBase64: string;
  userCulture: Culture;
  apiKey: string;
}

// ==========================================
// Prompts (5.2.3, 5.2.4)
// ==========================================

const buildFlirtPrompt = (
  girl: Girl,
  herMessage: string,
  userCulture: Culture,
  context?: string
): string => {
  const culture = CULTURE_STYLES[(girl.culture as Culture) || userCulture || 'universal'];
  const stage = STAGES[girl.relationshipStage || 'just_met'];

  return `You are FlirtKey, an expert dating assistant.

## ABOUT HER (${girl.name}):
- Age: ${girl.age || 'Unknown'}
- Personality: ${girl.personality || 'Unknown'}
- Interests: ${girl.interests || 'Unknown'}
- How they met: ${girl.howMet || 'Unknown'}
- Relationship Stage: ${stage.name}
- Things she loves: ${girl.greenLights || 'Unknown'}
- Things to AVOID: ${girl.redFlags || 'Unknown'}
- Inside jokes: ${girl.insideJokes || 'None yet'}
- Her texting style: ${girl.herTextingStyle || 'Unknown'}
- Last topic: ${girl.lastTopic || 'Unknown'}

## CULTURAL GUIDELINES:
${culture.traits.map((t) => `- ${t}`).join('\n')}
AVOID: ${culture.avoid.join(', ')}

${context ? `## ADDITIONAL CONTEXT:\n${context}\n` : ''}
## HER MESSAGE:
"${herMessage}"

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
};

const buildScreenshotPrompt = (girl: Girl | null): string => {
  const context = girl
    ? `Context: Talking to ${girl.name}, ${STAGES[girl.relationshipStage]?.name || 'Unknown'} stage.
Her interests: ${girl.interests || 'Unknown'}
Things to avoid: ${girl.redFlags || 'Unknown'}`
    : 'No prior context about this person.';

  return `You are FlirtKey analyzing a chat screenshot.
${context}

Analyze the conversation carefully:
1. Read all visible messages
2. Identify the flow and energy
3. Note any topics, questions, or hooks to build on
4. Assess her interest level and mood

Respond with JSON:
{
  "suggestions": [
    {"type": "safe", "text": "...", "reason": "..."},
    {"type": "balanced", "text": "...", "reason": "..."},
    {"type": "bold", "text": "...", "reason": "..."}
  ],
  "proTip": "specific advice about this conversation",
  "interestLevel": 1-10,
  "mood": "her current mood/vibe"
}`;
};

// ==========================================
// Response Parsing (5.3.1, 5.3.2)
// ==========================================

const parseAIResponse = (content: string): AnalysisResult | null => {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        return null;
      }

      // Ensure suggestions have correct structure
      const suggestions: Suggestion[] = parsed.suggestions
        .map((s: Partial<Suggestion>) => ({
          type: s.type || 'balanced',
          text: s.text || '',
          reason: s.reason || '',
        }))
        .filter((s: Suggestion) => s.text);

      if (suggestions.length === 0) {
        return null;
      }

      return {
        suggestions,
        proTip: parsed.proTip || '',
        interestLevel:
          typeof parsed.interestLevel === 'number'
            ? Math.min(100, Math.max(0, parsed.interestLevel * 10)) // Convert 1-10 to 0-100
            : undefined,
        mood: parsed.mood || undefined,
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }
  return null;
};

const getFallbackResponse = (): AnalysisResult => ({
  suggestions: [
    {
      type: 'safe',
      text: "That's interesting! Tell me more about it 😊",
      reason: 'Safe opener to keep conversation going',
    },
    {
      type: 'balanced',
      text: 'I love that energy! What else is on your mind?',
      reason: 'Shows enthusiasm while staying engaged',
    },
    {
      type: 'bold',
      text: "You've got my attention now... what are you up to later?",
      reason: 'Direct but playful escalation',
    },
  ],
  proTip: 'Try being more specific with context for better suggestions',
});

// ==========================================
// API Functions (5.1.3, 5.1.4)
// ==========================================

export async function generateFlirtResponse(
  request: GenerateFlirtRequest
): Promise<AnalysisResult> {
  const { girl, herMessage, userCulture, context, apiKey } = request;

  const prompt = buildFlirtPrompt(girl, herMessage, userCulture, context);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are FlirtKey. Always respond with valid JSON only. No markdown, no code blocks, just raw JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    const parsed = parseAIResponse(content);
    if (!parsed) {
      console.warn('Failed to parse response, using fallback');
      return getFallbackResponse();
    }

    return parsed;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Rate limited. Please wait a moment and try again.');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your settings.');
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }
    }
    throw error;
  }
}

export async function analyzeScreenshot(
  request: AnalyzeScreenshotRequest
): Promise<AnalysisResult> {
  const { girl, imageBase64, apiKey } = request;

  const systemPrompt = buildScreenshotPrompt(girl);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this chat screenshot and suggest responses:' },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:')
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout for image analysis
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    const parsed = parseAIResponse(content);
    if (!parsed) {
      return {
        suggestions: [
          {
            type: 'safe',
            text: 'Could not analyze the image clearly',
            reason: 'Try a clearer screenshot',
          },
        ],
        proTip: 'Make sure the chat messages are clearly visible',
      };
    }

    return parsed;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Rate limited. Please wait a moment and try again.');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your settings.');
      }
    }
    throw error;
  }
}

// Legacy function signatures for backward compatibility
export async function generateResponse(
  apiKey: string,
  girl: Girl,
  herMessage: string,
  userCulture: Culture
): Promise<AnalysisResult> {
  return generateFlirtResponse({ girl, herMessage, userCulture, apiKey });
}

// Legacy analyzeScreenshot with positional args
export async function analyzeScreenshotLegacy(
  apiKey: string,
  imageBase64: string,
  girl: Girl | null,
  userCulture: Culture
): Promise<AnalysisResult> {
  return analyzeScreenshot({ girl, imageBase64, userCulture, apiKey });
}

export default {
  generateFlirtResponse,
  analyzeScreenshot,
  analyzeScreenshotLegacy,
  generateResponse,
  CULTURE_STYLES,
  STAGES,
};
