/**
 * Validation utilities using Zod
 * Phase 2.3: Data Validation
 */

import { z } from 'zod';

// ==========================================
// Constants
// ==========================================

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 100;
const BIO_MAX_LENGTH = 2000;
const MIN_AGE = 18;
const MAX_AGE = 120;

// ==========================================
// Culture & Relationship Stage Schemas (2.3.2)
// ==========================================

export const CultureSchema = z.enum(['uzbek', 'russian', 'western', 'asian', 'universal']);

export const RelationshipStageSchema = z.enum([
  'just_met',
  'talking',
  'flirting',
  'dating',
  'serious',
]);

// ==========================================
// Contact Schema (2.3.2)
// ==========================================

export const ContactSchema = z.object({
  id: z.number().int().positive(),
  name: z
    .string()
    .min(NAME_MIN_LENGTH, 'Name is required')
    .max(NAME_MAX_LENGTH, `Name must be ${NAME_MAX_LENGTH} characters or less`)
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s\-'.]+$/u, 'Name contains invalid characters'),
  nickname: z.string().max(50, 'Nickname too long').optional(),
  age: z
    .number()
    .int('Age must be a whole number')
    .min(MIN_AGE, `Age must be at least ${MIN_AGE}`)
    .max(MAX_AGE, `Age must be at most ${MAX_AGE}`)
    .optional(),
  culture: z.string().max(50).optional(),
  personality: z.string().max(BIO_MAX_LENGTH, 'Personality description too long').optional(),
  interests: z.string().max(BIO_MAX_LENGTH, 'Interests too long').optional(),
  occupation: z.string().max(200, 'Occupation too long').optional(),
  howMet: z.string().max(500, 'How met description too long').optional(),
  relationshipStage: RelationshipStageSchema,
  theirTextingStyle: z.string().max(500).optional(),
  responseTime: z.string().max(100).optional(),
  importantDates: z.string().max(500).optional(),
  topics: z.string().max(BIO_MAX_LENGTH).optional(),
  insideJokes: z.string().max(BIO_MAX_LENGTH).optional(),
  redFlags: z.string().max(BIO_MAX_LENGTH).optional(),
  greenLights: z.string().max(BIO_MAX_LENGTH).optional(),
  lastTopic: z.string().max(500).optional(),
  lastMessageDate: z.string().datetime().optional(),
  messageCount: z.number().int().nonnegative(),
  avatar: z.string().url().optional(),
});

export const CreateContactSchema = ContactSchema.omit({ id: true, messageCount: true }).partial({
  relationshipStage: true,
});

export const UpdateContactSchema = ContactSchema.partial().omit({ id: true });

// ==========================================
// User Schema (2.3.3)
// ==========================================

export const UserSchema = z.object({
  id: z.number().int().positive(),
  telegramId: z.string().optional(),
  name: z
    .string()
    .min(NAME_MIN_LENGTH, 'Name is required')
    .max(NAME_MAX_LENGTH, `Name must be ${NAME_MAX_LENGTH} characters or less`),
  culture: z.string().max(50),
  language: z.string().max(20),
});

export const CreateUserSchema = UserSchema.omit({ id: true });

// ==========================================
// Suggestion Schema (2.3.4)
// ==========================================

export const SuggestionTypeSchema = z.enum(['safe', 'balanced', 'bold']);

export const SuggestionSchema = z.object({
  type: SuggestionTypeSchema,
  text: z.string().min(1, 'Suggestion text is required').max(2000, 'Suggestion too long'),
  reason: z.string().max(1000, 'Reason too long'),
});

// ==========================================
// Analysis Result Schema (2.3.4)
// ==========================================

export const AnalysisResultSchema = z.object({
  suggestions: z.array(SuggestionSchema).min(1).max(10),
  proTip: z.string().max(1000),
  interestLevel: z.number().min(0).max(100).optional(),
  mood: z.string().max(100).optional(),
});

// ==========================================
// API Response Schemas (2.3.4)
// ==========================================

