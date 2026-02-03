'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Scene } from '@/components/3d/Scene';
import { ChatPanel } from '@/components/ui/ChatPanel';
import { VoiceControl } from '@/components/ui/VoiceControl';
import { SettingsPanel } from '@/components/ui/SettingsPanel';
import { useStore } from '@/store/useStore';

type Expression = 'neutral' | 'happy' | 'thinking' | 'listening' | 'speaking' | 'greeting' | 'sad';

export default function Home() {
  const [expression, setExpression] = useState<Expression>('neutral');
  const [isRobotSpeaking, setIsRobotSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const { setListening, setSpeaking, addMessage } = useStore();
  const isProcessingRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());

  // 情感分析 - 根据文本判断表情
  const analyzeEmotion = useCallback((text: string): Expression => {
    const lowerText = text.toLowerCase();
    
    // 问候语
    const greetingWords = ['你好', '嗨', 'hello', 'hi', '早上好', '晚上好', '很高兴', '你好吗'];
    if (greetingWords.some(word => lowerText.includes(word.toLowerCase()))) {
      return 'greeting';
    }
    
    // 积极情感
    const happyWords = ['谢谢', '太棒了', '太好了', '开心', '高兴', '喜欢', '感谢', '不错', 'good', 'great', 'thanks'];
    if (happyWords.some(word => lowerText.includes(word.toLowerCase()))) {
      return 'happy';
    }
    
    // 负面情感
    const sadWords = ['难过', '伤心', '抱歉', '对不起', '遗憾', 'sad', 'sorry', 'unfortunately'];
    if (sadWords.some(word => lowerText.includes(word.toLowerCase()))) {
      return 'sad';
    }
    
    // 问题类型 - 思考中
    const questionWords = ['为什么', '怎么', '什么', '如何', '?', '吗', '能不能', '是否可以'];
    if (questionWords.some(word => lowerText.includes(word.toLowerCase()))) {
      return 'thinking';
    }
    
    return 'speaking';
  }, []);

  // 自动恢复到平静状态
  useEffect(() => {
    const checkIdle = () => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      
      // 5秒无操作恢复到平静
      if (idleTime > 5000 && expression !== 'neutral') {
        setExpression('neutral');
      }
    };
    
    const interval = setInterval(checkIdle, 1000);
    return () => clearInterval(interval);
  }, [expression]);

  // 处理用户消息发送
  const handleMessageSend = async (text: string) => {
    if (isProcessingRef.current || !text.trim()) return;

    isProcessingRef.current = true;
    lastActivityRef.current = Date.now();
    
    // 用户输入时，机器人进入聆听状态
    setExpression('listening');
    setIsThinking(false);
    setIsRobotSpeaking(false);
    setListening(true);
    setSpeaking(false);

    try {
      const apiKey = localStorage.getItem('zhipu_api_key') || process.env.NEXT_PUBLIC_ZHIPU_API_KEY || '';
      
      if (!apiKey) {
        alert('请先在设置中配置智谱AI API密钥');
        isProcessingRef.current = false;
        setExpression('neutral');
        setListening(false);
        return;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          apiKey
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      setIsThinking(false);
      setIsRobotSpeaking(true);
      setListening(false);
      setSpeaking(true);

      // 通知开始响应
      window.dispatchEvent(new CustomEvent('aiResponseStart'));

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader?.read() || { done: true, value: undefined };
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                // 根据回复内容动态调整表情
                const emotion = analyzeEmotion(fullResponse);
                if (emotion !== 'speaking' && expression !== emotion) {
                  setExpression(emotion);
                }
                // 发送AI响应片段事件
                window.dispatchEvent(new CustomEvent('aiResponseChunk', { detail: fullResponse }));
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      // 通知响应结束
      window.dispatchEvent(new CustomEvent('aiResponseEnd'));
      
      // 回复完成，根据完整内容判断最终表情
      const finalEmotion = analyzeEmotion(fullResponse);
      setExpression(finalEmotion);
      lastActivityRef.current = Date.now();

    } catch (error) {
      console.error('Error:', error);
      alert('获取AI响应失败，请检查网络连接和API密钥');
      setExpression('sad');
    } finally {
      isProcessingRef.current = false;
      setIsThinking(false);
      setIsRobotSpeaking(false);
      setListening(false);
      setSpeaking(false);
      
      // 延迟恢复到平静
      setTimeout(() => {
        if (!isProcessingRef.current) {
          setExpression('neutral');
        }
      }, 3000);
    }
  };

  // 监听语音控制的消息发送
  useEffect(() => {
    const handleMessage = (event: CustomEvent) => {
      handleMessageSend(event.detail);
    };

    window.addEventListener('sendMessage', handleMessage as EventListener);
    return () => {
      window.removeEventListener('sendMessage', handleMessage as EventListener);
    };
  }, [analyzeEmotion]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e]">
      {/* 3D场景 */}
      <Scene expression={expression} />

      <SettingsPanel />

      <VoiceControl 
        onTranscript={handleMessageSend}
        isRobotSpeaking={isRobotSpeaking}
      />

      <ChatPanel />

      {isThinking && (
        <div className="fixed top-6 right-20 z-30 px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-full text-sm backdrop-blur-md border border-yellow-500/30 flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full"
          />
          思考中...
        </div>
      )}

      {/* 状态指示器 */}
      <div className="fixed bottom-6 left-6 z-30 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white/70 text-sm border border-white/20">
        {expression === 'listening' && '👂 聆听模式'}
        {expression === 'speaking' && '🗣️ 说话中'}
        {expression === 'thinking' && '🤔 思考中'}
        {expression === 'happy' && '😊 开心'}
        {expression === 'greeting' && '👋 问候'}
        {expression === 'sad' && '😔 同情'}
        {expression === 'neutral' && '😐 等待输入'}
      </div>
    </main>
  );
}
