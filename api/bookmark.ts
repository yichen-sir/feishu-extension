// api/bookmark.ts - 飞书书签保存接口（真实实现）

// 内存中的token缓存
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// 获取飞书tenant_access_token
async function getFeishuToken(): Promise<string> {
  // 检查缓存是否有效（提前5分钟刷新）
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Missing Feishu app credentials');
  }

  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret
      })
    });

    const data = await response.json() as any;
    
    if (data.code !== 0) {
      throw new Error(`Feishu auth error: ${data.msg}`);
    }

    // 缓存token（有效期2小时）
    cachedToken = data.tenant_access_token;
    tokenExpiry = Date.now() + data.expire * 1000;
    
    console.log('Feishu token obtained successfully');
    return cachedToken as string;
  } catch (error) {
    console.error('Failed to get Feishu token:', error);
    throw error;
  }
}

// 创建飞书多维表格记录
async function createBitableRecord(data: any): Promise<string> {
  const token = await getFeishuToken();
  const appToken = process.env.BITABLE_APP_TOKEN;
  const tableId = process.env.BITABLE_TABLE_ID;

  if (!appToken || !tableId) {
    throw new Error('Missing Bitable configuration');
  }

  // 构造记录数据 - 修复所有字段格式
  const fields = {
    '标题': data.title || '未命名页面',
    '链接': {
      text: data.title || data.url,
      link: data.url
    },
    '中文说明': data.cn_desc || '',
    '备注': data.notes || '',
    '标签': data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
    '收藏时间': data.collected_at ? new Date(data.collected_at).getTime() : Date.now(),
    'favicon': data.favicon_url || '',
    '来源': data.source || 'chrome-extension'
  };

  try {
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: fields
      })
    });

    const result = await response.json() as any;
    
    if (result.code !== 0) {
      throw new Error(`Bitable API error: ${result.msg}`);
    }

    console.log('Bitable record created:', result.data.record.record_id);
    return result.data.record.record_id;
  } catch (error) {
    console.error('Failed to create Bitable record:', error);
    throw error;
  }
}

module.exports = async (req: any, res: any) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只处理 POST 请求
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    // 验证请求体
    const { title, url, cn_desc, notes, tags, favicon_url, collected_at, source } = req.body;
    
    if (!url) {
      res.status(400).json({ ok: false, error: 'URL is required' });
      return;
    }

    // 记录请求日志
    console.log('Creating Feishu bookmark:', {
      title: title || '未命名页面',
      url,
      source: source || 'chrome-extension'
    });

    // 调用飞书API创建记录
    const recordId = await createBitableRecord({
      title,
      url,
      cn_desc,
      notes,
      tags,
      favicon_url,
      collected_at,
      source
    });

    // 返回成功响应
    res.status(200).json({
      ok: true,
      record_id: recordId
    });

  } catch (error: any) {
    console.error('Bookmark API error:', error);
    
    // 根据错误类型返回不同状态码
    if (error.message.includes('Missing')) {
      res.status(500).json({ 
        ok: false, 
        error: 'Server configuration error'
      });
    } else if (error.message.includes('Feishu') || error.message.includes('Bitable')) {
      res.status(502).json({ 
        ok: false, 
        error: 'Feishu API error: ' + error.message
      });
    } else {
      res.status(500).json({ 
        ok: false, 
        error: 'Internal server error'
      });
    }
  }
};