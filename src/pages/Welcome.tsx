import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, ArrowRight, Shield, Gamepad2, LineChart } from "lucide-react";

const features = [
  { icon: Eye, title: "AI Eye Tracking", desc: "Advanced vision analysis powered by AI" },
  { icon: Gamepad2, title: "Therapy Games", desc: "Fun exercises designed for all ages" },
  { icon: LineChart, title: "Track Progress", desc: "Detailed analytics and improvement scores" },
  { icon: Shield, title: "Clinician Approved", desc: "Backed by vision therapy research" },
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 font-outfit relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="text-center relative z-10 max-w-2xl"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-soft-lg"
        >
          <Eye className="w-10 h-10 text-primary-foreground" />
        </motion.div>

        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
          FOCEYE
        </h1>
        <p className="text-xl text-muted-foreground mb-2">AI Vision Therapy</p>
        <p className="text-muted-foreground max-w-md mx-auto mb-10">
          A modern eye therapy platform for children and adults. Powered by AI, designed for results.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/login")}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-colors hover:bg-[hsl(173,80%,35%)]"
          >
            Start Therapy <ArrowRight size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/signup")}
            className="px-8 py-4 border-2 border-border text-foreground rounded-xl font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            Create Account
          </motion.button>
        </div>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl relative z-10"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="card-soft text-center"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 text-primary">
              <f.icon size={24} />
            </div>
            <h3 className="font-bold text-foreground text-sm mb-1">{f.title}</h3>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
