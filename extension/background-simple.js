// background-simple.js - 简化版Service Worker用于测试
console.log('Simple background service worker loaded');

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
  
  // 创建右键菜单
  try {
    chrome.contextMenus.create({
      id: 'save-to-feishu',
      title: '保存到飞书',
      contexts: ['page']
    });
    console.log('Context menu created successfully');
  } catch (error) {
    console.error('Failed to create context menu:', error);
  }
});

// 右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  if (info.menuItemId === 'save-to-feishu') {
    console.log('Saving page:', tab.title, tab.url);
    // 暂时只记录日志，不执行复杂操作
  }
});

// 快捷键命令处理
chrome.commands.onCommand.addListener((command) => {
  console.log('Command triggered:', command);
  if (command === 'save_to_feishu') {
    console.log('Save shortcut pressed');
  }
});