import React, { useRef, useState, createContext, useContext } from "react";
import { cn } from "../../lib/utils";

interface TiltContextType {
  mouseX: number;
  mouseY: number;
  isHovered: boolean;
}

const TiltContext = createContext<TiltContextType>({ mouseX: 0, mouseY: 0, isHovered: false });

export interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  containerClassName?: string;
  maxTilt?: number;
  children: React.ReactNode;
}

export function TiltCard({
  className,
  containerClassName,
  maxTilt = 12,
  children,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setRotateX(-y * maxTilt);
    setRotateY(x * maxTilt);
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <TiltContext.Provider value={{ mouseX: mousePos.x, mouseY: mousePos.y, isHovered }}>
      <div
        className={cn("tilt-card-container", containerClassName)}
        style={{ perspective: "1000px" }}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn("tilt-card", className)}
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transformStyle: "preserve-3d",
            transition: isHovered ? "transform 0.08s ease-out" : "transform 0.45s ease-out",
          }}
          {...props}
        >
          {children}
        </div>
      </div>
    </TiltContext.Provider>
  );
}

export interface TiltCardItemProps extends React.HTMLAttributes<HTMLDivElement> {
  depth?: number;
  children: React.ReactNode;
}

export function TiltCardItem({
  depth = 30,
  className,
  children,
  style,
  ...props
}: TiltCardItemProps) {
  const { isHovered } = useContext(TiltContext);

  return (
    <div
      className={cn("tilt-card-item", className)}
      style={{
        transform: isHovered ? `translateZ(${depth}px)` : "translateZ(0px)",
        transformStyle: "preserve-3d",
        transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export default TiltCard;
