
import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

export const CustomCursor: React.FC = () => {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  const [isHovering, setIsHovering] = useState(false);
  const [hoverText, setHoverText] = useState("");
  
  // Spring physics for the follower
  const springConfig = { damping: 20, stiffness: 150, mass: 0.8 };
  const cursorXSpring = useSpring(mouseX, springConfig);
  const cursorYSpring = useSpring(mouseY, springConfig);

  // Scale spring
  const scale = useSpring(1, { damping: 20, stiffness: 200 });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      // If we aren't magnetically locked, follow mouse
      // Note: Magnetic logic usually handled by setting mouseX/Y to element center
      // But for simplicity in this pure JS setup without a context provider, 
      // we'll stick to visual magnetism (snap effect) via event checking if needed
      // or just standard follow with smoothing.
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check for clickable elements
      const isClickable = target.matches('button, a, input, textarea, [role="button"]') || target.closest('button, a, [role="button"]');
      
      if (isClickable) {
        setIsHovering(true);
        scale.set(3); // Larger scale on hover
      } else {
        setIsHovering(false);
        scale.set(1);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [mouseX, mouseY, scale]);

  return (
    <>
      {/* Main Cursor Dot */}
      <motion.div 
         className="fixed top-0 left-0 w-2 h-2 bg-accent rounded-full pointer-events-none z-[9999]"
         style={{
            x: mouseX,
            y: mouseY,
            translateX: '-50%',
            translateY: '-50%'
         }}
      />
      
      {/* Trailing Organic Circle */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9998] mix-blend-difference border border-white bg-white"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          scale: scale,
          opacity: 0.8
        }}
      />
    </>
  );
};
