// background.js - Service Worker 后台脚本
console.log('Background service worker loaded');

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Extension installed:', details.reason);
  
  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'save-to-feishu',
    title: '保存到飞书',
    contexts: ['page', 'selection', 'link']
  });
  
  // 设置默认API地址
  chrome.storage.sync.get(['apiUrl'], function(result) {
    if (!result.apiUrl) {
      chrome.storage.sync.set({
        apiUrl: 'http://localhost:3000/api/bookmark'
      });
    }
  });
});

// 右键菜单点击事件
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === 'save-to-feishu') {
    console.log('Context menu clicked, saving to Feishu');
    saveCurrentPage(tab);
  }
});

// 快捷键命令处理
chrome.commands.onCommand.addListener(function(command) {
  if (command === 'save_to_feishu') {
    console.log('Keyboard shortcut triggered');
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        saveCurrentPage(tabs[0]);
      }
    });
  }
});

// 定时器处理（用于重试失败的请求）
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'retry-failed-requests') {
    console.log('Processing retry alarm');
    retryFailedRequests();
  }
});

// 保存当前页面到飞书
async function saveCurrentPage(tab) {
  try {
    // 获取页面数据
    const pageData = {
      title: tab.title,
      url: tab.url,
      favicon_url: tab.favIconUrl || getFaviconUrl(tab.url),
      collected_at: new Date().toISOString(),
      source: 'chrome-context'
    };

    // 发送到后端
    await sendToBackend(pageData);
    
    // 显示成功通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: '保存成功',
      message: `已保存：${tab.title}`
    });
    
  } catch (error) {
    console.error('Save failed:', error);
    
    // 显示错误通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: '保存失败',
      message: '请检查网络连接或设置'
    });
  }
}

// 发送数据到后端
async function sendToBackend(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['apiUrl'], async function(result) {
      const apiUrl = result.apiUrl || 'http://localhost:3000/api/bookmark';
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.ok) {
            resolve(result);
          } else {
            throw new Error(result.error || 'Backend returned error');
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Backend request failed:', error);
        
        // 将失败的请求加入重试队列
        await addToRetryQueue(data, error.message);
        reject(error);
      }
    });
  });
}

// 添加到重试队列
async function addToRetryQueue(data, error) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['failedRequests'], function(result) {
      const failedRequests = result.failedRequests || [];
      
      failedRequests.push({
        data: data,
        error: error,
        timestamp: Date.now(),
        retryCount: 0
      });
      
      chrome.storage.local.set({ failedRequests: failedRequests }, function() {
        // 设置重试定时器
        chrome.alarms.create('retry-failed-requests', {
          delayInMinutes: 5,
          periodInMinutes: 10
        });
        resolve();
      });
    });
  });
}

// 重试失败的请求
async function retryFailedRequests() {
  chrome.storage.local.get(['failedRequests'], async function(result) {
    const failedRequests = result.failedRequests || [];
    const remainingRequests = [];
    
    for (const request of failedRequests) {
      // 最多重试5次
      if (request.retryCount >= 5) {
        continue;
      }
      
      try {
        await sendToBackend(request.data);
        console.log('Retry successful for:', request.data.title);
      } catch (error) {
        request.retryCount++;
        request.error = error.message;
        remainingRequests.push(request);
      }
    }
    
    // 更新失败队列
    chrome.storage.local.set({ failedRequests: remainingRequests });
    
    // 如果没有待重试的请求，清除定时器
    if (remainingRequests.length === 0) {
      chrome.alarms.clear('retry-failed-requests');
    }
  });
}

// 获取favicon URL
function getFaviconUrl(pageUrl) {
  try {
    const url = new URL(pageUrl);
    return `${url.origin}/favicon.ico`;
  } catch {
    return '';
  }
}