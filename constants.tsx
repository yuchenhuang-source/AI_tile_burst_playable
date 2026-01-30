
import { UIConfig } from './uiConfig.types';
import { getUIConfig } from './configLoader';

/**
 * =========================================================================
 * 配置说明 (CONFIGURATION GUIDE)
 * =========================================================================
 * 所有UI配置现在都在 public/uiConfig.json 文件中
 * 修改该文件即可更改游戏的视觉效果和参数
 * =========================================================================
 */

// 从配置文件获取方块类型
export function getTileTypes() {
  const config = getUIConfig();
  if (!config) {
    // 默认配置（配置文件未加载时使用）
    return [
      { icon: '🍎', image: '', baseColor: '#7d89d9' },
      { icon: '🥑', image: '', baseColor: '#7d89d9' },
      { icon: '🍇', image: '', baseColor: '#7d89d9' },
      { icon: '🍊', image: '', baseColor: '#7d89d9' },
      { icon: '🍓', image: '', baseColor: '#7d89d9' },
      { icon: '🫐', image: '', baseColor: '#7d89d9' },
    ];
  }
  
  return config.assets.tiles.fruits.map(fruit => ({
    icon: '',
    image: fruit.path,
    baseColor: fruit.baseColor
  }));
}

// 从配置文件获取槽位容量
export function getSlotMaxCapacity() {
  const config = getUIConfig();
  return config?.dimensions.slot.maxCapacity || 7;
}

// 导出兼容性常量
export const TILE_TYPES = getTileTypes();
export const SLOT_MAX_CAPACITY = getSlotMaxCapacity();