export const OpenAIMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export const OpenAIChoiceSchema = z.object({
  index: z.number(),
  message: OpenAIMessageSchema,
  finish_reason: z.string().optional(),
});

export const OpenAIUsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
});

export const OpenAIResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(OpenAIChoiceSchema),
  usage: OpenAIUsageSchema.optional(),
});

// AI-parsed response (what we expect from the model's JSON)
export const AIFlirtResponseSchema = z.object({
  suggestions: z.array(SuggestionSchema),
  proTip: z.string(),
  interestLevel: z.number().min(0).max(100).optional(),
  mood: z.string().optional(),
});

// ==========================================
// Export/Import Schemas (2.3.4)
// ==========================================

export const ExportDataSchema = z.object({
  version: z.number().int().positive(),
  exportedAt: z.string().datetime(),
  data: z.object({
    user: UserSchema.nullable(),
    contacts: z.array(ContactSchema),
    conversationHistory: z.array(z.unknown()), // Flexible for now
    userCulture: CultureSchema,
  }),
  checksum: z.string(),
});

// ==========================================
// Input Sanitization Helpers (2.3.5)
// ==========================================

export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[<>]/g, ''); // Remove potential HTML
};

export const sanitizeName = (name: string): string => {
  return sanitizeString(name)
    .replace(/[^\p{L}\s\-'.]/gu, '') // Keep letters, spaces, hyphens, apostrophes, dots
    .slice(0, NAME_MAX_LENGTH);
};

export const sanitizeNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

// ==========================================
// Phone Validation (2.3.6)
// ==========================================

export const PhoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format')
  .optional();

export const validatePhone = (phone: string): { valid: boolean; formatted?: string } => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Check basic format
  if (!/^\+?[1-9]\d{6,14}$/.test(cleaned)) {
    return { valid: false };
  }

  // Format: +X XXX XXX XXXX or local format
  const formatted = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;

  return { valid: true, formatted };
};

// ==========================================
// Age Validation (2.3.7)
// ==========================================

export const AgeSchema = z
  .number()
  .int('Age must be a whole number')
  .min(MIN_AGE, `Must be at least ${MIN_AGE}`)
  .max(MAX_AGE, `Must be at most ${MAX_AGE}`);

export const validateAge = (age: unknown): { valid: boolean; value?: number; error?: string } => {
  const num = sanitizeNumber(age);
  if (num === undefined) {
    return { valid: true, value: undefined }; // Age is optional
  }

  const result = AgeSchema.safeParse(num);
  if (result.success) {
    return { valid: true, value: result.data };
  }

  const firstIssue = result.error.issues?.[0];
  return { valid: false, error: firstIssue?.message || 'Invalid age' };
};

// ==========================================
// Name Validation (2.3.8)
// ==========================================

export const NameSchema = z
  .string()
  .min(NAME_MIN_LENGTH, 'Name is required')
  .max(NAME_MAX_LENGTH, `Name must be ${NAME_MAX_LENGTH} characters or less`)
  .regex(/^[\p{L}\s\-'.]+$/u, 'Name contains invalid characters');

export const validateName = (name: string): { valid: boolean; value?: string; error?: string } => {
  const sanitized = sanitizeName(name);

  if (!sanitized) {
    return { valid: false, error: 'Name is required' };
  }

  const result = NameSchema.safeParse(sanitized);
  if (result.success) {
    return { valid: true, value: result.data };
  }

  const firstIssue = result.error.issues?.[0];
  return { valid: false, error: firstIssue?.message || 'Invalid name' };
};

// ==========================================
// Validation Error Messages (2.3.9)
// ==========================================

export const ValidationErrors = {
  NAME_REQUIRED: 'Name is required',
  NAME_TOO_LONG: `Name must be ${NAME_MAX_LENGTH} characters or less`,
  NAME_INVALID_CHARS: 'Name contains invalid characters',
  AGE_NOT_NUMBER: 'Age must be a number',
  AGE_TOO_YOUNG: `Age must be at least ${MIN_AGE}`,
  AGE_TOO_OLD: `Age must be at most ${MAX_AGE}`,
  PHONE_INVALID: 'Invalid phone number format',
  TEXT_TOO_LONG: 'Text is too long',
  INVALID_CULTURE: 'Invalid culture selection',
  INVALID_STAGE: 'Invalid relationship stage',
  INVALID_API_KEY: 'Invalid API key format',
  IMPORT_INVALID: 'Invalid import data format',
  IMPORT_CHECKSUM: 'Import data corrupted (checksum mismatch)',
} as const;

export const getValidationError = (error: z.ZodError): string => {
  const firstIssue = error.issues?.[0];
  if (!firstIssue) return 'Validation failed';

  const path = firstIssue.path.join('.');
  return path ? `${path}: ${firstIssue.message}` : firstIssue.message;
};

// ==========================================
// API Key Validation
// ==========================================

export const ApiKeySchema = z
  .string()
  .min(20, 'API key too short')
  .max(200, 'API key too long')
  .regex(/^sk-[a-zA-Z0-9\-_]+$/, 'Invalid API key format');

export const validateApiKey = (key: string): { valid: boolean; error?: string } => {
  const result = ApiKeySchema.safeParse(key.trim());
  if (result.success) {
    return { valid: true };
  }
  const firstIssue = result.error.issues?.[0];
  return { valid: false, error: firstIssue?.message || 'Invalid API key' };
};

// ==========================================
// Full Validation Functions (2.3.10)
// ==========================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

export const validateContact = (data: unknown): ValidationResult<z.infer<typeof ContactSchema>> => {
  return ContactSchema.safeParse(data);
};

export const validateCreateContact = (
  data: unknown
): ValidationResult<z.infer<typeof CreateContactSchema>> => {
  return CreateContactSchema.safeParse(data);
};

export const validateUser = (data: unknown): ValidationResult<z.infer<typeof UserSchema>> => {
  return UserSchema.safeParse(data);
};

export const validateSuggestion = (
  data: unknown
): ValidationResult<z.infer<typeof SuggestionSchema>> => {
  return SuggestionSchema.safeParse(data);
};

export const validateAnalysisResult = (
  data: unknown
): ValidationResult<z.infer<typeof AnalysisResultSchema>> => {
  return AnalysisResultSchema.safeParse(data);
};

export const validateAIResponse = (
  data: unknown
): ValidationResult<z.infer<typeof AIFlirtResponseSchema>> => {
  return AIFlirtResponseSchema.safeParse(data);
};

export const validateExportData = (
  data: unknown
): ValidationResult<z.infer<typeof ExportDataSchema>> => {
  return ExportDataSchema.safeParse(data);
};

// ==========================================
// Type Exports
// ==========================================

export type ValidatedContact = z.infer<typeof ContactSchema>;
export type ValidatedCreateContact = z.infer<typeof CreateContactSchema>;
export type ValidatedUser = z.infer<typeof UserSchema>;
export type ValidatedSuggestion = z.infer<typeof SuggestionSchema>;
export type ValidatedAnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type ValidatedAIResponse = z.infer<typeof AIFlirtResponseSchema>;
export type ValidatedExportData = z.infer<typeof ExportDataSchema>;

export default {
  // Schemas
  ContactSchema,
  CreateContactSchema,
  UpdateContactSchema,
  UserSchema,
  SuggestionSchema,
  AnalysisResultSchema,
  CultureSchema,
  RelationshipStageSchema,
  ApiKeySchema,
  PhoneSchema,
  AgeSchema,
  NameSchema,
  // Validators
  validateContact,
  validateCreateContact,
  validateUser,
  validateSuggestion,
  validateAnalysisResult,
  validateAIResponse,
  validateExportData,
  validateApiKey,
  validatePhone,
  validateAge,
  validateName,
  // Helpers
  sanitizeString,
  sanitizeName,
  sanitizeNumber,
  getValidationError,
  ValidationErrors,
};
