
/**
 * =========================================================================
 * 如何更换素材 (HOW TO CHANGE ASSETS)
 * =========================================================================
 * 1. 更换图标: 
 *    修改下方 TILE_TYPES 数组中每个对象的 'icon' (使用 Emoji)
 *    或者添加 'image' 属性 (使用图片 URL)。
 * 
 * 2. 使用图片素材:
 *    例如: { icon: '', image: 'https://example.com/apple.png', baseColor: '#7d89d9' }
 *    脚本会自动检测并优先渲染图片。
 * 
 * 3. 更换底色:
 *    修改 'baseColor' 属性。这个颜色决定了方块侧面和底部的 3D 深度颜色。
 * 
 * 4. 调整槽位数量:
 *    修改 SLOT_MAX_CAPACITY 的值。
 * =========================================================================
 */

export const TILE_TYPES = [
  // 使用棋子图片素材
  { icon: '', image: '/assets/ic_tile_strawberry.png', baseColor: '#ff6b6b' }, 
  { icon: '', image: '/assets/ic_tile_grape.png', baseColor: '#9775fa' }, 
  { icon: '', image: '/assets/ic_tile_orange.png', baseColor: '#ff922b' }, 
  { icon: '', image: '/assets/ic_tile_lemon.png', baseColor: '#ffd43b' }, 
  { icon: '', image: '/assets/ic_tile_blueberry.png', baseColor: '#4c6ef5' }, 
  { icon: '', image: '/assets/ic_tile_watermelon.png', baseColor: '#51cf66' }, 
];

// 游戏底槽的最大容量
export const SLOT_MAX_CAPACITY = 6;
