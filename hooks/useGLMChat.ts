import { useState, useCallback, useRef } from 'react';
import { createZhipuClient } from '@/lib/glm';
import { Message } from '@/types';

interface UseGLMChatOptions {
  apiKey?: string;
  onMessageChunk?: (chunk: string) => void;
  onError?: (error: Error) => void;
}

export function useGLMChat(options: UseGLMChatOptions = {}) {
  const { apiKey, onMessageChunk, onError } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const clientRef = useRef(createZhipuClient(apiKey || process.env.NEXT_PUBLIC_ZHIPU_API_KEY || ''));
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    try {
      setIsLoading(true);
      setCurrentResponse('');
      
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      let fullResponse = '';
      
      for await (const chunk of clientRef.current.streamChat(message)) {
        fullResponse += chunk;
        setCurrentResponse(fullResponse);
        onMessageChunk?.(chunk);
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now()
      };

      setIsLoading(false);
      abortControllerRef.current = null;
      
      return assistantMessage;
    } catch (error) {
      setIsLoading(false);
      const err = error as Error;
      console.error('GLM chat error:', err);
      onError?.(err);
      throw err;
    }
  }, [onMessageChunk, onError]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    clientRef.current.clearMessages();
  }, []);

  return {
    isLoading,
    currentResponse,
    sendMessage,
    cancelRequest,
    clearHistory
  };
}
