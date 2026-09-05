import {
  Target, Focus, Zap, Layers, Eye, Palette,
  RotateCw, Move, Maximize, Activity,
  Shield, Brain, Heart, Sun, Moon,
  Search, ShieldCheck, Sparkles, Smartphone, Cpu
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TherapyCategory =
  | "Refractive Errors"
  | "Eye Movement Disorders"
  | "Binocular Vision Therapy"
  | "Lazy Eye (Amblyopia)"
  | "Strabismus Therapy"
  | "Digital Eye Strain"
  | "Dry Eye Support"
  | "Vision Performance"
  | "General Eye Wellness";

export interface TherapyExercise {
  id: string;
  title: string;
  desc: string;
  category: TherapyCategory;
  level: "Easy" | "Medium" | "Hard";
  duration: number; // in seconds
  icon: LucideIcon;
  color: "teal" | "purple" | "blue";
  targetDefect: string;
  ageGroup: "Kids" | "Adults" | "All";
  benefits: string[];
  precautions: string[];
  instructions: string[];
}

export const therapyExercises: TherapyExercise[] = [
  // --- Original 6 (Preserved) ---
  {
    id: "target-tracking",
    title: "Target Tracking",
    desc: "Follow the moving AI orb with your eyes to improve smooth pursuit.",
    category: "Eye Movement Disorders",
    level: "Easy",
    duration: 300,
    icon: Target,
    color: "teal",
    targetDefect: "Smooth Pursuit Dysfunction",
    ageGroup: "All",
    benefits: ["Improves visual tracking", "Strengthens eye muscles"],
    precautions: ["Stop if you feel dizzy", "Maintain 50cm distance"],
    instructions: ["Follow the moving dot", "Keep your head still", "Blink naturally"]
  },
  {
    id: "focus-hold",
    title: "Focus Hold",
    desc: "Maintain focus on static points for timed intervals.",
    category: "Eye Movement Disorders",
    level: "Medium",
    duration: 180,
    icon: Focus,
    color: "purple",
    targetDefect: "Fixation Instability",
    ageGroup: "All",
    benefits: ["Enhances concentration", "Stabilizes gaze"],
    precautions: ["Blink frequently", "Avoid staring too hard"],
    instructions: ["Focus on the central point", "Ignore distractions", "Keep gaze steady"]
  },
  {
    id: "reaction-speed",
    title: "Reaction Speed",
    desc: "Identify peripheral flashes quickly to improve response time.",
    category: "Vision Performance",
    level: "Hard",
    duration: 120,
    icon: Zap,
    color: "blue",
    targetDefect: "Visual Processing Delay",
    ageGroup: "All",
    benefits: ["Faster visual response", "Improved peripheral awareness"],
    precautions: ["High intensity", "Take breaks between rounds"],
    instructions: ["Watch for peripheral flashes", "Tap as soon as you see them", "Keep main focus central"]
  },
  {
    id: "depth-perception",
    title: "Depth Perception",
    desc: "Identify 3D shapes in motion to enhance spatial awareness.",
    category: "Binocular Vision Therapy",
    level: "Medium",
    duration: 240,
    icon: Layers,
    color: "teal",
    targetDefect: "Reduced Stereopsis",
    ageGroup: "All",
    benefits: ["Better 3D awareness", "Improved spatial orientation"],
    precautions: ["Requires binocular sync", "May cause mild strain"],
    instructions: ["Identify which shape is closer", "Focus on depth cues", "Use both eyes"]
  },
  {
    id: "peripheral-vision",
    title: "Peripheral Vision",
    desc: "Expand your visual field awareness with dynamic exercises.",
    category: "Vision Performance",
    level: "Easy",
    duration: 300,
    icon: Eye,
    color: "purple",
    targetDefect: "Narrow Visual Field",
    ageGroup: "All",
    benefits: ["Wider awareness", "Better situational sensing"],
    precautions: ["Don't move your head", "Stay relaxed"],
    instructions: ["Keep central focus", "Notice objects at the edges", "Don't look directly at them"]
  },
  {
    id: "color-recognition",
    title: "Color Recognition",
    desc: "High-speed chromatic differentiation training.",
    category: "Vision Performance",
    level: "Hard",
    duration: 180,
    icon: Palette,
    color: "blue",
    targetDefect: "Color Processing",
    ageGroup: "All",
    benefits: ["Faster color processing", "Chromatic sensitivity"],
    precautions: ["Fast-paced", "Check for color blindness first"],
    instructions: ["Match colors quickly", "Identify slight hue changes", "Stay focused"]
  },

  // --- Refractive Errors ---
  {
    id: "myopia-relax",
    title: "Distance Relax",
    desc: "Exercises to relieve strain from prolonged near-work.",
    category: "Refractive Errors",
    level: "Easy",
    duration: 300,
    icon: Sun,
    color: "teal",
    targetDefect: "Myopia",
    ageGroup: "All",
    benefits: ["Reduces ciliary spasm", "Prevents progression"],
    precautions: ["Look at infinity distance", "Relax muscles"],
    instructions: ["Focus on a distant object", "Hold for 20 seconds", "Repeat 10 times"]
  },

  // --- Eye Movement Disorders ---
  {
    id: "convergence-pushup",
    title: "Convergence Pushups",
    desc: "Strengthen the ability to move eyes inward together.",
    category: "Eye Movement Disorders",
    level: "Medium",
    duration: 300,
    icon: Move,
    color: "purple",
    targetDefect: "Convergence Insufficiency",
    ageGroup: "All",
    benefits: ["Reduces double vision", "Improves reading focus"],
    precautions: ["Stop if pain occurs", "Don't overstrain"],
    instructions: ["Follow target as it moves close to nose", "Keep image single", "Reset when it goes double"]
  },
  {
    id: "saccade-jumps",
    title: "Saccade Jumps",
    desc: "Rapid eye movements between multiple targets.",
    category: "Eye Movement Disorders",
    level: "Hard",
    duration: 240,
    icon: Zap,
    color: "blue",
    targetDefect: "Oculomotor Dysfunction",
    ageGroup: "All",
    benefits: ["Faster reading", "Better scan efficiency"],
    precautions: ["High neurological load", "Keep head steady"],
    instructions: ["Jump focus between dots", "Avoid head movement", "Increase speed gradually"]
  },

  // --- Binocular Vision ---
  {
    id: "fusion-circles",
    title: "Fusion Circles",
    desc: "Combine two separate images into one unified picture.",
    category: "Binocular Vision Therapy",
    level: "Hard",
    duration: 300,
    icon: Target,
    color: "purple",
    targetDefect: "Poor Fusion",
    ageGroup: "All",
    benefits: ["Stronger binocularity", "Depth clarity"],
    precautions: ["Requires concentration", "Don't close one eye"],
    instructions: ["Look at the two circles", "Relax focus until they merge", "Maintain the merged image"]
  },

  // --- Lazy Eye (Amblyopia) ---
  {
    id: "contrast-boost",
    title: "Contrast Boost",
    desc: "High-contrast stimuli to stimulate the weaker eye.",
    category: "Lazy Eye (Amblyopia)",
    level: "Medium",
    duration: 600,
    icon: Brain,
    color: "teal",
    targetDefect: "Amblyopia",
    ageGroup: "Kids",
    benefits: ["Neural stimulation", "Improved acuity"],
    precautions: ["May require patching", "Monitor fatigue"],
    instructions: ["Follow the high-contrast patterns", "Stay active during the session", "Use the prescribed eye"]
  },

  // --- Digital Eye Strain ---
  {
    id: "blink-master",
    title: "Blink Master",
    desc: "Timed blinking exercises to restore tear film.",
    category: "Digital Eye Strain",
    level: "Easy",
    duration: 120,
    icon: Sun,
    color: "teal",
    targetDefect: "Dry Eye / Strain",
    ageGroup: "Adults",
    benefits: ["Moisturizes eyes", "Reduces fatigue"],
    precautions: ["Complete blinks only", "Gentle movement"],
    instructions: ["Blink fully for 2 seconds", "Squeeze gently", "Open and relax"]
  },
  {
    id: "twenty-twenty",
    title: "The 20-20-20 Rule",
    desc: "Guided distance viewing breaks for screen users.",
    category: "Digital Eye Strain",
    level: "Easy",
    duration: 60,
    icon: Eye,
    color: "blue",
    targetDefect: "Digital Strain",
    ageGroup: "All",
    benefits: ["Focus relief", "Long-term health"],
    precautions: ["Ensure 20 feet distance", "Look out a window if possible"],
    instructions: ["Look at something 20 feet away", "Hold for 20 seconds", "Rest and repeat"]
  },

  // --- General Eye Wellness ---
  {
    id: "warm-up",
    title: "Eye Warm-up",
    desc: "Gentle eye movements to prepare for therapy.",
    category: "General Eye Wellness",
    level: "Easy",
    duration: 120,
    icon: Activity,
    color: "teal",
    targetDefect: "Muscle Stiffness",
    ageGroup: "All",
    benefits: ["Improved blood flow", "Flexibility"],
    precautions: ["Move slowly", "Don't force range"],
    instructions: ["Look up and down", "Look left and right", "Roll eyes gently"]
  }
];
