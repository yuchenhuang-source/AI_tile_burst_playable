
export interface TileData {
  id: string;
  type: number;
  icon: string;
  image?: string; // Optional image URL for the tile face
  baseColor: string;
  x: number;
  y: number;
  level: number;
  isRemoved: boolean;
  isInSlot: boolean;
  isSelectable: boolean;
}

export interface GameState {
  allTiles: TileData[];
  slot: TileData[];
  score: number;
  gameOver: boolean;
}

// 这些值现在从 uiConfig.json 动态加载
// 默认值仅用于配置加载失败时的后备
export const DEFAULT_TILE_SIZE = 51;
export const DEFAULT_BOARD_WIDTH = 400;
export const DEFAULT_BOARD_HEIGHT = 600;
