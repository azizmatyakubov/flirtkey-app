/**
 * OCR Service (Phase 7.2.12)
 *
 * Fallback OCR for when Vision API fails or for text extraction:
 * - Uses on-device text recognition (where available)
 * - Falls back to simple image-to-text prompting
 * - Provides text extraction from screenshots
 */

import { toDataUri } from '../utils/imageUtils';

// ==========================================
// Types
// ==========================================

export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  error?: string;
  method: 'vision-api' | 'fallback-prompt' | 'device-ocr';
}

export interface MessageExtraction {
  messages: ExtractedMessage[];
  participants: string[];
  platform?: string;
}

export interface ExtractedMessage {
  sender: 'them' | 'you' | 'unknown';
  text: string;
  timestamp?: string;
  order: number;
}

// ==========================================
// OCR Constants
// ==========================================

const OCR_PROMPT = `You are an OCR text extraction specialist. Extract ALL text from this image exactly as it appears.

Return ONLY the extracted text, preserving:
- Line breaks
- Message order
- Any visible timestamps
- Speaker indicators (names, "You", arrows, etc.)

Do not add commentary. Just extract the raw text.`;

const MESSAGE_EXTRACTION_PROMPT = `Analyze this chat screenshot and extract the conversation.

Return JSON with this structure:
{
  "platform": "whatsapp" | "imessage" | "instagram" | "tinder" | "bumble" | "other",
  "participants": ["You", "Her Name"],
  "messages": [
    {
      "sender": "them" | "you",
      "text": "message content",
      "timestamp": "if visible",
      "order": 1
    }
  ]
}

Extract messages in chronological order (oldest first).
Identify "them" vs "you" based on message alignment/colors/indicators.
Include ONLY the JSON, no other text.`;

// ==========================================
// OCR Service
// ==========================================

/**
 * Extract text from an image using Vision API
 * This is the primary OCR method
 */
export async function extractTextFromImage(
  imageBase64: string,
  apiKey: string
): Promise<OCRResult> {
  try {
    const dataUri = toDataUri(imageBase64);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: OCR_PROMPT,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract all text from this image:' },
              {
                type: 'image_url',
                image_url: {
                  url: dataUri,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1, // Low temperature for accuracy
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      success: true,
      text: text.trim(),
      confidence: 0.9,
      method: 'vision-api',
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'OCR failed',
      method: 'vision-api',
    };
  }
}

/**
 * Extract structured messages from a chat screenshot
 * Returns parsed conversation with sender identification
 */
export async function extractMessagesFromScreenshot(
  imageBase64: string,
  apiKey: string
): Promise<MessageExtraction> {
  try {
    const dataUri = toDataUri(imageBase64);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: MESSAGE_EXTRACTION_PROMPT,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract messages from this chat screenshot:' },
              {
                type: 'image_url',
                image_url: {
                  url: dataUri,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      messages: (parsed.messages || []).map(
        (m: { sender?: string; text?: string; timestamp?: string }, i: number) => ({
          sender: m.sender || 'unknown',
          text: m.text || '',
          timestamp: m.timestamp,
          order: i + 1,
        })
      ),
      participants: parsed.participants || [],
      platform: parsed.platform,
    };
  } catch (error) {
    if (__DEV__) console.error('Message extraction failed:', error);
    return {
      messages: [],
      participants: [],
    };
  }
}

/**
 * Simple fallback OCR using basic prompting
 * Used when primary OCR fails
 */
export async function fallbackOCR(imageBase64: string, apiKey: string): Promise<OCRResult> {
  try {
    const dataUri = toDataUri(imageBase64);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use mini for fallback (cheaper)
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Read and transcribe all text visible in this image. Return only the text content.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUri,
                  detail: 'low', // Low detail for faster processing
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Fallback API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      success: true,
      text: text.trim(),
      confidence: 0.7, // Lower confidence for fallback
      method: 'fallback-prompt',
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Fallback OCR failed',
      method: 'fallback-prompt',
    };
  }
}

/**
 * Combined OCR with automatic fallback
 * Tries primary OCR first, falls back if needed
 */
export async function performOCR(imageBase64: string, apiKey: string): Promise<OCRResult> {
  // Try primary OCR first
  const primary = await extractTextFromImage(imageBase64, apiKey);

  if (primary.success && primary.text.length > 10) {
    return primary;
  }

  // Fall back to simpler method
  const fallback = await fallbackOCR(imageBase64, apiKey);

  if (fallback.success) {
    return fallback;
  }

  // Return the primary error if both failed
  return primary;
}

/**
 * Analyze screenshot with OCR fallback
 * Enhanced version that uses OCR when Vision analysis is incomplete
 */
export async function analyzeWithOCRFallback(
  imageBase64: string,
  apiKey: string,
  _userCulture?: string // Reserved for future culture-aware OCR
): Promise<{
  ocrText?: string;
  messages?: MessageExtraction;
  analysisUsedOCR: boolean;
}> {
  // First, try to extract messages
  const messages = await extractMessagesFromScreenshot(imageBase64, apiKey);

  // If we got messages, we're good
  if (messages.messages.length > 0) {
    return {
      messages,
      analysisUsedOCR: true,
    };
  }

  // Fall back to raw OCR
  const ocrResult = await performOCR(imageBase64, apiKey);

  return {
    ocrText: ocrResult.success ? ocrResult.text : undefined,
    analysisUsedOCR: ocrResult.success,
  };
}

// ==========================================
// Export
// ==========================================

export const OCRService = {
  extractTextFromImage,
  extractMessagesFromScreenshot,
  fallbackOCR,
  performOCR,
  analyzeWithOCRFallback,
};

export default OCRService;
