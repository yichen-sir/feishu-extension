# 飞书 URL 收藏器 - Chrome 浏览器扩展

## 🎯 项目简介

这是一个 Chrome 浏览器扩展，让您能够一键将当前浏览的网页保存到飞书多维表格中。支持添加中文说明、备注和标签，方便后续检索和管理。

### 核心功能
- ✅ **一键保存**：点击扩展图标或使用快捷键 Alt+S 快速保存网页
- ✅ **智能去重**：同一网址重复保存时自动更新原记录，不会产生重复
- ✅ **完整信息**：自动获取网页标题、URL、图标，支持添加中文说明、备注和标签
- ✅ **右键菜单**：在任意网页右键选择"保存到飞书"
- ✅ **失败重试**：网络问题时自动保存到本地队列，恢复后自动重试

## 📋 使用前准备

### 1. 飞书侧配置

#### 1.1 创建飞书应用
1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用，记录下 `App ID` 和 `App Secret`
3. 在"权限管理"中开启以下权限：
   - `bitable:app` - 查看、评论、编辑和管理多维表格
   - `bitable:app:readonly` - 查看多维表格（可选）

#### 1.2 创建飞书多维表格
1. 在飞书中创建一个新的多维表格
2. 添加以下字段（字段名称可以自定义，但类型要匹配）：

| 字段名称 | 字段类型 | 说明 |
|---------|---------|------|
| 标题 | 文本 | 网页标题 |
| 链接 | 超链接 | 网页URL |
| URL Key | 文本 | 用于去重的唯一标识（必须） |
| 中文说明 | 文本 | 简短的中文描述 |
| 备注 | 长文本 | 详细备注信息 |
| 标签 | 多选/文本 | 分类标签 |
| Favicon | 文本 | 网站图标URL |
| 收藏时间 | 日期时间 | 保存时间 |
| 来源 | 单选/文本 | 默认为 chrome |

> ⚠️ **重要**：`URL Key` 字段是必需的，用于实现同URL更新功能

#### 1.3 添加应用为协作者
1. 在多维表格右上角点击"分享"
2. 添加你创建的应用为协作者
3. 权限设置为"可编辑"或"可管理"

#### 1.4 获取表格信息
从飞书表格的URL中获取以下信息：
- **App Token**: URL中 `base/` 后面的部分（如 `Bxxxxxxx`）
- **Table ID**: URL参数 `table=` 后面的部分（如 `tblxxxxxxx`）
- **View ID**（可选）: URL参数 `view=` 后面的部分

示例URL：
```
https://feishu.cn/base/Bxxxxxxx?table=tblxxxxxxx&view=vewxxxxxxx
```

### 2. 后端部署（Vercel）

