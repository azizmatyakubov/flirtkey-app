export interface Girl {
  id: number;
  name: string;
  nickname?: string;
  age?: number;
  culture?: string;
  personality?: string;
  interests?: string;
  occupation?: string;
  howMet?: string;
  relationshipStage: 'just_met' | 'talking' | 'flirting' | 'dating' | 'serious';
  herTextingStyle?: string;
  responseTime?: string;
  importantDates?: string;
  topics?: string;
  insideJokes?: string;
  redFlags?: string;
  greenLights?: string;
  lastTopic?: string;
  lastMessageDate?: string;
  messageCount: number;
  avatar?: string;
}

export interface User {
  id: number;
  telegramId?: string;
  name: string;
  culture: string;
  language: string;
}

export interface Suggestion {
  type: 'safe' | 'balanced' | 'bold';
  text: string;
  reason: string;
}

export interface AnalysisResult {
  suggestions: Suggestion[];
  proTip: string;
  interestLevel?: number;
  mood?: string;
}

export type Culture = 'uzbek' | 'russian' | 'western' | 'asian' | 'universal';
export type RelationshipStage = 'just_met' | 'talking' | 'flirting' | 'dating' | 'serious';
