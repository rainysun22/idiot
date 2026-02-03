import { useState, useCallback, useEffect } from 'react';

interface SpeechSynthesisOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function useSpeechSynthesis(options: SpeechSynthesisOptions = {}) {
  const {
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    onStart,
    onEnd,
    onError
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // 获取可用语音
      const loadVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        const zhVoices = allVoices.filter(v => v.lang.includes('zh'));
        setVoices(zhVoices);
        
        // 默认选择第一个中文语音
        if (zhVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(zhVoices[0]);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  const speak = useCallback(async (text: string, voiceUri?: string) => {
    if (!isSupported) {
      console.error('Speech synthesis is not supported');
      onError?.('Speech synthesis is not supported');
      return;
    }

    // 停止当前播放
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // 选择语音
    const voiceToUse = voiceUri 
      ? voices.find(v => v.voiceURI === voiceUri) 
      : selectedVoice;
    
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      console.error('Speech synthesis error:', event.error);
      onError?.(event.error || 'Speech synthesis error');
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, rate, pitch, volume, selectedVoice, voices, onStart, onEnd, onError]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.pause();
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice
  };
}