#### 2.1 部署到 Vercel
1. Fork 或克隆本项目到你的 GitHub
2. 访问 [Vercel](https://vercel.com/) 并导入项目
3. 配置环境变量（见下方）
4. 部署完成后记录下项目URL（如 `https://your-project.vercel.app`）

#### 2.2 配置环境变量
在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| FEISHU_APP_ID | 飞书应用 ID | cli_xxxxxx |
| FEISHU_APP_SECRET | 飞书应用密钥 | xxxxxxxxxxxxxx |
| BITABLE_APP_TOKEN | 多维表格 Token | Bxxxxxxx |
| BITABLE_TABLE_ID | 表格 ID | tblxxxxxxx |
| BITABLE_VIEW_ID | 视图 ID（可选） | vewxxxxxxx |
| FIELD_MAP_IDS | 字段映射配置 | 见下方说明 |

#### 2.3 生成字段映射配置
1. 克隆项目到本地
2. 安装依赖：`npm install`
3. 创建 `.env.local` 文件，填入上述环境变量
4. 运行字段映射脚本：
   ```bash
   npx tsx scripts/fetch-field-map.ts
   ```
5. 复制输出的 JSON 字符串，设置为 `FIELD_MAP_IDS` 环境变量

### 3. 本地开发调试（可选）

如果需要在本地调试后端：

1. 安装 Vercel CLI：
   ```bash
   npm i -g vercel
   ```

2. 登录并链接项目：
   ```bash
   vercel login
   vercel link
   ```

3. 拉取环境变量：
   ```bash
   vercel env pull .env.local
   ```

4. 启动本地服务器：
   ```bash
   vercel dev
   ```

5. 测试接口：
   ```bash
   curl http://localhost:3000/api/health
   # 应返回 {"ok":true}
   ```

## 🚀 扩展安装与使用

### 1. 安装扩展

#### 方式一：加载未打包的扩展（开发模式）
1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目中的 `extension` 文件夹

#### 方式二：安装打包版本
1. 运行打包脚本生成 zip 文件：
   ```bash
   node scripts/zip-extension.js
   ```
2. 解压 `dist/feishu-extension.zip` 到任意文件夹
3. 在 Chrome 扩展页面加载解压后的文件夹

### 2. 配置扩展

1. 右键点击扩展图标，选择"选项"（或在扩展管理页面点击"详情"→"扩展程序选项"）
2. 在设置页面填入后端 API 地址：
   - 本地开发：`http://localhost:3000/api/bookmark`
   - 线上环境：`https://your-project.vercel.app/api/bookmark`
3. 点击"保存设置"

### 3. 使用扩展

#### 方式一：点击扩展图标
1. 在任意网页点击扩展图标
2. 自动填充当前页面信息
3. 可选：添加中文说明、备注、标签
4. 点击"保存到飞书"

#### 方式二：使用快捷键
- 按 `Alt+S` 快速保存当前页面

#### 方式三：右键菜单
- 在网页空白处右键，选择"保存到飞书"

## ✅ 功能验证清单

完成配置后，请按以下步骤验证功能：

1. **测试保存功能**
   - 打开任意网页
   - 点击扩展图标或按 Alt+S
   - 填写中文说明和标签
   - 点击"保存到飞书"
   - 检查飞书表格是否出现新记录

2. **测试去重功能**
   - 再次保存同一个网页
   - 修改中文说明或备注
   - 点击保存
   - 确认飞书表格中是更新了原记录，而不是新增

3. **测试失败重试**
   - 临时关闭网络或填写错误的API地址
   - 尝试保存网页
   - 应看到"保存失败"提示
   - 恢复网络/修正设置后，扩展会自动重试

4. **测试接口健康**
   ```bash
   # 替换为你的实际地址
   curl https://your-project.vercel.app/api/health
   # 应返回 {"ok":true}
   ```

## ❓ 常见问题

### 1. 保存失败：CORS 错误
**问题**：控制台显示跨域错误
**解决**：确认后端已正确部署，API 地址填写正确

### 2. 保存失败：91403 错误
**问题**：飞书返回权限错误
**解决**：
- 确认应用已添加为表格协作者
- 检查应用权限是否包含 `bitable:app`
- 确认环境变量配置正确

### 3. 字段写入失败
**问题**：某些字段没有成功写入
**解决**：
- 检查字段类型是否匹配（如链接字段必须是"超链接"类型）
- 重新运行 `fetch-field-map.ts` 更新字段映射
- 在 Vercel 更新 `FIELD_MAP_IDS` 环境变量

### 4. URL Key 字段找不到
**问题**：提示找不到 url_key 字段
**解决**：
- 在飞书表格中添加名为"URL Key"的文本字段
- 重新生成字段映射配置

### 5. 环境变量未生效
**问题**：修改环境变量后仍然报错
**解决**：
- Vercel：在项目设置中修改后需要重新部署
- 本地：运行 `vercel env pull .env.local` 并重启 `vercel dev`

### 6. node_modules 提交问题
**问题**：Git 提示 node_modules 文件过多
**解决**：
```bash
rm -rf node_modules
git add -A
git commit -m "Remove node_modules"
npm install
```

## 📦 版本管理与打包

### 更新版本
1. 修改 `extension/manifest.json` 中的 `version` 字段
2. 更新本 README 中的版本信息

### 打包扩展
```bash
# 使用打包脚本
node scripts/zip-extension.js

# 输出位置：dist/feishu-extension.zip
```

### 发布流程
1. 测试所有功能
2. 更新版本号
3. 生成打包文件
4. 提交代码到 GitHub
5. 在 Vercel 触发新部署

## 🔧 维护建议

### 1. 字段变更处理
当飞书表格字段名称变更后：
1. 运行 `npx tsx scripts/fetch-field-map.ts` 重新生成映射
2. 更新 Vercel 的 `FIELD_MAP_IDS` 环境变量
3. 重新部署

### 2. 定期检查
- 每月检查一次扩展更新
- 定期查看失败队列是否有积压
- 监控 Vercel 函数调用量

### 3. 性能优化
- 如果表格数据量大，考虑添加视图筛选
- 定期清理测试数据
- 优化字段映射缓存策略

## 📝 技术支持

如遇到问题，请检查：
1. Chrome 开发者工具的 Console 和 Network 面板
2. Vercel 项目的 Functions 日志
3. 飞书应用的调用日志

## 🎉 完成！

恭喜！如果你已经完成以上所有步骤并通过验证，你的飞书 URL 收藏器就可以正常使用了。开始享受高效的网页收藏体验吧！

---

*版本：1.0.0 | 更新时间：2025-09-15*