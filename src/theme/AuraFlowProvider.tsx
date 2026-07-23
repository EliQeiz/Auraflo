import { PropsWithChildren } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function AuraFlowProvider({ children }: PropsWithChildren) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-aurora-field text-text-main">
      <div className="pointer-events-none fixed inset-0 constellation-layer" aria-hidden="true" />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-12rem] top-24 h-[34rem] w-[34rem] rounded-full bg-primary-glow/25 blur-[110px]"
        animate={reduceMotion ? undefined : { opacity: [0.28, 0.42, 0.28], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed right-[-10rem] top-10 h-[32rem] w-[32rem] rounded-full bg-accent-cyan/20 blur-[120px]"
        animate={reduceMotion ? undefined : { opacity: [0.18, 0.32, 0.18], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
