
import React from 'react';
import { TileData } from '../types';
import { SLOT_MAX_CAPACITY } from '../constants';

interface SlotProps {
  tiles: TileData[];
}

const Slot: React.FC<SlotProps> = ({ tiles }) => {
  const slots = Array.from({ length: SLOT_MAX_CAPACITY });

  return (
    <div className="flex gap-1 w-full justify-center">
      {slots.map((_, index) => {
        const tile = tiles[index];
        return (
          <div 
            key={index} 
            className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-visible relative"
            style={{
              backgroundImage: 'url(/assets/img_play_bg2.png)',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {tile && (
              <div className="relative w-full h-full animate-[bounce_0.3s_ease-out] flex items-center justify-center">
                {/* 使用棋子块作为背景 */}
                <img 
                  src="/assets/棋子块.png" 
                  alt="tile background" 
                  className="absolute w-[90%] h-[90%] object-contain"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                  }}
                />
                
                {/* 在棋子块上显示水果图片 */}
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  {tile.image ? (
                    <img src={tile.image} alt={tile.icon} className="w-[50%] h-[50%] object-contain select-none" />
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
