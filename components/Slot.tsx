
import React, { useState, useEffect } from 'react';
import { TileData } from '../types';
import { getSlotMaxCapacity } from '../constants';
import { UIConfig } from '../uiConfig.types';

interface SlotProps {
  tiles: TileData[];
  uiConfig: UIConfig | null;
}

const Slot: React.FC<SlotProps> = ({ tiles, uiConfig }) => {
  const slotMaxCapacity = uiConfig?.dimensions.slot.maxCapacity || getSlotMaxCapacity();
  const slots = Array.from({ length: slotMaxCapacity });

  // 使用state来存储槽位大小，以便响应窗口变化
  const [slotItemSize, setSlotItemSize] = useState(76);

  useEffect(() => {
    const calculateSlotSize = () => {
      const baseSize = uiConfig?.dimensions.slotItem.width || 76;
      // 屏幕宽度减去padding(左右各24px)，再除以槽位数量加间隙
      const maxSize = (window.innerWidth - 48) / (slotMaxCapacity + 0.5);
      setSlotItemSize(Math.min(baseSize, maxSize));
    };

    calculateSlotSize();
    window.addEventListener('resize', calculateSlotSize);
    return () => window.removeEventListener('resize', calculateSlotSize);
  }, [slotMaxCapacity, uiConfig]);

  return (
    <div className="flex gap-1 w-full justify-center items-center h-full">
      {slots.map((_, index) => {
        const tile = tiles[index];
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
                className={`relative w-full h-full flex items-center justify-center ${
                  tile.animationState === 'bouncing' ? 'animate-slot-bounce' : ''
                } ${
                  tile.animationState === 'matching' ? 'animate-tile-match' : ''
                }`}
                style={{
                  '--slot-bounce-duration': `${uiConfig?.effects.animations.slotBounce.duration || 200}ms`,
                  '--slot-bounce-easing': uiConfig?.effects.animations.slotBounce.easing || 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '--bounce-scale': uiConfig?.effects.animations.slotBounce.scale || 1.1,
                  '--tile-match-duration': `${uiConfig?.effects.animations.tileMatch.duration || 300}ms`,
                  '--tile-match-easing': uiConfig?.effects.animations.tileMatch.easing || 'ease-out',
                  '--match-scale': uiConfig?.effects.animations.tileMatch.scale || 1.3,
                  '--match-opacity': uiConfig?.effects.animations.tileMatch.opacity || 0,
                } as React.CSSProperties}
              >
                {/* 使用配置中的棋子块作为背景 */}
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
                
                {/* 在棋子块上显示水果图片 */}
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
          </div>
        );
      })}
    </div>
  );
};

export default Slot;
