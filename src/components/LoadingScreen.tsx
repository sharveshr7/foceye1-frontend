import { motion } from "framer-motion";
import { Eye } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[100] font-outfit">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20"
      >
        <Eye className="w-10 h-10 text-primary-foreground" />
      </motion.div>

      <div className="space-y-2 text-center">
        <h3 className="text-xl font-bold text-foreground">Loading FOCEYE</h3>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-1.5 h-1.5 bg-primary rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
