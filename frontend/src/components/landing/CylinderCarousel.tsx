import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

export interface CarouselCard {
  title: string;
  category: string;
  badge: string;
  description: string;
  icon?: string;
  image?: string;
  gradient?: string;
}

export interface CylinderCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  cards: CarouselCard[];
  containerClassName?: string;
  cardClassName?: string;
  animationDuration?: number; // in seconds
  cardWidth?: number; // in pixels
}

export const CylinderCarousel = React.forwardRef<HTMLDivElement, CylinderCarouselProps>(
  (
    {
      cards,
      className,
      containerClassName,
      cardClassName,
      animationDuration = 32,
      cardWidth = 420,
      ...props
    },
    ref
  ) => {
    const N = cards.length;
    const [responsiveWidth, setResponsiveWidth] = useState(cardWidth);
    const [isHovered, setIsHovered] = useState(false);
    const [rotation, setRotation] = useState(0);
    const currentRotRef = useRef(0);

    // Responsive width calculation
    useEffect(() => {
      const updateWidth = () => {
        if (window.innerWidth < 480) {
          setResponsiveWidth(Math.min(300, window.innerWidth - 40));
        } else if (window.innerWidth < 768) {
          setResponsiveWidth(360);
        } else {
          setResponsiveWidth(cardWidth);
        }
      };
      updateWidth();
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }, [cardWidth]);

    // Precise trigonometric cylinder radius calculated in JavaScript
    const angleStep = 360 / N;
    const cylinderRadius = Math.round(
      (responsiveWidth / 2) / Math.tan(Math.PI / N)
    ) + 30;

    // Smooth continuous auto-rotation loop (no pause on hover per user request)
    useEffect(() => {
      let rafId: number;
      let lastTime = performance.now();
      const degPerSec = 360 / animationDuration;

      const loop = (now: number) => {
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        currentRotRef.current = (currentRotRef.current - delta * degPerSec) % 360;
        setRotation(currentRotRef.current);

        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafId);
    }, [animationDuration]);

    return (
      <div
        ref={ref}
        className={cn("cylinder-carousel-root", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: "100%",
          height: "430px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          position: "relative",
          perspective: "1350px",
          perspectiveOrigin: "50% 50%",
          userSelect: "none",
          overflow: "visible",
          marginTop: "48px",
          marginBottom: "20px",
        }}
        {...props}
      >
        {/* Revolving 3D Cylinder Container */}
        <div
          className={cn("cylinder-track", containerClassName)}
          style={{
            width: `${responsiveWidth}px`,
            height: "340px",
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `rotateY(${rotation}deg)`,
            transition: "transform 0.05s linear",
            marginTop: "36px",
          }}
        >
          {cards.map((card, i) => {
            const cardAngle = i * angleStep;
            return (
              <div
                key={i}
                className={cn("cylinder-card", cardClassName)}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: `${responsiveWidth}px`,
                  height: "330px",
                  borderRadius: "20px",
                  transform: `rotateY(${cardAngle}deg) translateZ(${cylinderRadius}px)`,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  padding: "22px 26px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                {/* Header Meta Info */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "14px",
                    }}
                  >
                    <span className="cylinder-card__badge">
                      {card.badge}
                    </span>
                  </div>

                  <div className="cylinder-card__category">
                    {card.category}
                  </div>

                  <h3 className="cylinder-card__title">
                    {card.title}
                  </h3>
                </div>

                {/* Body Description */}
                <p className="cylinder-card__desc">
                  {card.description}
                </p>

                {/* Footer Telemetry Bar */}
                <div className="cylinder-card__footer">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="landing-nav__dot" style={{ width: 5, height: 5 }} />
                    <span>SOVEREIGN MODULE</span>
                  </div>
                  <span>0{i + 1} // 0{N}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CylinderCarousel.displayName = "CylinderCarousel";
export default CylinderCarousel;
