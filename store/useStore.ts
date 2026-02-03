import { create } from 'zustand';
import { Message, ExpressionType } from '@/types';

interface AppState {
  messages: Message[];
  isListening: boolean;
  isSpeaking: boolean;
  currentExpression: ExpressionType;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setListening: (isListening: boolean) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  setExpression: (expression: ExpressionType) => void;
}

export const useStore = create<AppState>((set) => ({
  messages: [],
  isListening: false,
  isSpeaking: false,
  currentExpression: 'neutral',
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  clearMessages: () => set({ messages: [] }),
  
  setListening: (isListening) => set({ isListening }),
  
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  
  setExpression: (currentExpression) => set({ currentExpression }),
}));
