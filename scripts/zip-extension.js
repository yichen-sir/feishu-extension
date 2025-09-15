#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const sourceDir = path.join(__dirname, '..', 'extension');
const distDir = path.join(__dirname, '..', 'dist');
const outputFile = path.join(distDir, 'feishu-extension.zip');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ 创建 dist 目录');
}

const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', () => {
  const size = (archive.pointer() / 1024).toFixed(2);
  console.log(`✅ 打包完成！`);
  console.log(`📦 文件位置: ${outputFile}`);
  console.log(`📊 文件大小: ${size} KB`);
  console.log(`📋 包含文件: ${archive.pointer()} bytes written`);
  console.log('\n🎉 可以将此 zip 文件分享给其他用户安装');
});

archive.on('error', (err) => {
  console.error('❌ 打包失败:', err);
  process.exit(1);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('⚠️ 警告:', err);
  } else {
    throw err;
  }
});

console.log('📦 开始打包 Chrome 扩展...');
console.log(`📂 源目录: ${sourceDir}`);
console.log(`📁 输出到: ${outputFile}\n`);

archive.pipe(output);

const filesToInclude = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'background.js',
  'background-simple.js'
];

let includedCount = 0;
filesToInclude.forEach(file => {
  const filePath = path.join(sourceDir, file);
  if (fs.existsSync(filePath)) {
    archive.file(filePath, { name: file });
    console.log(`  ✓ 添加: ${file}`);
    includedCount++;
  } else {
    console.log(`  ⚠️ 跳过: ${file} (文件不存在)`);
  }
});

console.log(`\n📊 共添加 ${includedCount} 个文件`);

archive.finalize();