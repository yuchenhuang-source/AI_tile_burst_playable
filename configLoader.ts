import { UIConfig } from './uiConfig.types';

let cachedConfig: UIConfig | null = null;

export async function loadUIConfig(): Promise<UIConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }
  
  try {
    const response = await fetch('/uiConfig.json');
    if (!response.ok) {
      throw new Error(`Failed to load UI config: ${response.statusText}`);
    }
    cachedConfig = await response.json();
    return cachedConfig!;
  } catch (error) {
    console.error('Error loading UI config:', error);
    throw error;
  }
}

export function getUIConfig(): UIConfig | null {
  return cachedConfig;
}