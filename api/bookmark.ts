// api/bookmark.ts - 飞书书签保存接口（最小可用假实现）

module.exports = (req: any, res: any) => {
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
    // 简单验证请求体
    const { title, url, cn_desc, notes, tags, favicon_url, collected_at, source } = req.body;
    
    if (!url) {
      res.status(400).json({ ok: false, error: 'URL is required' });
      return;
    }

    // 记录请求日志（用于开发调试）
    console.log('Bookmark request received:', {
      title,
      url,
      cn_desc,
      notes,
      tags,
      favicon_url,
      collected_at,
      source
    });

    // 返回成功响应（假实现）
    res.status(200).json({
      ok: true,
      record_id: 'mock_' + Date.now()
    });

  } catch (error: any) {
    console.error('Bookmark API error:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Internal server error'
    });
  }
};