import { ReactNode } from "react";
import { HTMLMotionProps, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

type AuraButtonVariant = "primary" | "icon-purple" | "ghost";

interface AuraButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: AuraButtonVariant;
  icon?: ReactNode;
  children?: ReactNode;
}

const variants: Record<AuraButtonVariant, string> = {
  primary:
    "bg-cta-cyan px-5 py-3 text-sm font-bold text-white shadow-cyan-glow hover:shadow-[0_0_34px_rgba(0,229,255,0.58)]",
  "icon-purple":
    "aspect-square h-11 rounded-lg bg-profile-purple p-0 text-lg font-extrabold text-white shadow-purple-glow hover:shadow-[0_0_36px_rgba(168,85,247,0.62)]",
  ghost:
    "glass-panel px-4 py-2 text-sm font-semibold text-text-main hover:border-accent-cyan/45 hover:bg-white/10",
};

export function AuraButton({ variant = "primary", icon, className, children, ...props }: AuraButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 360, damping: 22 }}
      className={twMerge(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 outline-none transition focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </motion.button>
  );
}
