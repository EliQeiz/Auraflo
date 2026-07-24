import { ReactNode } from "react";
import { HTMLMotionProps, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

type AuraButtonVariant = "primary" | "secondary" | "icon-purple" | "ghost" | "danger";

interface AuraButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: AuraButtonVariant;
  icon?: ReactNode;
  children?: ReactNode;
}

const variants: Record<AuraButtonVariant, string> = {
  primary:
    "bg-cta-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-cyan-glow hover:shadow-[0_0_26px_rgba(0,229,255,0.46)]",
  secondary:
    "border-accent-cyan/25 bg-accent-cyan/10 px-3.5 py-2 text-sm font-semibold text-accent-cyan hover:border-accent-cyan/70 hover:bg-accent-cyan/15",
  "icon-purple":
    "aspect-square h-10 rounded-md bg-profile-purple p-0 text-sm font-bold text-white shadow-purple-glow hover:shadow-[0_0_24px_rgba(168,85,247,0.46)]",
  ghost:
    "glass-panel px-3.5 py-2 text-sm font-semibold text-text-main hover:border-accent-cyan/45 hover:bg-white/10",
  danger:
    "border-amber-300/30 bg-amber-300/10 px-3.5 py-2 text-sm font-semibold text-amber-200 hover:border-amber-300/70 hover:bg-amber-300/15",
};

export function AuraButton({ variant = "primary", icon, className, children, ...props }: AuraButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={twMerge(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 outline-none transition focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark disabled:cursor-not-allowed disabled:opacity-45",
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
