// 类型定义

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ZhipuMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RobotExpression {
  eyeColor: string;
  eyeIntensity: number;
  mouthScale: number;
  headTilt: number;
  blinkRate: number;
}

export type ExpressionType = 'neutral' | 'happy' | 'thinking' | 'listening' | 'speaking' | 'greeting' | 'sad';

export interface ConversationState {
  messages: Message[];
  isListening: boolean;
  isSpeaking: boolean;
  currentExpression: ExpressionType;
}

export interface ZhipuResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}
