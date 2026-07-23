import { ReactNode } from "react";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { Cpu } from "lucide-react";

interface AuraCardProps {
  title: string;
  description: string;
  eyebrow?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function AuraCard({ title, description, eyebrow, icon, children, className }: AuraCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={twMerge(
        "glass-panel group relative overflow-hidden rounded-lg p-5 shadow-card-glow",
        "before:absolute before:inset-x-8 before:-top-10 before:h-20 before:bg-accent-cyan/20 before:blur-3xl before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
        className,
      )}
    >
      <div className="relative flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent-cyan/20 bg-background-dark/70 text-accent-cyan">
          {icon ?? <Cpu aria-hidden="true" className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent-cyan">{eyebrow}</p> : null}
          <h3 className="text-base font-bold text-text-main">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
        </div>
      </div>
      {children ? <div className="relative mt-5">{children}</div> : null}
    </motion.article>
  );
}
