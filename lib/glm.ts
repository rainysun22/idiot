import { ZhipuMessage, StreamChunk } from '@/types';

const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

export class ZhipuClient {
  private apiKey: string;
  private model: string;
  private messages: ZhipuMessage[] = [];

  constructor(apiKey: string, model: string = 'glm-4') {
    this.apiKey = apiKey;
    this.model = model;
  }

  addMessage(role: ZhipuMessage['role'], content: string) {
    this.messages.push({ role, content });
  }

  clearMessages() {
    this.messages = [];
  }

  async *streamChat(userMessage: string): AsyncGenerator<string> {
    this.addMessage('user', userMessage);

    try {
      const response = await fetch(ZHIPU_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data) as StreamChunk;
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      this.addMessage('assistant', fullContent);
    } catch (error) {
      console.error('Zhipu API error:', error);
      throw error;
    }
  }

  async chat(userMessage: string): Promise<string> {
    let fullResponse = '';
    for await (const chunk of this.streamChat(userMessage)) {
      fullResponse += chunk;
    }
    return fullResponse;
  }
}

export function createZhipuClient(apiKey: string) {
  return new ZhipuClient(apiKey);
}
