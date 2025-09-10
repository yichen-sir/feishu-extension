// popup.js - 弹出窗口逻辑
console.log('Popup loaded');

document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.getElementById('url');
  const titleInput = document.getElementById('title');
  const descriptionInput = document.getElementById('description');
  const notesInput = document.getElementById('notes');
  const tagsInput = document.getElementById('tags');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // 获取当前标签页信息
  getCurrentTab().then(tab => {
    if (tab) {
      urlInput.value = tab.url;
      titleInput.value = tab.title;
      
      // 获取favicon
      getFavicon(tab).then(favicon => {
        // 暂时存储favicon，后续使用
        window.currentFavicon = favicon;
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
      if (tab.favIconUrl && !tab.favIconUrl.startsWith('chrome://')) {
        resolve(tab.favIconUrl);
      } else {
        // 尝试构造favicon URL
        try {
          const url = new URL(tab.url);
          resolve(`${url.origin}/favicon.ico`);
        } catch {
          resolve('');
        }
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