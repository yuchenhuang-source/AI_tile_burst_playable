
import React from 'react';
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

  return (
    <div className="flex gap-1 w-full justify-center items-center h-full">
      {slots.map((_, index) => {
        const tile = tiles[index];
        return (
          <div 
            key={index} 
            className="flex items-center justify-center overflow-visible relative"
            style={{
              width: uiConfig?.dimensions.slotItem.width || 85,
              height: uiConfig?.dimensions.slotItem.height || 90,
              backgroundImage: uiConfig ? `url(${uiConfig.assets.ui.slotCell.path})` : 'url(/assets/img_play_bg2.png)',
              ...uiConfig?.assets.ui.slotCell.style
            }}
          >
            {tile && (
              <div 
                className="relative w-full h-full flex items-center justify-center"
                style={{
                  animation: uiConfig?.effects.animations.tileEnterSlot || 'bounce 0.3s ease-out'
                }}
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
