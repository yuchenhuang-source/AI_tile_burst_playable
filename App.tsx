
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TileData, GameState, FlyingTile, DEFAULT_TILE_SIZE } from './types';
import { getTileTypes, getSlotMaxCapacity } from './constants';
import GameBoard from './components/GameBoard';
import Slot from './components/Slot';
import FlyingStar from './components/FlyingStar';
import SpriteAnimation from './components/SpriteAnimation';
import { loadUIConfig } from './configLoader';
import { UIConfig } from './uiConfig.types';
import './animations.css';

interface FlyingStarData {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    allTiles: [],
    slot: [],
    score: 0,
    gameOver: false,
  });
  const [uiConfig, setUIConfig] = useState<UIConfig | null>(null);
  const [flyingTile, setFlyingTile] = useState<FlyingTile | null>(null);
  const [starBurstSlots, setStarBurstSlots] = useState<number[]>([]);
  const [flyingStars, setFlyingStars] = useState<FlyingStarData[]>([]);
  const [scoreStarBursts, setScoreStarBursts] = useState<string[]>([]);
  const [shiftingTiles, setShiftingTiles] = useState<{ id: string; fromIndex: number; toIndex: number; direction: 'left' | 'right' }[]>([]);
  const slotContainerRef = useRef<HTMLDivElement>(null);
  const scoreIconRef = useRef<HTMLDivElement>(null);

  const initializeGame = useCallback(() => {
    const tiles: TileData[] = [];
    const tileTypes = getTileTypes();
    const numTypes = 6;
    const setsOfThree = 12; // Total 36 tiles
    
    // 使用配置中的值，如果没有则使用默认值
    const tileSize = uiConfig?.dimensions.gameBoardTile.size || DEFAULT_TILE_SIZE;
    const tileSpacingH = uiConfig?.dimensions.tileSpacing.horizontal || 4;
    const tileSpacingV = uiConfig?.dimensions.tileSpacing.vertical || 4;
    const startX = uiConfig?.dimensions.tilePosition.startX || 50;
    const startY = uiConfig?.dimensions.tilePosition.startY || 30;
    const randomRange = uiConfig?.dimensions.tilePosition.randomOffsetRange || 35;
    const layerZOffset = uiConfig?.dimensions.tilePosition.layerZOffset || 2;
    
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
      
      const offsetX = (Math.random() - 0.5) * randomRange;
      const offsetY = (Math.random() - 0.5) * randomRange;

      return {
        ...tile,
        level: layer,
        x: col * (tileSize + tileSpacingH) + startX + offsetX,
        y: row * (tileSize + tileSpacingV) + startY + offsetY + (layer * layerZOffset),
      };
    });

    setGameState({
      allTiles: updateSelectableTiles(positionedTiles),
      slot: [],
      score: 0,
      gameOver: false,
    });
  }, [uiConfig]);

  useEffect(() => {
    loadUIConfig().then(config => {
      setUIConfig(config);
      
      if (config?.effects.animations.starBurst) {
        const { frameCount, basePath, frameFormat, extension } = config.effects.animations.starBurst;
        for (let i = 1; i <= frameCount; i++) {
          const img = new Image();
          img.src = `${basePath}${i.toString().padStart(frameFormat.length, '0')}${extension}`;
        }
      }
    }).catch(error => {
      console.error('Failed to load UI config:', error);
    });
  }, []);

  useEffect(() => {
    // 当配置加载完成后初始化游戏
    if (uiConfig !== null || gameState.allTiles.length === 0) {
      initializeGame();
    }
  }, [uiConfig, initializeGame]);

  function updateSelectableTiles(tiles: TileData[]): TileData[] {
    const tileSize = uiConfig?.dimensions.gameBoardTile.size || DEFAULT_TILE_SIZE;
    const overlapThreshold = uiConfig?.dimensions.tileCollision.overlapThreshold || 10;
    
    return tiles.map((tile) => {
      if (tile.isRemoved || tile.isInSlot) return { ...tile, isSelectable: false };
      
      const isCovered = tiles.some(other => {
        if (other.isRemoved || other.isInSlot || other.level <= tile.level || other.id === tile.id) return false;
        
        const rect1 = { x: tile.x, y: tile.y, w: tileSize, h: tileSize };
        const rect2 = { x: other.x, y: other.y, w: tileSize, h: tileSize };
        
        return (
          rect1.x < rect2.x + rect2.w - overlapThreshold &&
          rect1.x + rect1.w > rect2.x + overlapThreshold &&
          rect1.y < rect2.y + rect2.h - overlapThreshold &&
          rect1.y + rect1.h > rect2.y + overlapThreshold
        );
      });

      return { ...tile, isSelectable: !isCovered };
    });
  }

  const handleTileClick = (tileId: string, tileRect: DOMRect) => {
    const slotMaxCapacity = uiConfig?.dimensions.slot.maxCapacity || getSlotMaxCapacity();
    
    if (gameState.slot.length >= slotMaxCapacity || gameState.gameOver || flyingTile) return;

    const tile = gameState.allTiles.find(t => t.id === tileId);
    if (!tile || !tile.isSelectable) return;

    const slotContainer = slotContainerRef.current;
    if (!slotContainer) return;

    const currentSlot = [...gameState.slot];
    
    const sameTypeIndices = currentSlot
      .map((t, i) => t.type === tile.type ? i : -1)
      .filter(i => i !== -1);
    
    let insertIndex: number;
    if (sameTypeIndices.length > 0) {
      insertIndex = sameTypeIndices[sameTypeIndices.length - 1] + 1;
    } else {
      insertIndex = currentSlot.length;
    }

    console.log('[DEBUG] handleTileClick: tileType=', tile.type, 'insertIndex=', insertIndex, 'currentSlot=', currentSlot.map(t => t.type));

    const tilesToShiftRight: { id: string; fromIndex: number; toIndex: number; direction: 'left' | 'right' }[] = [];
    for (let i = insertIndex; i < currentSlot.length; i++) {
      tilesToShiftRight.push({
        id: currentSlot[i].id,
        fromIndex: i,
        toIndex: i + 1,
        direction: 'right'
      });
    }

    if (tilesToShiftRight.length > 0) {
      console.log('[DEBUG] tilesToShiftRight:', tilesToShiftRight);
    }

    if (tilesToShiftRight.length > 0) {
      setShiftingTiles(tilesToShiftRight);
    }

    const targetSlotElement = slotContainer.querySelector(`[data-slot-index="${insertIndex}"]`);
    if (!targetSlotElement) return;
    
    const slotCellRect = targetSlotElement.getBoundingClientRect();
    const tileSize = uiConfig?.dimensions.gameBoardTile.size || DEFAULT_TILE_SIZE;
    
    const targetX = slotCellRect.left + slotCellRect.width / 2 - tileSize / 2;
    const targetY = slotCellRect.top + slotCellRect.height / 2 - tileSize / 2;

    setFlyingTile({
      tile: tile,
      startX: tileRect.left,
      startY: tileRect.top,
      endX: targetX,
      endY: targetY,
      isFlying: false,
    });

    setGameState(prev => ({
      ...prev,
      allTiles: prev.allTiles.map(t => 
        t.id === tileId ? { ...t, isInSlot: true } : t
      ),
    }));

    requestAnimationFrame(() => {
      setFlyingTile(prev => prev ? { ...prev, isFlying: true } : null);
    });

    const flyDuration = uiConfig?.effects.animations.tileToSlot.duration || 400;

    setTimeout(() => {
      setShiftingTiles([]);
      setFlyingTile(null);
      
      setGameState(prev => {
        const newTile = { ...tile, isInSlot: true, animationState: 'bouncing' as const };
        const newSlot = [...prev.slot];
        newSlot.splice(insertIndex, 0, newTile);
        
        console.log('[DEBUG] After insert: newSlot=', newSlot.map(t => t.type));
        
        const updatedAllTiles = prev.allTiles.map(t => 
          t.id === tileId ? { ...t, isInSlot: true } : t
        );

        const typeCount: Record<number, number> = {};
        newSlot.forEach(t => {
          typeCount[t.type] = (typeCount[t.type] || 0) + 1;
        });

        

        const matchedType = Object.entries(typeCount).find(([_, count]) => count === 3);
        
        if (matchedType) {
          const typeToRemove = parseInt(matchedType[0]);
          const matchDuration = uiConfig?.effects.animations.tileMatch.duration || 300;
          
          const slotWithMatchAnimation = newSlot.map(t => 
            t.type === typeToRemove ? { ...t, animationState: 'matching' as const } : t
          );
          
          const matchingIndices: number[] = [];
          newSlot.forEach((t, idx) => {
            if (t.type === typeToRemove) {
              matchingIndices.push(idx);
            }
          });
          setStarBurstSlots(matchingIndices);
          
          setTimeout(() => {
            setGameState(current => {
              const oldSlot = current.slot;
              const remainingSlot = oldSlot.filter(t => t.type !== typeToRemove);
              
              const matchingIndicesSet = new Set<number>();
              oldSlot.forEach((t, idx) => {
                if (t.type === typeToRemove) {
                  matchingIndicesSet.add(idx);
                }
              });
              
              const tilesToShiftLeft: { id: string; fromIndex: number; toIndex: number; direction: 'left' | 'right' }[] = [];
              
              remainingSlot.forEach((t, newIdx) => {
                const oldIdx = oldSlot.findIndex(ot => ot.id === t.id);
                if (oldIdx !== newIdx) {
                  tilesToShiftLeft.push({
                    id: t.id,
                    fromIndex: oldIdx - newIdx,
                    toIndex: 0,
                    direction: 'left'
                  });
                }
              });
              
              if (tilesToShiftLeft.length > 0) {
                setShiftingTiles(tilesToShiftLeft);
                
                const leftShiftDuration = uiConfig?.effects.animations.slotShiftLeft?.duration || 300;
                setTimeout(() => {
                  setShiftingTiles([]);
                }, leftShiftDuration);
              }
              
              const finalAllTiles = current.allTiles.map(t => 
                t.type === typeToRemove && t.isInSlot ? { ...t, isRemoved: true, isInSlot: false } : t
              );
              
              return {
                ...current,
                allTiles: updateSelectableTiles(finalAllTiles),
                slot: remainingSlot,
                score: current.score + 100,
                scorePopup: { value: 100, key: Date.now() },
              };
            });
          }, matchDuration);

          return {
            ...prev,
            allTiles: updateSelectableTiles(updatedAllTiles),
            slot: slotWithMatchAnimation,
          };
        }

        const isGameOver = newSlot.length >= slotMaxCapacity;

        setTimeout(() => {
          setGameState(current => ({
            ...current,
            slot: current.slot.map(t => ({ ...t, animationState: 'idle' as const }))
          }));
        }, uiConfig?.effects.animations.slotBounce.duration || 200);

        return {
          ...prev,
          allTiles: updateSelectableTiles(updatedAllTiles),
          slot: newSlot,
          gameOver: isGameOver,
        };
      });
    }, flyDuration);
  };

  const handleStarBurstComplete = (index: number, position: {x: number, y: number}) => {
    setStarBurstSlots(prev => prev.filter(i => i !== index));
    
    if (position.x === 0 && position.y === 0) return;
    
    const scoreIcon = scoreIconRef.current;
    if (!scoreIcon) return;
    
    const iconRect = scoreIcon.getBoundingClientRect();
    const endX = iconRect.left + iconRect.width / 2;
    const endY = iconRect.top + iconRect.height / 2;
    
    const starId = `star-${Date.now()}-${index}`;
    setFlyingStars(prev => [...prev, {
      id: starId,
      startX: position.x,
      startY: position.y,
      endX,
      endY,
    }]);
  };

  const handleFlyingStarComplete = (starId: string) => {
    setFlyingStars(prev => prev.filter(s => s.id !== starId));
    const burstId = `score-burst-${Date.now()}-${Math.random()}`;
    setScoreStarBursts(prev => [...prev, burstId]);
  };

  const handleScoreStarBurstComplete = (burstId: string) => {
    setScoreStarBursts(prev => prev.filter(id => id !== burstId));
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
        <div className="relative flex items-center justify-center">
          <div
            ref={scoreIconRef}
            className="absolute z-[1001]"
            style={{
              width: uiConfig?.assets.ui.scoreIcon.width || 50,
              height: uiConfig?.assets.ui.scoreIcon.height || 50,
              left: 0,
              transform: 'translateX(-50%)'
            }}
          >
            {scoreStarBursts.map(burstId => (
              uiConfig?.effects.animations.starBurst && (
                <div 
                  key={burstId}
                  className="absolute z-[1] pointer-events-none"
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
                    onComplete={() => handleScoreStarBurstComplete(burstId)}
                  />
                </div>
              )
            ))}
            <img 
              src={uiConfig?.assets.ui.scoreIcon.path || '/assets/img_star.png'} 
              alt="star" 
              className="relative z-[2]"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <img 
            src={uiConfig?.assets.ui.scoreBar?.path || '/assets/img_name_bg.png'}
            alt="score bar"
            style={{
              width: uiConfig?.assets.ui.scoreBar?.width || 210,
              height: uiConfig?.assets.ui.scoreBar?.height || 66
            }}
          />
          <span 
            className="absolute font-black text-white text-lg tracking-tight"
            style={{ 
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              left: '50%',
              transform: 'translateX(-30%)'
            }}
          >
            {gameState.score}
          </span>
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
          ref={slotContainerRef}
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
          <Slot 
            tiles={gameState.slot} 
            uiConfig={uiConfig} 
            starBurstSlots={starBurstSlots}
            onStarBurstComplete={handleStarBurstComplete}
            shiftingTiles={shiftingTiles}
            onShiftComplete={() => setShiftingTiles([])}
          />
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

      {flyingTile && (
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: flyingTile.isFlying ? flyingTile.endX : flyingTile.startX,
            top: flyingTile.isFlying ? flyingTile.endY : flyingTile.startY,
            width: uiConfig?.dimensions.gameBoardTile.size || DEFAULT_TILE_SIZE,
            height: uiConfig?.dimensions.gameBoardTile.size || DEFAULT_TILE_SIZE,
            transition: flyingTile.isFlying 
              ? `all ${uiConfig?.effects.animations.tileToSlot.duration || 400}ms ${uiConfig?.effects.animations.tileToSlot.easing || 'cubic-bezier(0.34, 1.56, 0.64, 1)'}`
              : 'none',
          }}
        >
          <div className="relative w-full h-full">
            <img 
              src={uiConfig?.assets.tiles.background.path || "/assets/棋子块.png"} 
              alt="tile background" 
              className="absolute object-contain w-full h-full"
              style={{
                filter: uiConfig?.effects.shadows.tile || 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))'
              }}
            />
            <div className="relative z-10 flex items-center justify-center w-full h-full">
              {flyingTile.tile.image ? (
                <img 
                  src={flyingTile.tile.image} 
                  alt={flyingTile.tile.icon} 
                  className="object-contain select-none"
                  style={{
                    width: uiConfig?.assets.tiles.fruitScale.gameBoard || '55%',
                    height: uiConfig?.assets.tiles.fruitScale.gameBoard || '55%'
                  }}
                />
              ) : (
                <span className="text-3xl select-none">{flyingTile.tile.icon}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {flyingStars.map(star => (
        <FlyingStar
          key={star.id}
          startX={star.startX}
          startY={star.startY}
          endX={star.endX}
          endY={star.endY}
          duration={uiConfig?.effects.animations.starFly?.duration || 600}
          easing={uiConfig?.effects.animations.starFly?.easing || 'ease-in'}
          size={uiConfig?.effects.animations.starFly?.starSize || 30}
          imagePath={uiConfig?.effects.animations.starFly?.starImage || '/assets/img_star.png'}
          delay={uiConfig?.effects.animations.starFly?.delay || 0}
          onComplete={() => handleFlyingStarComplete(star.id)}
        />
      ))}
    </div>
  );
};

export default App;
