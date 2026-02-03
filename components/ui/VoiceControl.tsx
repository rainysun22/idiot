'use client';

import { useState, useEffect } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';

interface VoiceControlProps {
  onTranscript: (text: string) => void;
  isRobotSpeaking: boolean;
}

export function VoiceControl({ onTranscript, isRobotSpeaking }: VoiceControlProps) {
  const [isMuted, setIsMuted] = useState(false);
  const { setListening, setSpeaking, setExpression } = useStore();
  
  const { 
    isListening, 
    transcript, 
    finalTranscript, 
    interimTranscript,
    startListening, 
    stopListening,
    isSupported: recognitionSupported 
  } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      if (isFinal && transcript.trim()) {
        onTranscript(transcript);
      }
    }
  });

  const { 
    speak, 
    stop, 
    isSpeaking, 
    isSupported: synthesisSupported 
  } = useSpeechSynthesis();

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      setListening(false);
      setExpression('neutral');
    } else {
      startListening();
      setListening(true);
      setExpression('listening');
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
      stop();
      setIsMuted(true);
    }
  };

  // 监听AI响应事件并朗读
  useEffect(() => {
    const handleAIResponse = (event: CustomEvent) => {
      if (!isMuted) {
        setSpeaking(true);
        setExpression('speaking');
        speak(event.detail);
      }
    };
    
    window.addEventListener('aiResponse', handleAIResponse as EventListener);
    
    return () => {
      window.removeEventListener('aiResponse', handleAIResponse as EventListener);
    };
  }, [isMuted, speak, setSpeaking, setExpression]);

  // 监听语音合成结束
  useEffect(() => {
    if (!isSpeaking && isRobotSpeaking) {
      setSpeaking(false);
      setExpression('neutral');
    }
  }, [isSpeaking, isRobotSpeaking, setSpeaking, setExpression]);

  const displaySpeaking = isRobotSpeaking || isSpeaking;

  if (!recognitionSupported) {
    return (
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-red-500/20 text-red-300 rounded-full text-sm backdrop-blur-md">
        语音识别功能不支持，请使用文字输入
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-50">
      {/* 语音识别按钮 */}
      <motion.button
        onClick={handleToggleListening}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
          isListening
            ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse shadow-red-500/50'
            : 'bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 shadow-cyan-500/50'
        }`}
      >
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </motion.button>

      {/* 静音按钮 */}
      <motion.button
        onClick={handleToggleMute}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
          isMuted
            ? 'bg-gray-600 text-gray-400'
            : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
      >
        {isMuted ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </motion.button>
    </div>
  );
}
