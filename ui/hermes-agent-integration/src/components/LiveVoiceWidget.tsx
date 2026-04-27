import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor } from 'lucide-react';
import { useGenericVoice } from '../hooks/useGenericVoice';
import { Role, AppSettings, Thread } from '../types';

interface LiveVoiceWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onAddMessage?: (role: Role, content: string) => string | null;
  onUpdateMessage?: (id: string, content: string) => void;
  settings?: AppSettings;
  activeThread?: Thread;
  isThinking?: boolean;
  onGenericSendMessage?: (text: string) => void;
  onTTS?: (text: string) => void;
  isPlayingAudio?: boolean;
  onShareScreen?: () => void;
}

export const LiveVoiceWidget: React.FC<LiveVoiceWidgetProps> = ({ 
  isOpen,
  onClose,
  settings,
  activeThread,
  isThinking = false,
  onGenericSendMessage,
  onTTS,
  isPlayingAudio,
  onShareScreen
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const generic = useGenericVoice({
    onSendMessage: onGenericSendMessage || (() => {}),
    isThinking,
    activeThread,
    enabled: isOpen,
    onTTS,
    isPlayingAudio,
    settings
  });

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      generic.startListening();
    } else {
      setIsVisible(false);
      generic.stopListening();
    }
    return () => {
      generic.stopListening();
    };
  }, [isOpen]);

  const isConnected = generic.isConnected;
  const isSpeaking = generic.isSpeaking;
  const currentVolume = generic.volume;
  const currentError = generic.error;

  return (
    <AnimatePresence>
      {isOpen && isVisible && (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          className="fixed bottom-24 right-8 z-[100] w-20 h-20 cursor-grab active:cursor-grabbing group"
        >
          <div className="absolute inset-0 bg-pplx-primary/20 backdrop-blur-[40px] rounded-full border border-white/30 shadow-[0_0_60px_rgba(32,184,205,0.5),inset_0_0_20px_rgba(255,255,255,0.1)] overflow-hidden flex items-center justify-center">
            {/* Realistic Robotic Avatar */}
            <div className="relative w-full h-full flex items-center justify-center scale-110">
              {/* Background Energy Core - Layered */}
              <motion.div
                animate={{
                  scale: isConnected ? [1, 1.4, 1] : 1,
                  opacity: isConnected ? [0.1, 0.4, 0.1] : 0.05,
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-4/5 h-4/5 bg-pplx-accent/15 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: isConnected ? [1.2, 1, 1.2] : 1,
                  opacity: isConnected ? [0.05, 0.2, 0.05] : 0,
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-full h-full bg-pplx-accent/10 rounded-full blur-2xl"
              />

              {/* Robotic Head Structure */}
              <motion.div 
                animate={{
                  y: [0, -3, 0],
                  rotate: isSpeaking ? [0, 1.5, -1.5, 0] : 0
                }}
                transition={{
                  y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 0.4, repeat: Infinity }
                }}
                className="relative z-10 w-12 h-15 flex flex-col items-center"
              >
                {/* Head Shell - Metallic Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] rounded-[42%_42%_48%_48%] border border-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]" />
                
                {/* Visor / Eyes Area */}
                <div className="relative mt-4 w-10 h-4.5 bg-[#050505] rounded-full border border-pplx-accent/30 overflow-hidden flex items-center justify-center gap-3 shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                  {/* Digital Eyes - Glow Intensity */}
                  {[...Array(2)].map((_, i) => (
                    <motion.div
                      key={`eye-${i}`}
                      animate={{
                        scaleY: [1, 1, 0.05, 1, 1],
                        opacity: isConnected ? 1 : 0.2,
                        filter: isSpeaking 
                          ? [`drop-shadow(0 0 2px #20b8cd)`, `drop-shadow(0 0 8px #20b8cd)`, `drop-shadow(0 0 2px #20b8cd)`]
                          : `drop-shadow(0 0 2px #20b8cd)`
                      }}
                      transition={{
                        scaleY: { duration: 5, repeat: Infinity, times: [0, 0.48, 0.5, 0.52, 1], delay: i * 0.3 },
                        filter: { duration: 0.2, repeat: Infinity }
                      }}
                      className={`w-1.5 h-1.5 rounded-full ${currentError ? 'bg-red-500' : 'bg-pplx-accent'}`}
                    />
                  ))}
                  
                  {/* Scanning Line - Subtle */}
                  <motion.div
                    animate={{ x: [-25, 25] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 w-1 bg-pplx-accent/10 blur-[2px]"
                  />
                </div>

                {/* Mouth / Audio Reactive Component - High Density */}
                <div className="mt-2.5 flex items-end justify-center gap-[1px] h-3.5 w-7">
                  {[...Array(9)].map((_, i) => (
                    <motion.div
                      key={`mouth-bar-${i}`}
                      animate={{
                        height: isSpeaking ? [2, 2 + (currentVolume * 14 * (1 - Math.abs(i - 4) * 0.22)), 2] : 2,
                        opacity: isConnected ? 0.9 : 0.15,
                      }}
                      transition={{
                        duration: 0.08,
                        repeat: Infinity,
                        delay: i * 0.02
                      }}
                      className={`w-[1.5px] rounded-full ${currentError ? 'bg-red-500' : 'bg-pplx-accent'}`}
                    />
                  ))}
                </div>

                {/* Mechanical Details - Side Sensors */}
                <div className="absolute -left-1.5 top-6 w-2.5 h-5 bg-[#1a1a1a] rounded-l-full border-l border-white/10 shadow-sm" />
                <div className="absolute -right-1.5 top-6 w-2.5 h-5 bg-[#1a1a1a] rounded-r-full border-r border-white/10 shadow-sm" />
                
                {/* Neck Piece - Articulated */}
                <div className="absolute -bottom-2.5 w-7 h-3.5 bg-gradient-to-b from-[#1a1a1a] to-[#050505] rounded-b-xl border-x border-white/10" />
              </motion.div>

              {/* Orbiting Tech Rings - 3D Effect */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`tech-ring-${i}`}
                  animate={{
                    rotate: i % 2 === 0 ? 360 : -360,
                    scale: isSpeaking ? [1, 1.15, 1] : 1,
                    opacity: isConnected ? [0.1, 0.3, 0.1] : 0.05
                  }}
                  transition={{
                    rotate: { duration: 12 + i * 8, repeat: Infinity, ease: "linear" },
                    scale: { duration: 0.3, repeat: Infinity },
                    opacity: { duration: 3, repeat: Infinity }
                  }}
                  className="absolute inset-0 rounded-full border border-pplx-accent/10 border-t-pplx-accent/40"
                  style={{ 
                    transform: `rotateX(${55 + i * 15}deg) rotateY(${i * 30}deg)`,
                    borderWidth: '0.5px'
                  }}
                />
              ))}

              {/* Voice Pulse Rings - Cinematic */}
              <AnimatePresence>
                {isSpeaking && (
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0.6 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 border-[0.5px] border-pplx-accent/50 rounded-full"
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Error Message Tooltip */}
          {currentError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 bg-red-500/90 backdrop-blur-md text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl text-center border border-red-400/50"
            >
              {currentError}
            </motion.div>
          )}

          {/* Screen Share Button */}
          {onShareScreen && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onShareScreen();
              }}
              className="absolute -top-1 leading-none -left-4 p-2 rounded-full bg-[#20b8cd] text-black opacity-0 group-hover:opacity-100 hover:bg-[#20b8cd]/80 transition-all z-20 shadow-[0_0_10px_rgba(32,184,205,0.5)] border border-[#20b8cd]/30"
              title="Add screen to context"
            >
              <Monitor size={14} strokeWidth={2.5} />
            </button>
          )}

          {/* Close Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute -top-1 -right-4 p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all z-20 shadow-[0_0_10px_rgba(239,68,68,0.5)] border border-red-500/30"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
