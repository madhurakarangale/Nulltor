import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const container = (stagger: number, delay: number) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

const item = {
  hidden: { y: "110%", opacity: 0 },
  show: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.65, ease: EASE },
  },
};

export interface TextAnimationProps {
  children: React.ReactNode;
  delay?: number;
  divideBy?: "word" | "letter" | "character";
  className?: string;
}

export const TextAnimation: React.FC<TextAnimationProps> = ({
  children,
  delay = 0,
  divideBy = "word",
  className = "",
}) => {
  if (typeof children !== "string") {
    if (typeof children === "number" || typeof children === "boolean") {
      children = String(children);
    } else {
      return <span className={className}>{children}</span>;
    }
  }

  const text = children as string;
  const isLetter = divideBy === "letter" || divideBy === "character";
  const parts = isLetter ? text.split("") : text.split(" ");
  const stagger = isLetter ? 0.018 : 0.05;

  return (
    <motion.span
      variants={container(stagger, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className={cn("inline-block", className)}
    >
      {parts.map((part, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden relative align-top"
        >
          <motion.span
            variants={item}
            className="inline-block will-change-transform"
          >
            {isLetter
              ? part === " "
                ? "\u00A0"
                : part
              : part + "\u00A0"}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
};

export default TextAnimation;
