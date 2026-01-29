/**
 * GIF Service - Giphy API integration
 * Phase 2, Task 3: GIF/Meme Suggestion Engine
 */

import axios from 'axios';
import Constants from 'expo-constants';

// Use Expo Constants for API key, fall back to public beta key for dev
const GIPHY_API_KEY: string =
  (Constants.expoConfig?.extra?.['giphyApiKey'] as string | undefined) ??
  'dc6zaTOxFJmzC';
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

// ==========================================
// Types
// ==========================================

export interface GifResult {
  id: string;
  url: string;
  previewUrl: string;
  title: string;
  width: number;
  height: number;
}

export interface GifSuggestionResult {
  gifs: GifResult[];
  searchTermUsed: string;
}

// ==========================================
// Core Functions
// ==========================================

/**
 * Search GIFs from Giphy API
 */
export async function searchGifs(query: string, limit: number = 5): Promise<GifResult[]> {
  try {
    const response = await axios.get(`${GIPHY_BASE_URL}/search`, {
      params: {
        api_key: GIPHY_API_KEY,
        q: query,
        limit,
        rating: 'pg-13',
        lang: 'en',
      },
      timeout: 10000,
    });

    const data = response.data?.data;
    if (!Array.isArray(data)) return [];

    return data.map((gif: any) => ({
      id: gif.id,
      url: gif.images?.original?.url || gif.images?.downsized?.url || '',
      previewUrl: gif.images?.fixed_width?.url || gif.images?.preview_gif?.url || '',
      title: gif.title || '',
      width: parseInt(gif.images?.fixed_width?.width || '200', 10),
      height: parseInt(gif.images?.fixed_width?.height || '200', 10),
    })).filter((g: GifResult) => g.url && g.previewUrl);
  } catch (error) {
    if (__DEV__) console.error('Giphy search failed:', error);
    return [];
  }
}

/**
 * Get trending GIFs as fallback
 */
export async function getTrendingGifs(limit: number = 3): Promise<GifResult[]> {
  try {
    const response = await axios.get(`${GIPHY_BASE_URL}/trending`, {
      params: {
        api_key: GIPHY_API_KEY,
        limit,
        rating: 'pg-13',
      },
      timeout: 10000,
    });

    const data = response.data?.data;
    if (!Array.isArray(data)) return [];

    return data.map((gif: any) => ({
      id: gif.id,
      url: gif.images?.original?.url || gif.images?.downsized?.url || '',
      previewUrl: gif.images?.fixed_width?.url || gif.images?.preview_gif?.url || '',
      title: gif.title || '',
      width: parseInt(gif.images?.fixed_width?.width || '200', 10),
      height: parseInt(gif.images?.fixed_width?.height || '200', 10),
    })).filter((g: GifResult) => g.url && g.previewUrl);
  } catch {
    return [];
  }
}

/**
 * AI picks search terms based on conversation context, then fetches matching GIFs
 */
export async function getSuggestedGifs(
  context: string,
  apiKey: string,
  limit: number = 3
): Promise<GifSuggestionResult> {
  try {
    // Use AI to pick the best GIF search term based on conversation context
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You suggest GIF search terms for dating conversations. Given the conversation context, suggest ONE short, specific GIF search query (2-4 words) that would be a funny, flirty, or relevant reaction GIF to send. Return ONLY the search query, nothing else. Examples: "smooth operator", "blushing anime", "mic drop", "heart eyes", "flirty wink"`,
          },
          {
            role: 'user',
            content: `Conversation context: "${context}"`,
          },
        ],
        max_tokens: 30,
        temperature: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const searchTerm = response.data?.choices?.[0]?.message?.content?.trim() || 'flirty reaction';
    const gifs = await searchGifs(searchTerm, limit);

    return {
      gifs,
      searchTermUsed: searchTerm,
    };
  } catch (error) {
    if (__DEV__) console.error('AI GIF suggestion failed:', error);
    // Fallback to a generic flirty search
    const gifs = await searchGifs('flirty reaction', limit);
    return {
      gifs,
      searchTermUsed: 'flirty reaction',
    };
  }
}

/**
 * Determine if a GIF suggestion is appropriate for the context
 * Returns true when the conversation seems like a good moment for a GIF
 */
export function shouldSuggestGif(theirMessage: string): boolean {
  const lowerMsg = theirMessage.toLowerCase();
  
  // Good moments for GIFs: humor, reactions, short messages, flirty vibes
  const gifTriggers = [
    'haha', 'lol', 'lmao', '😂', '🤣', 'omg', 'no way',
    'really?', 'wow', 'damn', 'nice', 'same', 'mood',
    'miss you', 'thinking of you', 'goodnight', 'good morning',
    '❤️', '😍', '🥰', '😘', 'cute', 'hot',
  ];

  // Check for negative/serious context — don't suggest GIFs
  const seriousTriggers = [
    'hurt', 'upset', 'angry', 'sad', 'cry', 'break up', 'broken',
    'need to talk', 'we need', 'serious', 'worried', 'sorry for',
    'funeral', 'died', 'hospital', 'emergency', 'lost',
  ];
  if (seriousTriggers.some(t => lowerMsg.includes(t))) return false;

  // Check for GIF-worthy content
  if (gifTriggers.some(trigger => lowerMsg.includes(trigger))) return true;

  // Short messages can be good for GIF reactions (but only if not serious)
  if (theirMessage.length < 20) return true;

  return false;
}

export const GifService = {
  searchGifs,
  getTrendingGifs,
  getSuggestedGifs,
  shouldSuggestGif,
};

export default GifService;
