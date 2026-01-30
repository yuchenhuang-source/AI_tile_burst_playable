
import React from 'react';
import { TileData, DEFAULT_TILE_SIZE } from '../types';
import { UIConfig } from '../uiConfig.types';

interface GameBoardProps {
  tiles: TileData[];
  onTileClick: (id: string, rect: DOMRect) => void;
  uiConfig: UIConfig | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ tiles, onTileClick, uiConfig }) => {
  const tileSize = uiConfig?.dimensions.gameBoardTile.size || DEFAULT_TILE_SIZE;
  const containerWidth = uiConfig?.dimensions.gameBoardContainer.width || 280;
  const containerHeight = uiConfig?.dimensions.gameBoardContainer.height || 320;
  
  return (
    <div className="relative w-full h-full flex justify-center items-center">
      <div className="relative" style={{ 
        width: `${containerWidth}px`, 
        height: `${containerHeight}px`, 
        maxWidth: '90vw', 
        maxHeight: '100%' 
      }}>
        {tiles.map((tile) => (
        <div
          key={tile.id}
          data-tile-id={tile.id}
          onClick={(e) => {
            if (tile.isSelectable) {
              const rect = e.currentTarget.getBoundingClientRect();
              onTileClick(tile.id, rect);
            }
          }}
          className={`
            absolute transition-all duration-300 transform
            cursor-pointer group
            ${tile.isSelectable ? 'opacity-100' : 'brightness-50 grayscale-[0.3] cursor-not-allowed'}
          `}
          style={{
            width: tileSize,
            height: tileSize,
            left: `${tile.x}px`,
            top: `${tile.y}px`,
            zIndex: tile.level * 10,
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <div className="relative w-full h-full group-active:translate-y-1 transition-transform">
            
            {/* 使用配置中的棋子块作为方块背景 */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                width: tileSize,
                height: tileSize,
              }}
            >
              <img 
                src={uiConfig?.assets.tiles.background.path || "/assets/棋子块.png"} 
                alt="tile background" 
                className="absolute object-contain"
                style={{
                  width: uiConfig?.assets.tiles.background.gameBoardScale || '100%',
                  height: uiConfig?.assets.tiles.background.gameBoardScale || '100%',
                  filter: uiConfig?.effects.shadows.tile || 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))'
                }}
              />
              
              {/* 素材渲染逻辑: 在棋子块上显示水果图片 */}
              <div className="relative z-10 flex items-center justify-center w-full h-full">
                {tile.image ? (
                  <img 
                    src={tile.image} 
                    alt={tile.icon} 
                    className="object-contain select-none"
                    style={{
                      width: uiConfig?.assets.tiles.fruitScale.gameBoard || '55%',
                      height: uiConfig?.assets.tiles.fruitScale.gameBoard || '55%'
                    }}
                  />
                ) : (
                  <span className="text-3xl select-none filter drop-shadow-[0_2px_1px_rgba(0,0,0,0.1)]">
                    {tile.icon}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default GameBoard;
