
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

export const TILE_SIZE = 76;
export const BOARD_WIDTH = 400;
export const BOARD_HEIGHT = 600;
