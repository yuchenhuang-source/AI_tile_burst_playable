import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取构建后的HTML文件
const htmlPath = path.join(__dirname, 'dist', 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// 读取JS文件
const jsFiles = fs.readdirSync(path.join(__dirname, 'dist', 'assets'))
  .filter(file => file.endsWith('.js'));

jsFiles.forEach(jsFile => {
  const jsPath = path.join(__dirname, 'dist', 'assets', jsFile);
  const jsContent = fs.readFileSync(jsPath, 'utf-8');
  
  // 替换HTML中的JS引用为内联脚本
  htmlContent = htmlContent.replace(
    new RegExp(`<script[^>]*src="[^"]*${jsFile}"[^>]*></script>`, 'g'),
    `<script type="module">${jsContent}</script>`
  );
});

// 读取并内联所有图片资源
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
const assetsDir = path.join(__dirname, 'dist', 'assets');

// 创建一个映射来存储所有图片的base64数据
const imageMap = {};

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
    
    imageMap[`/assets/${file}`] = `data:${mimeType};base64,${base64}`;
  }
});

// 读取uiConfig.json
const configPath = path.join(__dirname, 'dist', 'uiConfig.json');
let configContent = fs.readFileSync(configPath, 'utf-8');
const config = JSON.parse(configContent);

// 替换配置中的图片路径为base64
function replaceImagePaths(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      replaceImagePaths(obj[key]);
    } else if (typeof obj[key] === 'string') {
      // 检查是否是图片路径
      if (obj[key].startsWith('/assets/') && imageMap[obj[key]]) {
        obj[key] = imageMap[obj[key]];
      }
    }
  }
}

replaceImagePaths(config);

// 将更新后的配置内联到HTML中
const configScript = `
<script>
  window.__INLINE_UI_CONFIG__ = ${JSON.stringify(config, null, 2)};
</script>
`;

// 在body标签开始后插入配置
htmlContent = htmlContent.replace('<body>', `<body>${configScript}`);

// 修改configLoader.ts中的加载逻辑
// 替换JS内容中对uiConfig.json的fetch请求
jsFiles.forEach(jsFile => {
  const jsPath = path.join(__dirname, 'dist', 'assets', jsFile);
  let jsContent = fs.readFileSync(jsPath, 'utf-8');
  
  // 替换fetch请求
  jsContent = jsContent.replace(
    /await fetch\(["']\/uiConfig\.json["']\)/g,
    '{ ok: true, json: async () => window.__INLINE_UI_CONFIG__ }'
  );
  
  // 替换response.json()调用
  jsContent = jsContent.replace(
    /response\.json\(\)/g,
    '(typeof response.json === "function" ? response.json() : window.__INLINE_UI_CONFIG__)'
  );
  
  // 更新HTML中的脚本内容
  htmlContent = htmlContent.replace(
    `<script type="module">${fs.readFileSync(jsPath, 'utf-8')}</script>`,
    `<script type="module">${jsContent}</script>`
  );
});

// 替换所有剩余的图片引用
for (const [imagePath, base64] of Object.entries(imageMap)) {
  // 使用更精确的替换方式
  const escapedPath = imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(["'])${escapedPath}\\1`, 'g');
  htmlContent = htmlContent.replace(regex, `$1${base64}$1`);
  
  // 也替换可能的相对路径
  const relativePath = imagePath.substring(1);
  const relativeRegex = new RegExp(`(["'])${relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g');
  htmlContent = htmlContent.replace(relativeRegex, `$1${base64}$1`);
}

// 添加一些优化的meta标签和样式
const metaTags = `
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <style>
    /* 优化图片渲染质量 */
    img {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      transform: translateZ(0);
      will-change: transform;
    }
    /* 优化动画性能 */
    * {
      -webkit-tap-highlight-color: transparent;
    }
    /* 确保高DPI屏幕清晰度 */
    @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
      img {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: pixelated;
      }
    }
    /* 防止图片模糊 */
    .tile-image, .slot-image {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
  </style>
`;

htmlContent = htmlContent.replace('</head>', `${metaTags}</head>`);

// 确保HTML有正确的DOCTYPE
if (!htmlContent.startsWith('<!DOCTYPE html>')) {
  htmlContent = '<!DOCTYPE html>\n' + htmlContent;
}

// 写入独立的HTML文件
const outputPath = path.join(__dirname, 'zen-match-explorer-standalone.html');
fs.writeFileSync(outputPath, htmlContent);

console.log(`✅ 独立HTML文件已生成: ${outputPath}`);
console.log(`📦 文件大小: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`🎮 可以直接在浏览器中打开此文件进行游戏！`);