import { UIConfig } from './uiConfig.types';
import defaultConfig from './public/uiConfig.json';

let cachedConfig: UIConfig | null = null;

export async function loadUIConfig(): Promise<UIConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }
  
  // 检查是否有内联配置
  if ((window as any).__INLINE_UI_CONFIG__) {
    cachedConfig = (window as any).__INLINE_UI_CONFIG__;
    return cachedConfig!;
  }
  
  try {
    const response = await fetch('/uiConfig.json');
    if (!response.ok) {
      // 如果无法加载外部配置，使用默认配置
      console.warn('Failed to load external config, using default config');
      cachedConfig = defaultConfig as UIConfig;
      return cachedConfig;
    }
    cachedConfig = await response.json();
    return cachedConfig!;
  } catch (error) {
    console.error('Error loading UI config:', error);
    // 使用默认配置作为后备
    cachedConfig = defaultConfig as UIConfig;
    return cachedConfig;
  }
}

export function getUIConfig(): UIConfig | null {
  return cachedConfig;
}