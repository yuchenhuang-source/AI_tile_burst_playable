
import React, { useState, useEffect, useRef } from 'react';
import { TileData } from '../types';
import { getSlotMaxCapacity } from '../constants';
import { UIConfig } from '../uiConfig.types';
import SpriteAnimation from './SpriteAnimation';

interface SlotProps {
  tiles: TileData[];
  uiConfig: UIConfig | null;
  starBurstSlots?: number[];
  onStarBurstComplete?: (index: number, position: {x: number, y: number}) => void;
  shiftingTiles?: { id: string; fromIndex: number; toIndex: number; direction: 'left' | 'right' }[];
  onShiftComplete?: () => void;
}

const Slot: React.FC<SlotProps> = ({ 
  tiles, 
  uiConfig, 
  starBurstSlots = [], 
  onStarBurstComplete,
  shiftingTiles = [],
  onShiftComplete
}) => {
  const slotMaxCapacity = uiConfig?.dimensions.slot.maxCapacity || getSlotMaxCapacity();
  const slots = Array.from({ length: slotMaxCapacity });
  const [slotItemSize, setSlotItemSize] = useState(76);
  const [shiftPhase, setShiftPhase] = useState<'idle' | 'start' | 'animating'>('idle');
  const shiftCompleteRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const calculateSlotSize = () => {
      const baseSize = uiConfig?.dimensions.slotItem.width || 76;
      const maxSize = (window.innerWidth - 48) / (slotMaxCapacity + 0.5);
      setSlotItemSize(Math.min(baseSize, maxSize));
    };

    calculateSlotSize();
    window.addEventListener('resize', calculateSlotSize);
    return () => window.removeEventListener('resize', calculateSlotSize);
  }, [slotMaxCapacity, uiConfig]);

  useEffect(() => {
    if (shiftingTiles.length > 0) {
      setShiftPhase('start');
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShiftPhase('animating');
        });
      });
      
      if (shiftCompleteRef.current) {
        clearTimeout(shiftCompleteRef.current);
      }
      
      const duration = shiftingTiles[0]?.direction === 'right' 
        ? (uiConfig?.effects.animations.slotShiftRight?.duration || 300)
        : (uiConfig?.effects.animations.slotShiftLeft?.duration || 300);
      
      shiftCompleteRef.current = setTimeout(() => {
        setShiftPhase('idle');
        onShiftComplete?.();
      }, duration + 50);
    } else {
      setShiftPhase('idle');
    }
    
    return () => {
      if (shiftCompleteRef.current) {
        clearTimeout(shiftCompleteRef.current);
      }
    };
  }, [shiftingTiles, uiConfig, onShiftComplete]);

  const getShiftInfo = (tileId: string) => {
    return shiftingTiles.find(s => s.id === tileId);
  };

  const getShiftOffset = (shiftInfo: { fromIndex: number; toIndex: number; direction: 'left' | 'right' } | undefined, currentIndex: number) => {
    if (!shiftInfo) return 0;
    if (shiftPhase === 'idle') return 0;
    
    const slotWidth = slotItemSize + 4;
    
    if (shiftInfo.direction === 'left') {
      if (shiftPhase === 'start') {
        return shiftInfo.fromIndex * slotWidth;
      }
      return 0;
    } else {
      if (shiftPhase === 'start') {
        return 0;
      }
      return slotWidth;
    }
  };

  return (
    <div className="flex gap-1 w-full justify-center items-center h-full">
      {slots.map((_, index) => {
        const tile = tiles[index];
        const shiftInfo = tile ? getShiftInfo(tile.id) : undefined;
        const shiftOffset = getShiftOffset(shiftInfo, index);
        
        const shiftDuration = shiftInfo?.direction === 'right'
          ? (uiConfig?.effects.animations.slotShiftRight?.duration || 300)
          : (uiConfig?.effects.animations.slotShiftLeft?.duration || 300);
        const shiftEasing = shiftInfo?.direction === 'right'
          ? (uiConfig?.effects.animations.slotShiftRight?.easing || 'ease-out')
          : (uiConfig?.effects.animations.slotShiftLeft?.easing || 'ease-out');
        const shouldAnimate = shiftInfo && shiftPhase === 'animating';

        return (
          <div 
            key={index}
            data-slot-index={index}
            className="flex items-center justify-center overflow-visible relative flex-shrink-0"
            style={{
              width: slotItemSize,
              height: slotItemSize,
              backgroundImage: uiConfig ? `url(${uiConfig.assets.ui.slotCell.path})` : 'url(/assets/img_play_bg2.png)',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {tile && (
              <div 
                className={`absolute w-full h-full flex items-center justify-center ${
                  tile.animationState === 'bouncing' ? 'animate-slot-bounce' : ''
                } ${
                  tile.animationState === 'matching' ? 'animate-tile-match' : ''
                }`}
                style={{
                  zIndex: 10,
                  transform: `translateX(${shiftOffset}px)`,
                  transition: shouldAnimate ? `transform ${shiftDuration}ms ${shiftEasing}` : 'none',
                  '--slot-bounce-duration': `${uiConfig?.effects.animations.slotBounce.duration || 200}ms`,
                  '--slot-bounce-easing': uiConfig?.effects.animations.slotBounce.easing || 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '--bounce-scale': uiConfig?.effects.animations.slotBounce.scale || 1.1,
                  '--tile-match-duration': `${uiConfig?.effects.animations.tileMatch.duration || 300}ms`,
                  '--tile-match-easing': uiConfig?.effects.animations.tileMatch.easing || 'ease-out',
                  '--match-scale': uiConfig?.effects.animations.tileMatch.scale || 1.3,
                  '--match-opacity': uiConfig?.effects.animations.tileMatch.opacity || 0,
                } as React.CSSProperties}
              >
                <img 
                  src={uiConfig?.assets.tiles.background.path || "/assets/棋子块.png"} 
                  alt="tile background" 
                  className="absolute object-contain"
                  style={{
                    width: uiConfig?.assets.tiles.background.slotScale || '90%',
                    height: uiConfig?.assets.tiles.background.slotScale || '90%',
                    filter: uiConfig?.effects.shadows.tileInSlot || 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                  }}
                />
                
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  {tile.image ? (
                    <img 
                      src={tile.image} 
                      alt={tile.icon} 
                      className="object-contain select-none"
                      style={{
                        width: uiConfig?.assets.tiles.fruitScale.slot || '50%',
                        height: uiConfig?.assets.tiles.fruitScale.slot || '50%'
                      }}
                    />
                  ) : (
                    <span className="text-lg sm:text-xl select-none filter drop-shadow-sm">{tile.icon}</span>
                  )}
                </div>
              </div>
            )}
            
            {starBurstSlots.includes(index) && uiConfig?.effects.animations.starBurst && (
              <div 
                className="absolute z-20 pointer-events-none"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <SpriteAnimation
                  frameCount={uiConfig.effects.animations.starBurst.frameCount}
                  frameDuration={uiConfig.effects.animations.starBurst.frameDuration}
                  basePath={uiConfig.effects.animations.starBurst.basePath}
                  frameFormat={uiConfig.effects.animations.starBurst.frameFormat}
                  extension={uiConfig.effects.animations.starBurst.extension}
                  width={uiConfig.effects.animations.starBurst.width}
                  height={uiConfig.effects.animations.starBurst.height}
                  onComplete={() => {
                    const slotElement = document.querySelector(`[data-slot-index="${index}"]`);
                    if (slotElement) {
                      const rect = slotElement.getBoundingClientRect();
                      onStarBurstComplete?.(index, {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                      });
                    } else {
                      onStarBurstComplete?.(index, { x: 0, y: 0 });
                    }
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Slot;
