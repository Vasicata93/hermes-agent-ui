import { useState, useEffect, useRef, useCallback } from 'react';
import { Thread, Role, AppSettings } from '../types';

interface UseGenericVoiceProps {
  onSendMessage: (text: string) => void;
  isThinking: boolean;
  activeThread?: Thread;
  enabled: boolean;
  onTTS?: (text: string) => void;
  isPlayingAudio?: boolean;
  settings?: AppSettings;
}

export const useGenericVoice = ({ onSendMessage, isThinking, activeThread, enabled, onTTS, isPlayingAudio, settings }: UseGenericVoiceProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isThinkingRef = useRef(isThinking);
  const enabledRef = useRef(enabled);
  const hasFatalErrorRef = useRef(false);
  const hasPendingRequestRef = useRef(false);
  const hasRequestedMicPermissionRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);

  const isPlayingAudioRef = useRef(isPlayingAudio);
  const activeThreadRef = useRef(activeThread);

  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  const startListening = useCallback(async () => {
    if (recognitionRef.current && !isThinkingRef.current && !hasPendingRequestRef.current && !isListening) {
      try {
        if (!hasRequestedMicPermissionRef.current && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
           try {
             const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
             stream.getTracks().forEach(track => track.stop());
             hasRequestedMicPermissionRef.current = true;
           } catch (e) {
             // Let it fall through, recognitionRef.current.start() might still work or throw NotAllowed
           }
        }

        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
        hasFatalErrorRef.current = false;
      } catch (e: any) {
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' || e === 'not-allowed') {
           setError("Microphone access denied. Please allow permissions in browser settings.");
           hasFatalErrorRef.current = true;
        }
      }
    }
  }, [isListening]);

  // Safely track when audio stops to flush STT buffer and restart mic
  useEffect(() => {
    const wasPlaying = isPlayingAudioRef.current;
    isPlayingAudioRef.current = isPlayingAudio;

    if (wasPlaying && !isPlayingAudio) {
      if (isListening && recognitionRef.current) {
        try {
            recognitionRef.current.abort();
            setTranscript('');
            hasPendingRequestRef.current = false;
        } catch (e) {}
      }
      
      if (enabledRef.current && !isThinkingRef.current) {
         startListening();
      }
    }
  }, [isPlayingAudio, isListening, startListening]);

  const onTTSRef = useRef(onTTS);
  
  useEffect(() => {
    onTTSRef.current = onTTS;
  }, [onTTS]);

  const speak = useCallback((text: string) => {
    if (onTTS) {
       onTTS(text);
       return;
    }

    if (!synthRef.current) return;
    
    // Clean up markdown before speaking
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (enabledRef.current) {
        startListening();
      }
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (enabledRef.current) {
        startListening();
      }
    };

    synthRef.current.speak(utterance);
  }, [startListening, onTTS]);

  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      hasFatalErrorRef.current = false;
      hasPendingRequestRef.current = false;
      setError(null);
    }
  }, [enabled]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        // --- SMART AUTO-DETECT LOGIC ---
        const appInterfaceRo = settings?.interfaceLanguage === "ro";
        const aiResponseRo = settings?.aiProfile?.language === "Romanian";
        const sysLangs = navigator.languages || [navigator.language];
        const systemRo = sysLangs.some((l) => l && l.toLowerCase().includes("ro"));

        // Priority Logic: If ANY indicator points to Romanian, use 'ro-RO'.
        const langCode =
          appInterfaceRo || aiResponseRo || systemRo ? "ro-RO" : "en-US";

        recognitionRef.current.lang = langCode;

        recognitionRef.current.onresult = (event: any) => {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          let chunks = [];
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            let chunkText = event.results[i][0].transcript;
            if (!chunkText) continue;

            if (chunks.length > 0) {
               let prev = chunks[chunks.length - 1];
               if (chunkText.toLowerCase().trim().startsWith(prev.toLowerCase().trim()) && chunkText.length > prev.trim().length) {
                  chunks[chunks.length - 1] = chunkText;
                  continue;
               }
               const isAndroid = /Android/i.test(navigator.userAgent);
               if (isAndroid && chunkText.toLowerCase().trim() === prev.toLowerCase().trim()) {
                  chunks[chunks.length - 1] = chunkText;
                  continue;
               }
            }
            chunks.push(chunkText);
          }
          
          let currentTranscript = chunks.join('');
          
          // 1. SILENCE MIC IF AI IS SPEAKING
          // Prevents the AI from hearing itself and repeating "echoes".
          if (isPlayingAudioRef.current || isSpeakingRef.current || isThinkingRef.current) {
             setTranscript('');
             try {
                recognitionRef.current.abort(); // Shut off the mic immediately
             } catch(e) {}
             return;
          }

          setTranscript(currentTranscript);

          // 2. WAIT FOR HUMAN TO FINISH SPEAKING (DEBOUNCE)
          // Wait for 1.8 seconds of silence before finalizing.
          if (currentTranscript.trim()) {
             silenceTimerRef.current = setTimeout(() => {
                if (!hasPendingRequestRef.current && !isThinkingRef.current && !isPlayingAudioRef.current && !isSpeakingRef.current) {
                    hasPendingRequestRef.current = true;
                    onSendMessage(currentTranscript.trim());
                    setTranscript('');
                    try {
                       recognitionRef.current.abort(); // Pause listening until AI replies
                    } catch(e) {}
                }
             }, 1800);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
              setError("Microphone access denied. Please allow permissions in browser settings.");
              hasFatalErrorRef.current = true;
            } else if (event.error === 'audio-capture') {
              setError("No microphone found. Please ensure a microphone is connected.");
              hasFatalErrorRef.current = true;
            } else {
              setError(`Speech recognition error: ${event.error}`);
            }
            setIsListening(false);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          // Auto-restart if still enabled, NOT waiting for a request, NOT thinking, NOT playing audio, and no fatal error.
          if (
             enabledRef.current && 
             !hasPendingRequestRef.current && 
             !isThinkingRef.current && 
             !isPlayingAudioRef.current &&
             !isSpeakingRef.current &&
             !hasFatalErrorRef.current
          ) {
             try {
               recognitionRef.current?.start();
               setIsListening(true);
             } catch (e) {}
          }
        };
      } else {
        setError("Speech Recognition API is not supported in this browser.");
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [onSendMessage]);

  // Handle TTS when thinking stops
  useEffect(() => {
    const wasThinking = isThinkingRef.current;
    isThinkingRef.current = isThinking;

    // If it becomes true, we know React acknowledged the thinking state. We can clear the synchronous pending flag.
    if (isThinking && !wasThinking) {
      hasPendingRequestRef.current = false;
    }

    if (wasThinking && !isThinking && enabled && activeThread) {
      hasPendingRequestRef.current = false; // also clear here for safety
      // Model just finished generating
      const messages = activeThread.messages;
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage && lastMessage.role === Role.MODEL && lastMessage.content) {
        speak(lastMessage.content);
        if (enabled) {
          startListening();
        }
      } else if (enabled) {
        startListening();
      }
    }
  }, [isThinking, activeThread, enabled, speak, startListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  }, []);

  // Fake volume for visualizer
  useEffect(() => {
    let interval: any;
    if (isListening || isSpeaking) {
      interval = setInterval(() => {
        setVolume(Math.random() * 0.4 + 0.1);
      }, 100);
    } else {
      setVolume(0);
    }
    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);

  return {
    startListening,
    stopListening,
    isConnected: isListening || isSpeaking || isThinking,
    isSpeaking,
    transcript,
    volume,
    error
  };
};
