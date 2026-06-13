"use client";

import { motion } from "framer-motion";

export default function ScrollReveal({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30, // Reduced from 60 for a smoother, premium feel
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        amount: 0.15, // Triggers slightly earlier for a snappier response
        once: true,   // ← This guarantees the animation only plays ONCE per page load
      }}
      transition={{
        duration: 0.5, // Slightly quicker duration to feel responsive
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}