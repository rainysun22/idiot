'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function ChatPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addMessage } = useStore();
  const currentAssistantIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isExpanded]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
    
    setLocalMessages(prev => [...prev, userMsg]);
    addMessage(userMsg);
    
    window.dispatchEvent(new CustomEvent('sendMessage', { detail: input }));
    
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setUnreadCount(0);
    }
  };

  // 监听AI流式响应
  useEffect(() => {
    const handleAIResponseStart = () => {
      setIsTyping(true);
      const id = Date.now().toString();
      currentAssistantIdRef.current = id;
      
      const assistantMsg: Message = {
        id,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };
      setLocalMessages(prev => [...prev, assistantMsg]);
    };

    const handleAIResponseChunk = (event: CustomEvent) => {
      if (currentAssistantIdRef.current) {
        setLocalMessages(prev => 
          prev.map(msg => 
            msg.id === currentAssistantIdRef.current 
              ? { ...msg, content: event.detail }
              : msg
          )
        );
      }
    };

    const handleAIResponseEnd = () => {
      setIsTyping(false);
      
      // 添加到store
      const lastMsg = localMessages[localMessages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        addMessage(lastMsg);
      }
      
      currentAssistantIdRef.current = null;
      
      if (!isExpanded) {
        setUnreadCount(prev => prev + 1);
      }
    };

    window.addEventListener('aiResponseStart', handleAIResponseStart as EventListener);
    window.addEventListener('aiResponseChunk', handleAIResponseChunk as EventListener);
    window.addEventListener('aiResponseEnd', handleAIResponseEnd as EventListener);

    return () => {
      window.removeEventListener('aiResponseStart', handleAIResponseStart as EventListener);
      window.removeEventListener('aiResponseChunk', handleAIResponseChunk as EventListener);
      window.removeEventListener('aiResponseEnd', handleAIResponseEnd as EventListener);
    };
  }, [addMessage, isExpanded, localMessages]);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col w-[380px] h-[520px] bg-black/80 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-white font-medium">AI 对话</span>
                {isTyping && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-xs text-cyan-400"
                  >
                    正在输入...
                  </motion.div>
                )}
              </div>
              <button
                onClick={toggleExpand}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              <AnimatePresence mode="popLayout">
                {localMessages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex items-center justify-center"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </motion.div>
                ) : (
                  localMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-br-sm'
                          : 'bg-white/10 text-white rounded-bl-sm border border-white/10'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content || '...'}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="p-3 border-t border-white/10 bg-white/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-cyan-500 text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all"
                >
                  发送
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleExpand}
            className="relative w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center"
          >
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
              )}
            </AnimatePresence>

            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
