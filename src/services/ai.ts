import axios from 'axios';
import { Girl, Culture, AnalysisResult, Suggestion } from '../types';

const CULTURE_STYLES = {
  uzbek: {
    traits: [
      "Respectful and traditional approach",
      "Family values are important",
      "Subtle compliments work better than direct",
    ],
    avoid: ["Too sexual too early", "Disrespecting traditions"],
  },
  russian: {
    traits: [
      "Confidence is key",
      "Intellectual conversations appreciated",
      "Being a gentleman matters",
    ],
    avoid: ["Being cheap", "Weak/indecisive behavior"],
  },
  western: {
    traits: [
      "Be direct but not creepy",
      "Humor and wit are attractive",
      "Keep it casual initially",
    ],
    avoid: ["Love bombing", "Being too serious too fast"],
  },
  asian: {
    traits: [
      "Patience is important",
      "Subtle hints over direct statements",
      "Emotional support valued",
    ],
    avoid: ["Being too aggressive", "Rushing"],
  },
  universal: {
    traits: [
      "Be genuine and authentic",
      "Listen more than talk",
      "Match her energy",
    ],
    avoid: ["Generic pickup lines", "Being desperate"],
  },
};

const STAGES = {
  just_met: { name: "Just Met", tone: "Friendly, curious, light" },
  talking: { name: "Talking Stage", tone: "Warmer, more personal" },
  flirting: { name: "Active Flirting", tone: "Playful, suggestive, confident" },
  dating: { name: "Dating", tone: "Romantic, caring, future-oriented" },
  serious: { name: "Serious", tone: "Loving, supportive, playful" },
};

export async function generateResponse(
  apiKey: string,
  girl: Girl,
  herMessage: string,
  userCulture: Culture
): Promise<AnalysisResult> {
  const culture = CULTURE_STYLES[girl.culture as Culture || userCulture || 'universal'];
  const stage = STAGES[girl.relationshipStage || 'just_met'];

  const prompt = `You are FlirtKey, an expert dating assistant.

## ABOUT HER (${girl.name}):
- Age: ${girl.age || 'Unknown'}
- Personality: ${girl.personality || 'Unknown'}
- Interests: ${girl.interests || 'Unknown'}
- How they met: ${girl.howMet || 'Unknown'}
- Relationship Stage: ${stage.name}
- Things she loves: ${girl.greenLights || 'Unknown'}
- Things to AVOID: ${girl.redFlags || 'Unknown'}
- Inside jokes: ${girl.insideJokes || 'None yet'}

## CULTURAL GUIDELINES:
${culture.traits.map(t => `- ${t}`).join('\n')}
AVOID: ${culture.avoid.join(', ')}

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

Keep ${stage.tone} tone. Be specific and actionable.`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are FlirtKey. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const content = response.data.choices[0].message.content;
  
  // Parse JSON from response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }

  // Fallback
  return {
    suggestions: [
      { type: 'safe', text: 'Sorry, try again!', reason: 'Error occurred' },
    ],
    proTip: 'Try being more specific with context',
  };
}

export async function analyzeScreenshot(
  apiKey: string,
  imageBase64: string,
  girl: Girl | null,
  userCulture: Culture
): Promise<AnalysisResult> {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are FlirtKey analyzing a chat screenshot.
${girl ? `Context: Talking to ${girl.name}, ${STAGES[girl.relationshipStage]?.name} stage.` : 'No prior context.'}
Analyze and respond with JSON: {"suggestions": [...], "proTip": "...", "interestLevel": 1-10, "mood": "..."}`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this chat and suggest responses:' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 1500,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const content = response.data.choices[0].message.content;
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }

  return {
    suggestions: [{ type: 'safe', text: 'Error analyzing image', reason: '' }],
    proTip: 'Try a clearer screenshot',
  };
}
