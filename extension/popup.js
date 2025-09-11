// popup.js - 弹出窗口逻辑
console.log('Popup loaded');

document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.getElementById('url');
  const titleInput = document.getElementById('title');
  const descriptionInput = document.getElementById('description');
  const notesInput = document.getElementById('notes');
  const tagsInput = document.getElementById('tags');
  const collectedAtInput = document.getElementById('collected_at');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // 设置收藏时间
  const now = new Date();
  collectedAtInput.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // 获取当前标签页信息
  getCurrentTab().then(tab => {
    if (tab) {
      urlInput.value = tab.url;
      titleInput.value = tab.title;
      
      // 获取favicon
      getFavicon(tab).then(favicon => {
        // 暂时存储favicon，后续使用
        window.currentFavicon = favicon;
        console.log('Favicon URL:', favicon);
      });
    }
  });

  // 保存按钮点击事件
  saveBtn.addEventListener('click', function() {
    saveToFeishu();
  });

  // 获取当前活动标签页
  function getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        resolve(tabs[0]);
      });
    });
  }

  // 获取favicon
  function getFavicon(tab) {
    return new Promise((resolve) => {
      // 优先使用Chrome提供的favIconUrl
      if (tab.favIconUrl && 
          !tab.favIconUrl.startsWith('chrome://') && 
          !tab.favIconUrl.startsWith('chrome-extension://')) {
        resolve(tab.favIconUrl);
        return;
      }
      
      // 尝试构造favicon URL
      try {
        const url = new URL(tab.url);
        // 跳过特殊协议的页面
        if (url.protocol === 'chrome:' || 
            url.protocol === 'chrome-extension:' || 
            url.protocol === 'file:') {
          resolve('');
          return;
        }
        
        // 构造标准favicon路径
        const faviconUrl = `${url.origin}/favicon.ico`;
        
        // 简单验证favicon是否存在（通过检查响应）
        const img = new Image();
        img.onload = () => resolve(faviconUrl);
        img.onerror = () => resolve(''); // 如果加载失败，返回空字符串
        img.src = faviconUrl;
        
        // 设置超时，避免长时间等待
        setTimeout(() => {
          resolve(faviconUrl); // 超时后直接返回URL，不管是否加载成功
        }, 2000);
        
      } catch {
        resolve('');
      }
    });
  }

  // 保存到飞书
  function saveToFeishu() {
    const data = {
      title: titleInput.value,
      url: urlInput.value,
      cn_desc: descriptionInput.value,
      notes: notesInput.value,
      tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
      favicon_url: window.currentFavicon || '',
      collected_at: new Date().toISOString(),
      source: 'chrome'
    };

    showStatus('正在保存...', false);
    
    // 暂时模拟保存成功
    setTimeout(() => {
      showStatus('保存成功！', true);
      setTimeout(() => {
        window.close();
      }, 1000);
    }, 1000);
  }

  // 显示状态消息
  function showStatus(message, isSuccess) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${isSuccess ? 'success' : 'error'}`;
    statusDiv.style.display = 'block';
  }
});