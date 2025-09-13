// scripts/fetch-field-map.ts - 自动获取飞书多维表格字段ID映射脚本

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('请先创建 .env.local 文件并配置飞书应用凭证');
  process.exit(1);
}

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
    throw new Error('缺少飞书应用凭证：FEISHU_APP_ID 或 FEISHU_APP_SECRET');
  }

  try {
    console.log('正在获取飞书访问令牌...');
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
      throw new Error(`飞书认证错误: ${data.msg}`);
    }

    // 缓存token（有效期2小时）
    cachedToken = data.tenant_access_token;
    tokenExpiry = Date.now() + data.expire * 1000;
    
    console.log('✅ 成功获取飞书访问令牌');
    return cachedToken as string;
  } catch (error) {
    console.error('❌ 获取飞书访问令牌失败:', error);
    throw error;
  }
}

// 获取多维表格字段信息
async function fetchTableFields(): Promise<any> {
  const token = await getFeishuToken();
  const appToken = process.env.BITABLE_APP_TOKEN;
  const tableId = process.env.BITABLE_TABLE_ID;

  if (!appToken || !tableId) {
    throw new Error('缺少多维表格配置：BITABLE_APP_TOKEN 或 BITABLE_TABLE_ID');
  }

  try {
    console.log(`正在获取多维表格字段信息...`);
    console.log(`应用Token: ${appToken}`);
    console.log(`表格ID: ${tableId}`);
    
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
      throw new Error(`获取字段信息失败: ${result.msg}`);
    }

    console.log(`✅ 成功获取 ${result.data.items.length} 个字段`);
    return result.data.items;
  } catch (error) {
    console.error('❌ 获取多维表格字段失败:', error);
    throw error;
  }
}

// 生成字段映射
function generateFieldMapping(fields: any[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  console.log('\n字段映射表:');
  console.log('='.repeat(50));
  
  fields.forEach((field: any) => {
    // 跳过系统字段
    if (field.is_primary || field.field_name.startsWith('_')) {
      console.log(`[跳过系统字段] ${field.field_name}`);
      return;
    }
    
    mapping[field.field_name] = field.field_id;
    console.log(`${field.field_name.padEnd(20)} => ${field.field_id} (${field.type})`);
  });
  
  return mapping;
}

// 生成环境变量格式
function generateEnvVariable(mapping: Record<string, string>): string {
  return `FIELD_MAP_JSON='${JSON.stringify(mapping)}'`;
}

// 更新 .env.local 文件
function updateEnvFile(envVariable: string): void {
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  // 移除旧的 FIELD_MAP_JSON 配置（如果存在）
  envContent = envContent.replace(/^FIELD_MAP_JSON=.*$/gm, '');
  
  // 添加新的配置
  envContent = envContent.trim() + '\n\n# 字段ID映射（由 fetch-field-map.ts 自动生成）\n' + envVariable + '\n';
  
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ 已更新 .env.local 文件');
}

// 生成TypeScript类型定义
function generateTypeDefinition(mapping: Record<string, string>): void {
  const typeDef = `// 自动生成的字段映射类型定义
export interface FieldMapping {
${Object.entries(mapping).map(([name, id]) => `  '${name}': '${id}';`).join('\n')}
}

export const FIELD_MAPPING: FieldMapping = ${JSON.stringify(mapping, null, 2)};
`;

  const typePath = path.join(__dirname, '../types/field-mapping.ts');
  
  // 确保types目录存在
  const typesDir = path.dirname(typePath);
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
  
  fs.writeFileSync(typePath, typeDef);
  console.log(`✅ 已生成类型定义文件: types/field-mapping.ts`);
}

// 主函数
async function main() {
  console.log('🚀 开始获取飞书多维表格字段映射...\n');
  
  try {
    // 1. 获取字段信息
    const fields = await fetchTableFields();
    
    // 2. 生成字段映射
    const mapping = generateFieldMapping(fields);
    
    // 3. 生成环境变量
    const envVariable = generateEnvVariable(mapping);
    console.log('\n生成的环境变量:');
    console.log('='.repeat(50));
    console.log(envVariable);
    
    // 4. 更新 .env.local 文件
    updateEnvFile(envVariable);
    
    // 5. 生成TypeScript类型定义
    generateTypeDefinition(mapping);
    
    console.log('\n🎉 字段映射生成完成！');
    console.log('\n下一步操作:');
    console.log('1. 重启 Vercel 开发服务器以加载新的环境变量');
    console.log('2. 在 api/bookmark.ts 中使用 process.env.FIELD_MAP_JSON 获取字段映射');
    console.log('3. 将中文字段名替换为对应的字段ID (fld_xxx)');
    
  } catch (error) {
    console.error('\n❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main();