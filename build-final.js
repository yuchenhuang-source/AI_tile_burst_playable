import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 开始生成完整的独立HTML文件...\n');

// 读取构建后的HTML文件
const htmlPath = path.join(__dirname, 'dist', 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

console.log('📖 读取HTML文件成功');

// 读取所有图片资源并转换为base64
const publicAssetsDir = path.join(__dirname, 'public', 'assets');
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
const imageMap = {};

console.log('\n📦 开始处理图片资源...');

if (fs.existsSync(publicAssetsDir)) {
  fs.readdirSync(publicAssetsDir).forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (imageExtensions.includes(ext)) {
      const filePath = path.join(publicAssetsDir, file);
      const fileContent = fs.readFileSync(filePath);
      const base64 = fileContent.toString('base64');
      const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                       ext === '.png' ? 'image/png' : 
                       ext === '.gif' ? 'image/gif' : 
                       ext === '.svg' ? 'image/svg+xml' : 'image/png';
      
      const dataUrl = `data:${mimeType};base64,${base64}`;
      imageMap[`/assets/${file}`] = dataUrl;
      
      console.log(`  ✓ ${file} (${(fileContent.length / 1024).toFixed(1)} KB)`);
    }
  });
}

console.log(`\n✅ 共处理 ${Object.keys(imageMap).length} 个图片文件`);

// 读取uiConfig.json并替换其中的图片路径
console.log('\n📝 处理配置文件...');
const configPath = path.join(__dirname, 'public', 'uiConfig.json');
const configContent = fs.readFileSync(configPath, 'utf-8');
const config = JSON.parse(configContent);

// 递归替换配置中的所有图片路径
function replaceImagePaths(obj, parentKey = '') {
  for (let key in obj) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      replaceImagePaths(obj[key], fullKey);
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          replaceImagePaths(item, `${fullKey}[${index}]`);
        }
      });
    } else if (typeof obj[key] === 'string' && obj[key].startsWith('/assets/')) {
      const originalPath = obj[key];
      if (imageMap[originalPath]) {
        obj[key] = imageMap[originalPath];
        console.log(`  ✓ 替换: ${fullKey} -> ${originalPath.split('/').pop()}`);
      } else {
        console.log(`  ⚠️  未找到: ${originalPath}`);
      }
    }
  }
}

replaceImagePaths(config);

// 创建内联配置脚本
const configScript = `
<script>
  // 内联的UI配置
  window.__INLINE_UI_CONFIG__ = ${JSON.stringify(config, null, 2)};
  console.log('✅ UI配置已加载', window.__INLINE_UI_CONFIG__);
</script>
`;

// 在body标签后立即插入配置
const bodyMatch = htmlContent.match(/<body[^>]*>/);
if (bodyMatch) {
  const bodyTag = bodyMatch[0];
  const bodyIndex = htmlContent.indexOf(bodyTag);
  htmlContent = htmlContent.slice(0, bodyIndex + bodyTag.length) + '\n' + configScript + htmlContent.slice(bodyIndex + bodyTag.length);
  console.log('  ✓ 配置脚本已插入到body标签后');
} else {
  console.log('  ⚠️  未找到body标签，尝试插入到head结束前');
  htmlContent = htmlContent.replace('</head>', `${configScript}\n</head>`);
}

console.log('\n✅ 配置文件已内联到HTML');

// 在HTML中的script标签内替换fetch调用
console.log('\n🔧 修改资源加载逻辑...');

// 查找并修改内联的JavaScript代码
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let scriptMatch;
let scriptCount = 0;

htmlContent = htmlContent.replace(scriptRegex, (match, scriptContent) => {
  if (scriptContent.includes('fetch') || scriptContent.includes('uiConfig')) {
    scriptCount++;
    
    // 替换fetch('/uiConfig.json')调用
    scriptContent = scriptContent.replace(
      /fetch\s*\(\s*["']\/uiConfig\.json["']\s*\)/g,
      'Promise.resolve({ ok: true, json: () => Promise.resolve(window.__INLINE_UI_CONFIG__) })'
    );
    
    // 替换可能的await fetch
    scriptContent = scriptContent.replace(
      /await\s+fetch\s*\(\s*["']\/uiConfig\.json["']\s*\)/g,
      '{ ok: true, json: async () => window.__INLINE_UI_CONFIG__ }'
    );
    
    // 确保配置加载器使用内联配置
    if (scriptContent.includes('loadUIConfig') || scriptContent.includes('cachedConfig')) {
      scriptContent = scriptContent.replace(
        /if\s*\(\s*cachedConfig\s*\)/g,
        'if (window.__INLINE_UI_CONFIG__) { return window.__INLINE_UI_CONFIG__; } if (cachedConfig)'
      );
    }
  }
  
  return `<script${match.match(/<script([^>]*)>/)[1]}>${scriptContent}</script>`;
});

console.log(`  ✓ 已修改 ${scriptCount} 个脚本标签`);

// 添加优化的样式和meta标签
const optimizationCode = `
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<style>
  /* 优化图片渲染 - 保持清晰度 */
  img {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    transform: translateZ(0);
  }
  
  /* 优化性能 */
  * {
    -webkit-tap-highlight-color: transparent;
  }
  
  /* 确保背景图正确显示 */
  [style*="backgroundImage"] {
    background-size: cover !important;
    background-position: center !important;
    background-repeat: no-repeat !important;
  }
</style>
`;

if (!htmlContent.includes('apple-mobile-web-app-capable')) {
  htmlContent = htmlContent.replace('</head>', `${optimizationCode}\n</head>`);
}

// 确保DOCTYPE存在
if (!htmlContent.trim().startsWith('<!DOCTYPE html>')) {
  htmlContent = '<!DOCTYPE html>\n' + htmlContent;
}

// 写入最终文件
const outputPath = path.join(__dirname, 'zen-match-explorer-complete.html');
fs.writeFileSync(outputPath, htmlContent, 'utf-8');

const stats = fs.statSync(outputPath);
const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log('\n' + '='.repeat(60));
console.log('✅ 独立HTML文件生成成功！');
console.log('='.repeat(60));
console.log(`📁 文件位置: ${outputPath}`);
console.log(`📦 文件大小: ${fileSizeMB} MB`);
console.log(`🖼️  内联图片: ${Object.keys(imageMap).length} 个`);
console.log('\n🎮 使用方法:');
console.log('  1. 直接双击文件在浏览器中打开');
console.log('  2. 或者拖拽到浏览器窗口');
console.log('  3. 支持离线运行，无需网络连接');
console.log('\n💡 提示:');
console.log('  - 所有资源已内联，保持原始清晰度');
console.log('  - 支持手机、平板、电脑等所有设备');
console.log('  - 可以通过任何方式分享此文件');
console.log('='.repeat(60));