"use client";

import { motion } from "framer-motion";

export function ScanningRadar() {
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {/* Outer Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"
      />

      {/* Ripple 1 */}
      <motion.div
        animate={{
          scale: [1, 2],
          opacity: [1, 0],
          borderWidth: ["2px", "0px"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeOut",
        }}
        className="absolute w-full h-full border border-blue-500 rounded-full"
      />

      {/* Ripple 2 */}
      <motion.div
        animate={{
          scale: [1, 2],
          opacity: [1, 0],
          borderWidth: ["2px", "0px"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 0.5,
          ease: "easeOut",
        }}
        className="absolute w-full h-full border border-teal-500 rounded-full"
      />

      {/* Center Core */}
      <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(255,255,255,0.4)_360deg)] absolute"
        />
        <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center z-10">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-8 h-8 bg-blue-600 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
