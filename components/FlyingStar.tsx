import React, { useState, useEffect } from 'react';

interface FlyingStarProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  easing: string;
  size: number;
  imagePath: string;
  delay: number;
  onComplete: () => void;
}

const FlyingStar: React.FC<FlyingStarProps> = ({
  startX,
  startY,
  endX,
  endY,
  duration,
  easing,
  size,
  imagePath,
  delay,
  onComplete,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setIsAnimating(true);
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      setIsComplete(true);
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [isAnimating, duration, onComplete]);

  if (isComplete) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: isAnimating ? endX : startX,
        top: isAnimating ? endY : startY,
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
        transition: isAnimating ? `left ${duration}ms ${easing}, top ${duration}ms ${easing}` : 'none',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <img 
        src={imagePath} 
        alt="star" 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};

export default FlyingStar;
