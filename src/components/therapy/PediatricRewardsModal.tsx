import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy, Sparkles, Award, Play, RotateCcw, Heart, CheckCircle2, ArrowRight } from "lucide-react";
import { soundEffects } from "@/utils/audioSynth";

interface PediatricRewardsModalProps {
  isOpen: boolean;
  score: number;
  exerciseTitle: string;
  onClose: () => void;
  onPlayAgain: () => void;
  theme?: "space" | "safari" | "ocean" | "magic";
}

export const PediatricRewardsModal: React.FC<PediatricRewardsModalProps> = ({
  isOpen,
  score,
  exerciseTitle,
  onClose,
  onPlayAgain,
  theme = "space",
}) => {
  const stars = score >= 90 ? 3 : score >= 75 ? 2 : 1;

  useEffect(() => {
    if (isOpen) {
      soundEffects.playStarFanfare();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const themeBadges = {
    space: {
      title: "Galactic Star Navigator 🚀",
      desc: "Super ocular aim across the cosmos!",
      bg: "from-indigo-900/90 via-purple-900/90 to-slate-950",
      accent: "text-amber-400",
      emoji: "⭐",
    },
    safari: {
      title: "Eagle-Eye Safari Ranger 🦁",
      desc: "Spotted every safari animal in record time!",
      bg: "from-amber-950/90 via-emerald-950/90 to-slate-950",
      accent: "text-amber-400",
      emoji: "🐾",
    },
    ocean: {
      title: "Deep Sea Ocean Master 🐢",
      desc: "Guided the sea turtles with laser focus!",
      bg: "from-cyan-950/90 via-blue-950/90 to-slate-950",
      accent: "text-cyan-400",
      emoji: "🌊",
    },
    magic: {
      title: "Magic Wand Wizard 🦄",
      desc: "Cast perfect visual spells on target!",
      bg: "from-pink-950/90 via-purple-950/90 to-slate-950",
      accent: "text-pink-400",
      emoji: "✨",
    },
  };

  const badge = themeBadges[theme] || themeBadges.space;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-outfit">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className={`card-soft max-w-md w-full p-6 sm:p-8 text-center space-y-6 border-2 border-amber-400/40 relative overflow-hidden bg-gradient-to-b ${badge.bg} shadow-[0_0_50px_rgba(251,191,36,0.25)]`}
        >
          {/* Animated floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [-20, -120],
                  x: [0, (i % 2 === 0 ? 1 : -1) * 30],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 2.5 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="absolute text-amber-300 text-lg"
                style={{
                  left: `${(i * 18) % 100}%`,
                  bottom: "10%",
                }}
              >
                {badge.emoji}
              </motion.div>
            ))}
          </div>

          {/* Trophy Header */}
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-20 h-20 bg-amber-400/20 border-2 border-amber-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl"
            >
              <Trophy size={40} className="text-amber-400" />
            </motion.div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              MISSION COMPLETED!
            </span>
            <h2 className="text-2xl font-black text-white">{badge.title}</h2>
            <p className="text-xs text-white/70">{exerciseTitle}</p>
          </div>

          {/* 3-Star Rating Animation */}
          <div className="flex items-center justify-center gap-3 py-2">
            {[1, 2, 3].map((starIndex) => {
              const isEarned = starIndex <= stars;
              return (
                <motion.div
                  key={starIndex}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2 + starIndex * 0.2, type: "spring", stiffness: 200 }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${
                    isEarned
                      ? "bg-amber-400/20 border-amber-400 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]"
                      : "bg-white/5 border-white/20 text-white/30"
                  }`}
                >
                  <Star size={32} fill={isEarned ? "currentColor" : "none"} />
                </motion.div>
              );
            })}
          </div>

          {/* Accuracy Score Pill */}
          <div className="bg-black/50 border border-white/10 p-3 rounded-2xl flex items-center justify-around text-xs">
            <div>
              <p className="text-white/60 text-[10px] uppercase font-bold">Accuracy</p>
              <p className="text-xl font-black text-emerald-400">{score}%</p>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div>
              <p className="text-white/60 text-[10px] uppercase font-bold">Reward Badge</p>
              <p className="text-sm font-black text-amber-400">Level 3 Master</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onPlayAgain}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> Play Again
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-400/30 flex items-center justify-center gap-2"
            >
              View Report <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
