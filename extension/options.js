// options.js - 设置页面逻辑
console.log('Options page loaded');

document.addEventListener('DOMContentLoaded', function() {
  const apiUrlInput = document.getElementById('apiUrl');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');

  // 默认API地址
  const DEFAULT_API_URL = 'http://localhost:3000/api/bookmark';

  // 页面加载时恢复保存的设置
  loadSettings();

  // 绑定事件
  saveBtn.addEventListener('click', saveSettings);
  testBtn.addEventListener('click', testConnection);

  // 加载设置
  function loadSettings() {
    chrome.storage.sync.get(['apiUrl'], function(result) {
      apiUrlInput.value = result.apiUrl || DEFAULT_API_URL;
    });
  }

  // 保存设置
  function saveSettings() {
    const apiUrl = apiUrlInput.value.trim();
    
    if (!apiUrl) {
      showStatus('请输入API地址', false);
      return;
    }

    if (!isValidUrl(apiUrl)) {
      showStatus('请输入有效的URL地址', false);
      return;
    }

    chrome.storage.sync.set({
      apiUrl: apiUrl
    }, function() {
      showStatus('设置已保存', true);
    });
  }

  // 测试连接
  async function testConnection() {
    const apiUrl = apiUrlInput.value.trim();
    
    if (!apiUrl) {
      showStatus('请先输入API地址', false);
      return;
    }

    if (!isValidUrl(apiUrl)) {
      showStatus('请输入有效的URL地址', false);
      return;
    }

    showStatus('正在测试连接...', false);

    try {
      // 测试健康检查接口
      const healthUrl = apiUrl.replace('/api/bookmark', '/api/health');
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          showStatus('连接测试成功 ✓', true);
        } else {
          showStatus('服务器响应异常', false);
        }
      } else {
        showStatus(`连接失败: ${response.status} ${response.statusText}`, false);
      }
    } catch (error) {
      showStatus(`连接失败: ${error.message}`, false);
    }
  }

  // 验证URL格式
  function isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // 显示状态消息
  function showStatus(message, isSuccess) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${isSuccess ? 'success' : 'error'}`;
    statusDiv.style.display = 'block';

    // 3秒后自动隐藏成功消息
    if (isSuccess) {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }
});