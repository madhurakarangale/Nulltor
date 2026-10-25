import React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "../../lib/utils";

export type AnimatedButtonProps = HTMLMotionProps<"button"> & {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "glow" | "dark";
  size?: "sm" | "md" | "lg";
  as?: any;
};

/**
 * AnimatedButton
 * - self-contained Vanilla CSS styles: works in any theme without Tailwind dependencies
 * - animated border shine ray sweep
 * - dynamic text shine mask
 * - spring scale feedback on hover and tap
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children = "Launch Studio",
  className = "",
  variant = "primary",
  size = "md",
  as = "button",
  style,
  ...rest
}) => {
  const Component = (motion as any)[as] || motion.button;

  const sizeStyle: React.CSSProperties = {
    sm: { padding: "6px 14px", fontSize: "12px", borderRadius: "6px", gap: "6px" },
    md: { padding: "10px 22px", fontSize: "13.5px", borderRadius: "8px", gap: "8px" },
    lg: { padding: "14px 30px", fontSize: "15px", borderRadius: "12px", gap: "10px" },
  }[size];

  const variantStyle: React.CSSProperties = {
    primary: {
      background: "linear-gradient(135deg, #0f52ba 0%, #1e40af 100%)",
      color: "#ffffff",
      borderColor: "rgba(59, 130, 246, 0.5)",
      boxShadow: "0 0 20px rgba(15, 82, 186, 0.45)",
    },
    secondary: {
      background: "var(--btn-sec-bg, rgba(26, 27, 34, 0.85))",
      color: "var(--btn-sec-text, #f8fafc)",
      borderColor: "var(--btn-sec-border, rgba(255, 255, 255, 0.15))",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    },
    glow: {
      background: "rgba(16, 185, 129, 0.15)",
      color: "#34d399",
      borderColor: "rgba(16, 185, 129, 0.4)",
      boxShadow: "0 0 20px rgba(16, 185, 129, 0.25)",
    },
    dark: {
      background: "#08090d",
      color: "#e2e8f0",
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
  }[variant];

  return (
    <Component
      {...rest}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 0.5,
      }}
      style={{
        position: "relative",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontFamily: "var(--font-ui, system-ui, sans-serif)",
        cursor: "pointer",
        border: "1px solid",
        userSelect: "none",
        textDecoration: "none",
        ...sizeStyle,
        ...variantStyle,
        ...style,
      }}
      className={cn("animated-btn", className)}
    >
      {/* Text with shine mask */}
      <motion.span
        style={{
          letterSpacing: "0.02em",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          position: "relative",
          zIndex: 10,
          gap: "inherit",
          WebkitMaskImage:
            "linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))",
          maskImage:
            "linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))",
        }}
        initial={{ ["--mask-x" as any]: "100%" } as any}
        animate={{ ["--mask-x" as any]: "-100%" } as any}
        transition={{
          repeat: Infinity,
          duration: 1.8,
          ease: "linear",
          repeatDelay: 1.2,
        }}
      >
        {children}
      </motion.span>

      {/* Border shine ray effect */}
      <motion.span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          padding: "1px",
          pointerEvents: "none",
          background:
            "linear-gradient(-75deg, transparent 30%, rgba(255, 255, 255, 0.7) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
        }}
        initial={{ backgroundPosition: "100% 0", opacity: 0 }}
        animate={{ backgroundPosition: ["100% 0", "0% 0"], opacity: [0, 1, 0] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 1.2,
        }}
      />
    </Component>
  );
};

export default AnimatedButton;
