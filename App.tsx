
import React, { useState, useEffect, useCallback } from 'react';
import { TileData, GameState, TILE_SIZE } from './types';
import { getTileTypes, getSlotMaxCapacity } from './constants';
import GameBoard from './components/GameBoard';
import Slot from './components/Slot';
import { loadUIConfig } from './configLoader';
import { UIConfig } from './uiConfig.types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    allTiles: [],
    slot: [],
    score: 0,
    gameOver: false,
  });
  const [uiConfig, setUIConfig] = useState<UIConfig | null>(null);

  const initializeGame = useCallback(() => {
    const tiles: TileData[] = [];
    const tileTypes = getTileTypes();
    const numTypes = 6;
    const setsOfThree = 12; // Total 36 tiles
    
    for (let t = 0; t < numTypes; t++) {
      const typeInfo = tileTypes[t % tileTypes.length];
      for (let s = 0; s < (setsOfThree * 3) / numTypes; s++) {
        tiles.push({
          id: Math.random().toString(36).substr(2, 9),
          type: t,
          icon: typeInfo.icon,
          image: typeInfo.image, // Pass image path from constants
          baseColor: typeInfo.baseColor,
          x: 0,
          y: 0,
          level: 0,
          isRemoved: false,
          isInSlot: false,
          isSelectable: true,
        });
      }
    }

    const shuffled = tiles.sort(() => Math.random() - 0.5);

    const positionedTiles = shuffled.map((tile, index) => {
      const layer = Math.floor(index / 12);
      const posInLayer = index % 12;
      const col = posInLayer % 3;
      const row = Math.floor(posInLayer / 3);
      
      const offsetX = (Math.random() - 0.5) * 50;
      const offsetY = (Math.random() - 0.5) * 50;

      return {
        ...tile,
        level: layer,
        x: col * (TILE_SIZE + 6) + 60 + offsetX,
        y: row * (TILE_SIZE + 6) + 40 + offsetY + (layer * 2),
      };
    });

    setGameState({
      allTiles: updateSelectableTiles(positionedTiles),
      slot: [],
      score: 0,
      gameOver: false,
    });
  }, []);

  useEffect(() => {
    loadUIConfig().then(config => {
      setUIConfig(config);
      initializeGame();
    }).catch(error => {
      console.error('Failed to load UI config:', error);
      initializeGame(); // 使用默认配置继续
    });
  }, []);

  function updateSelectableTiles(tiles: TileData[]): TileData[] {
    return tiles.map((tile) => {
      if (tile.isRemoved || tile.isInSlot) return { ...tile, isSelectable: false };
      
      const isCovered = tiles.some(other => {
        if (other.isRemoved || other.isInSlot || other.level <= tile.level || other.id === tile.id) return false;
        
        const rect1 = { x: tile.x, y: tile.y, w: TILE_SIZE, h: TILE_SIZE };
        const rect2 = { x: other.x, y: other.y, w: TILE_SIZE, h: TILE_SIZE };
        
        return (
          rect1.x < rect2.x + rect2.w - 15 &&
          rect1.x + rect1.w > rect2.x + 15 &&
          rect1.y < rect2.y + rect2.h - 15 &&
          rect1.y + rect1.h > rect2.y + 15
        );
      });

      return { ...tile, isSelectable: !isCovered };
    });
  }

  const handleTileClick = (tileId: string) => {
    setGameState(prev => {
      const slotMaxCapacity = getSlotMaxCapacity();
      if (prev.slot.length >= slotMaxCapacity || prev.gameOver) return prev;

      const tile = prev.allTiles.find(t => t.id === tileId);
      if (!tile || !tile.isSelectable) return prev;

      const newSlot = [...prev.slot, { ...tile, isInSlot: true }];
      const updatedAllTiles = prev.allTiles.map(t => 
        t.id === tileId ? { ...t, isInSlot: true } : t
      );

      const groupedSlot = newSlot.sort((a, b) => a.type - b.type);

      const typeCount: Record<number, number> = {};
      groupedSlot.forEach(t => {
        typeCount[t.type] = (typeCount[t.type] || 0) + 1;
      });

      let finalSlot = [...groupedSlot];
      let finalAllTiles = [...updatedAllTiles];
      let scoreIncrement = 0;

      const matchedType = Object.entries(typeCount).find(([_, count]) => count === 3);
      if (matchedType) {
        const typeToRemove = parseInt(matchedType[0]);
        finalSlot = finalSlot.filter(t => t.type !== typeToRemove);
        finalAllTiles = finalAllTiles.map(t => 
          t.type === typeToRemove && t.isInSlot ? { ...t, isRemoved: true, isInSlot: false } : t
        );
        scoreIncrement = 100;
      }

      const isGameOver = finalSlot.length >= slotMaxCapacity;

      return {
        ...prev,
        allTiles: updateSelectableTiles(finalAllTiles),
        slot: finalSlot,
        score: prev.score + scoreIncrement,
        gameOver: isGameOver,
      };
    });
  };

  return (
    <div 
      className="flex flex-col h-screen w-full overflow-hidden select-none"
      style={uiConfig ? {
        backgroundImage: `url(${uiConfig.assets.backgrounds.main.path})`,
        ...uiConfig.assets.backgrounds.main.style
      } : {
        backgroundColor: '#fdfaf3'
      }}
    >
      <div className="flex justify-center items-center py-2">
        <div className="w-1/4 min-w-[140px] bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center px-4 py-2 border-2 border-blue-100">
          <img 
            src={uiConfig?.assets.ui.scoreIcon.path || '/assets/img_star.png'} 
            alt="star" 
            className="mr-2"
            style={{
              width: uiConfig?.assets.ui.scoreIcon.width || 32,
              height: uiConfig?.assets.ui.scoreIcon.height || 32
            }}
          />
          <div className="flex-1 text-center font-black text-blue-600 text-xl tracking-tight">
            {gameState.score}
          </div>
        </div>
      </div>

      <div className="w-full flex-1 relative overflow-hidden" style={{ maxHeight: '45vh' }}>
        <GameBoard 
          tiles={gameState.allTiles.filter(t => !t.isRemoved && !t.isInSlot)} 
          onTileClick={handleTileClick}
          uiConfig={uiConfig}
        />
        
        {gameState.gameOver && (
          <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-md flex items-center justify-center z-[1000]">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl text-center transform scale-110 border-4 border-blue-50">
              <h2 className="text-4xl font-black text-blue-700 mb-2">
                {uiConfig?.text.gameOver.title || 'Oops!'}
              </h2>
              <p className="text-blue-400 font-bold mb-8">
                {uiConfig?.text.gameOver.subtitle || 'Slot is full!'}
              </p>
              <button 
                onClick={initializeGame}
                className="bg-[#7d89d9] hover:bg-[#6c78c8] text-white font-black py-4 px-12 rounded-full transition-all shadow-[0_6px_0_#5a66a8] active:shadow-none active:translate-y-1"
              >
                {uiConfig?.text.buttons.tryAgain || 'TRY AGAIN'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full flex justify-center py-2 px-4">
        <div 
          className="flex justify-center items-center p-2 relative w-full"
          style={uiConfig ? {
            backgroundImage: `url(${uiConfig.assets.ui.slotContainer.path})`,
            maxWidth: uiConfig.dimensions.slotContainer?.width || 500,
            minHeight: 70,
            aspectRatio: '500 / 100',
            ...uiConfig.assets.ui.slotContainer.style
          } : {
            maxWidth: 500,
            minHeight: 70,
            backgroundColor: 'rgba(219, 234, 254, 0.3)'
          }}
        >
          <Slot tiles={gameState.slot} uiConfig={uiConfig} />
        </div>
      </div>

      <div className="w-full flex justify-center items-center pb-4 pt-2">
        <button 
          className="relative w-[85%] max-w-sm transition-all active:scale-95"
          style={uiConfig ? {
            backgroundImage: `url(${uiConfig.assets.ui.button.path})`,
            height: Math.min(uiConfig.assets.ui.button.height || 80, 70),
            ...uiConfig.assets.ui.button.style,
            border: 'none',
            backgroundColor: 'transparent'
          } : {
            height: 70,
            backgroundColor: '#7d89d9'
          }}
        >
          <span className="text-white font-black text-lg tracking-widest">
            {uiConfig?.text.buttons.getMoreTiles || 'GET MORE TILES'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default App;
