import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 开始生成完整的独立HTML文件...');

// 读取vite-plugin-singlefile生成的HTML
const htmlPath = path.join(__dirname, 'dist', 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// 读取所有图片资源并转换为base64
const assetsDir = path.join(__dirname, 'dist', 'assets');
const publicDir = path.join(__dirname, 'public', 'assets');
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
const imageMap = {};

// 处理dist/assets目录中的图片
if (fs.existsSync(assetsDir)) {
  fs.readdirSync(assetsDir).forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (imageExtensions.includes(ext)) {
      const filePath = path.join(assetsDir, file);
      const fileContent = fs.readFileSync(filePath);
      const base64 = fileContent.toString('base64');
      const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                       ext === '.png' ? 'image/png' : 
                       ext === '.gif' ? 'image/gif' : 
                       ext === '.svg' ? 'image/svg+xml' : 'image/png';
      
      // 存储多种可能的路径格式
      imageMap[`/assets/${file}`] = `data:${mimeType};base64,${base64}`;
      imageMap[`assets/${file}`] = `data:${mimeType};base64,${base64}`;
      imageMap[`./${file}`] = `data:${mimeType};base64,${base64}`;
      imageMap[file] = `data:${mimeType};base64,${base64}`;
      
      console.log(`  ✓ 已内联图片: ${file}`);
    }
  });
}

// 处理public/assets目录中的图片（如果dist中没有）
if (fs.existsSync(publicDir)) {
  fs.readdirSync(publicDir).forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (imageExtensions.includes(ext) && !imageMap[`/assets/${file}`]) {
      const filePath = path.join(publicDir, file);
      const fileContent = fs.readFileSync(filePath);
      const base64 = fileContent.toString('base64');
      const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                       ext === '.png' ? 'image/png' : 
                       ext === '.gif' ? 'image/gif' : 
                       ext === '.svg' ? 'image/svg+xml' : 'image/png';
      
      imageMap[`/assets/${file}`] = `data:${mimeType};base64,${base64}`;
      imageMap[`assets/${file}`] = `data:${mimeType};base64,${base64}`;
      
      console.log(`  ✓ 已内联图片: ${file} (from public)`);
    }
  });
}

// 读取并内联uiConfig.json
const configPath = path.join(__dirname, 'public', 'uiConfig.json');
if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent);
  
  // 替换配置中的图片路径为base64
  function replaceImagePaths(obj) {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        replaceImagePaths(obj[key]);
      } else if (typeof obj[key] === 'string') {
        // 检查是否是图片路径
        for (const [imagePath, base64] of Object.entries(imageMap)) {
          if (obj[key] === imagePath || obj[key].endsWith(imagePath)) {
            obj[key] = base64;
            break;
          }
        }
      }
    }
  }
  
  replaceImagePaths(config);
  
  // 将配置内联到HTML中
  const configScript = `
    <script>
      window.__INLINE_UI_CONFIG__ = ${JSON.stringify(config, null, 2)};
    </script>
  `;
  
  // 在body标签后插入配置
  htmlContent = htmlContent.replace('<body>', `<body>\n${configScript}`);
  console.log('  ✓ 已内联 uiConfig.json');
}

// 替换HTML中所有的图片引用
for (const [imagePath, base64] of Object.entries(imageMap)) {
  // 使用多种替换模式确保所有引用都被替换
  const patterns = [
    new RegExp(`(["'])${imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g'),
    new RegExp(`(["'])\\/${imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g'),
    new RegExp(`(["'])\\.\\/${imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g'),
  ];
  
  patterns.forEach(pattern => {
    const before = htmlContent.length;
    htmlContent = htmlContent.replace(pattern, `$1${base64}$1`);
    if (htmlContent.length !== before) {
      console.log(`  ✓ 替换了 ${imagePath} 的引用`);
    }
  });
}

// 替换fetch('/uiConfig.json')为使用内联配置
htmlContent = htmlContent.replace(
  /fetch\(["']\/uiConfig\.json["']\)/g,
  'Promise.resolve({ ok: true, json: () => Promise.resolve(window.__INLINE_UI_CONFIG__) })'
);

// 添加优化的meta标签
const additionalMeta = `
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <style>
    /* 确保图片高质量渲染 */
    img {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    /* 优化性能 */
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
    }
    /* 防止用户选择文本 */
    body {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  </style>
`;

if (!htmlContent.includes('apple-mobile-web-app-capable')) {
  htmlContent = htmlContent.replace('</head>', `${additionalMeta}\n</head>`);
}

// 确保有正确的DOCTYPE
if (!htmlContent.startsWith('<!DOCTYPE html>')) {
  htmlContent = '<!DOCTYPE html>\n' + htmlContent;
}

// 写入最终的独立HTML文件
const outputPath = path.join(__dirname, 'zen-match-explorer-complete.html');
fs.writeFileSync(outputPath, htmlContent);

// 计算文件大小
const stats = fs.statSync(outputPath);
const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log('\n✅ 完整的独立HTML文件已生成！');
console.log(`📁 文件位置: ${outputPath}`);
console.log(`📦 文件大小: ${fileSizeMB} MB`);
console.log(`🎮 可以直接在浏览器中打开此文件进行游戏！`);
console.log('\n提示：');
console.log('  - 此文件包含所有游戏资源，无需网络连接');
console.log('  - 支持在手机、平板和电脑上运行');
console.log('  - 所有图片已优化以保持最佳清晰度');