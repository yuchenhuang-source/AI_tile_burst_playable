import React, { useState, useEffect } from 'react';

interface SpriteAnimationProps {
  frameCount: number;
  frameDuration: number;
  basePath: string;
  frameFormat: string;
  extension: string;
  width: number;
  height: number;
  onComplete?: () => void;
}

const SpriteAnimation: React.FC<SpriteAnimationProps> = ({
  frameCount,
  frameDuration,
  basePath,
  frameFormat,
  extension,
  width,
  height,
  onComplete,
}) => {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isComplete, setIsComplete] = useState(false);

  const formatFrameNumber = (num: number): string => {
    const digits = frameFormat.length;
    return num.toString().padStart(digits, '0');
  };

  useEffect(() => {
    if (isComplete) return;

    const timer = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= frameCount) {
          setIsComplete(true);
          onComplete?.();
          return prev;
        }
        return prev + 1;
      });
    }, frameDuration);

    return () => clearInterval(timer);
  }, [frameCount, frameDuration, isComplete, onComplete]);

  if (isComplete) return null;

  const framePath = `${basePath}${formatFrameNumber(currentFrame)}${extension}`;

  return (
    <img
      src={framePath}
      alt="animation"
      style={{
        width,
        height,
        objectFit: 'contain',
        pointerEvents: 'none',
      }}
    />
  );
};

export default SpriteAnimation;
