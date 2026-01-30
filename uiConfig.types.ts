export interface UIConfig {
  gameInfo: {
    name: string;
    version: string;
    description: string;
  };
  
  dimensions: {
    gameBoardTile: {
      size: number;
    };
    gameBoardContainer: {
      width: number;
      height: number;
    };
    tileSpacing: {
      horizontal: number;
      vertical: number;
    };
    tilePosition: {
      startX: number;
      startY: number;
      randomOffsetRange: number;
      layerZOffset: number;
    };
    tileCollision: {
      overlapThreshold: number;
    };
    board: {
      width: number;
      height: number;
    };
    slot: {
      maxCapacity: number;
    };
    slotContainer?: {
      width: number;
      height: number;
    };
    slotItem: {
      width: number;
      height: number;
    };
  };
  
  assets: {
    backgrounds: {
      main: {
        path: string;
        name: string;
        style: {
          backgroundSize: string;
          backgroundPosition: string;
          backgroundRepeat: string;
        };
      };
    };
    
    tiles: {
      background: {
        path: string;
        name: string;
        gameBoardScale: string;
        slotScale: string;
      };
      fruits: Array<{
        id: number;
        path: string;
        name: string;
        baseColor: string;
      }>;
      fruitScale: {
        gameBoard: string;
        slot: string;
      };
    };
    
    ui: {
      scoreBar?: {
        path: string;
        name: string;
        width: number;
        height: number;
        style: {
          backgroundSize: string;
          backgroundPosition: string;
          backgroundRepeat: string;
        };
      };
      scoreIcon: {
        path: string;
        name: string;
        width: number;
        height: number;
        offsetX?: number;
      };
      button: {
        path: string;
        name: string;
        height: number;
        style: {
          backgroundSize: string;
          backgroundPosition: string;
          backgroundRepeat: string;
        };
      };
      slotContainer: {
        path: string;
        name: string;
        height: number;
        style: {
          backgroundSize: string;
          backgroundPosition: string;
          backgroundRepeat: string;
        };
      };
      slotCell: {
        path: string;
        name: string;
        style: {
          backgroundSize: string;
          backgroundPosition: string;
          backgroundRepeat: string;
        };
      };
    };
  };
  
  effects: {
    shadows: {
      tile: string;
      tileInSlot: string;
    };
    animations: {
      tileEnterSlot: string;
      buttonPress: string;
    };
    transitions: {
      tile: string;
      button: string;
    };
  };
  
  gameplay: {
    scoring: {
      matchBonus: number;
    };
    tiles: {
      totalCount: number;
      typesCount: number;
      matchCount: number;
    };
    layout: {
      layers: number;
      tilesPerLayer: number;
      randomOffset: number;
    };
  };
  
  text: {
    buttons: {
      getMoreTiles: string;
      tryAgain: string;
    };
    gameOver: {
      title: string;
      subtitle: string;
    };
  };
}