// api/bookmark.ts - 飞书书签保存接口（真实实现）

// 内存中的token缓存
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// 字段映射缓存（ID→当前字段名）
let fieldIdToNameCache: Record<string, string> = {};
let fieldCacheExpiry: number = 0;

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

// 获取字段ID到字段名的映射
async function getFieldIdToNameMapping(): Promise<Record<string, string>> {
  // 检查缓存是否有效（缓存30分钟）
  if (Object.keys(fieldIdToNameCache).length > 0 && Date.now() < fieldCacheExpiry) {
    console.log('Using cached field mapping');
    return fieldIdToNameCache;
  }

  const token = await getFeishuToken();
  const appToken = process.env.BITABLE_APP_TOKEN;
  const tableId = process.env.BITABLE_TABLE_ID;

  if (!appToken || !tableId) {
    throw new Error('Missing Bitable configuration');
  }

  try {
    console.log('Fetching fresh field mapping from Feishu API...');
    const response = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    );

    const result = await response.json() as any;
    
    if (result.code !== 0) {
      throw new Error(`Failed to fetch fields: ${result.msg}`);
    }

    // 生成ID→字段名映射
    const idToName: Record<string, string> = {};
    result.data.items.forEach((field: any) => {
      idToName[field.field_id] = field.field_name;
    });

    // 缓存30分钟
    fieldIdToNameCache = idToName;
    fieldCacheExpiry = Date.now() + 30 * 60 * 1000;
    
    console.log('✅ Field mapping updated:', Object.keys(idToName).length, 'fields');
    return idToName;
  } catch (error) {
    console.error('Failed to fetch field mapping:', error);
    throw error;
  }
}

// 创建飞书多维表格记录
async function createBitableRecord(data: any): Promise<string> {
  const token = await getFeishuToken();
  const appToken = process.env.BITABLE_APP_TOKEN;
  const tableId = process.env.BITABLE_TABLE_ID;
  const fieldMapJson = process.env.FIELD_MAP_JSON;

  if (!appToken || !tableId) {
    throw new Error('Missing Bitable configuration');
  }

  // 定义逻辑键到字段ID的映射（从环境变量获取）
  // 默认映射：逻辑键 → 字段ID
  const defaultLogicalToFieldId: Record<string, string> = {
    'title': 'fldPrimaryField',  // 标题字段（主字段通常不需要ID）
    'url': 'fldxxd7BDj',         // 链接字段
    'description': 'fldASck4iU',  // 中文说明字段
    'notes': 'fldFUieM8s',       // 备注字段
    'tags': 'fldrgkbYGE',        // 标签字段
    'collected_at': 'fldFslLJQU', // 收藏时间字段
    'favicon': 'fldDHjlpTi',     // favicon字段
    'source': 'fldMew5G9i'       // 来源字段
  };

  // 解析环境变量中的字段映射
  let logicalToFieldId = defaultLogicalToFieldId;
  if (fieldMapJson) {
    try {
      logicalToFieldId = JSON.parse(fieldMapJson);
      console.log('✅ Using field mapping from environment');
    } catch (e) {
      console.warn('Failed to parse FIELD_MAP_JSON, using default mapping');
    }
  }

  // 获取字段ID到当前字段名的映射
  const idToName = await getFieldIdToNameMapping();
  
  // 构造逻辑键到当前字段名的映射
  const logicalToName: Record<string, string> = {};
  Object.entries(logicalToFieldId).forEach(([logicalKey, fieldId]) => {
    const fieldName = idToName[fieldId];
    if (fieldName) {
      logicalToName[logicalKey] = fieldName;
      console.log(`Mapped: ${logicalKey} → ${fieldId} → "${fieldName}"`);
    } else {
      // 如果找不到对应字段名，使用后备方案
      console.warn(`Field ID ${fieldId} not found, using fallback for ${logicalKey}`);
      // 后备映射
      const fallbackMap: Record<string, string> = {
        'title': '标题',
        'url': '链接',
        'description': '中文说明',
        'notes': '备注',
        'tags': '标签',
        'collected_at': '收藏时间',
        'favicon': 'favicon',
        'source': '来源'
      };
      logicalToName[logicalKey] = fallbackMap[logicalKey] || logicalKey;
    }
  });

  console.log('📊 Final logical to field name mapping:', logicalToName);

  // 使用映射后的字段名构造记录数据
  const fields: Record<string, any> = {};
  
  // 标题字段（主字段通常直接用中文）
  fields['标题'] = data.title || '未命名页面';
  
  // 其他字段使用映射后的字段名
  if (logicalToName.url) {
    fields[logicalToName.url] = {
      text: data.title || data.url,
      link: data.url
    };
  }
  
  if (logicalToName.description) {
    fields[logicalToName.description] = data.cn_desc || '';
  }
  
  if (logicalToName.notes) {
    fields[logicalToName.notes] = data.notes || '';
  }
  
  if (logicalToName.tags) {
    fields[logicalToName.tags] = data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [];
  }
  
  if (logicalToName.collected_at) {
    fields[logicalToName.collected_at] = data.collected_at ? new Date(data.collected_at).getTime() : Date.now();
  }
  
  if (logicalToName.favicon) {
    fields[logicalToName.favicon] = data.favicon_url || '';
  }
  
  if (logicalToName.source) {
    fields[logicalToName.source] = data.source || 'chrome-extension';
  }
  
  console.log('📝 Final fields for API:', Object.keys(fields));

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