# Chrome 插件《飞书 URL 收藏器》PRD（MVP，方案三：Vercel 后端）
> 版本：2025-09-10 · 目标：一键把当前网页 + 中文说明/备注/标签 写入飞书多维表格（Bitable），**同 URL 自动覆盖更新（upsert）**，前端零密钥。

## 1. 背景 & 目标
- 浏览器书签仅存“名称+URL”，难以检索与标注。
- 目标：在 Chrome 中一键采集网页并写入飞书多维表格，字段完整、可检索。

### 成功标准（MVP 验收）
- 点击扩展图标 ≤ 3 秒弹出表单，自动带出标题/URL/Favicon/时间。
- 点【保存到飞书】后，飞书表出现记录；**同 URL 再次保存为“更新原记录”**（不新增重复行）。
- 断网/异常进入失败队列，网络恢复后台自动重试成功。
- 右键菜单与快捷键（Alt+S）可触发保存。

## 2. 用户 & 场景
- 用户：内容收集者、学生、创作者（非技术）。
- 场景：浏览网页时补充“中文说明/备注/标签”→ 一键保存；重复看到同一网页时补充标签。

## 3. 功能范围（MVP）
### 3.1 采集面板（Popup）
- 自动填充：标题、URL、Favicon、时间。
- 可编辑：中文说明（单行）、备注（多行）、标签（逗号/回车分隔）。
- 操作：保存到飞书（主）、仅本地保存（次，可选）。
- 反馈：Toast 成功/失败；失败可复制错误。

### 3.2 设置页（Options）
- 仅一项：后端 API 地址（开发 `http://localhost:3000/api/bookmark`；上线 `https://xxx.vercel.app/api/bookmark`）。

### 3.3 右键菜单 & 快捷键
- 右键菜单：保存到飞书；快捷键：Alt+S。

### 3.4 本地存储与重试
- `chrome.storage` 存失败队列；`chrome.alarms` 定时重试；成功后移除。

### 3.5 错误处理
- 前端：网络/4xx/5xx → 入队重试；可导出 JSON。
- 后端：统一 JSON：成功 `{ok:true, record_id}`；失败 `{ok:false, error}`。

## 4. 非目标（MVP 不做）
- 网页全文抓取、AI 摘要；多人共享；附件上传。

## 5. 数据结构
### 5.1 插件提交数据（请求体）
{"title":"页面标题","url":"https://example.com","cn_desc":"中文说明","notes":"备注……","tags":["vibecoding","AI"],"favicon_url":"https://example.com/favicon.ico","collected_at":"2025-09-09T08:00:00.000Z","source":"chrome"}

### 5.2 飞书多维表格字段（建议）
- 标题（文本）
- 链接（超链接）：值为 `{ "text": url, "link": url }`
- 中文说明（文本）
- 备注（长文本）
- 标签（多选/单选/文本）
- Favicon（文本URL）
- 收藏时间（日期时间）
- 来源（单选或文本，默认 `chrome`）
> 写入时使用字段 ID（如 fld_xxx）映射，由后端维护。

## 6. 流程（方案三：Vercel 后端）
1) Popup 采集 → `POST /api/bookmark`；
2) 后端 `app_id/secret` 换 `tenant_access_token`（内存缓存）；
3) Upsert：按 URL 查记录 → 无则创建，有则更新；
4) 返回 `{ ok:true, record_id }`；前端提示。

## 7. 权限与安全
- 前端（MV3）：`activeTab`, `storage`, `contextMenus`, `alarms`；`host_permissions` 仅后端域名。
- 后端（Vercel）：环境变量 `FEISHU_APP_ID / FEISHU_APP_SECRET / BITABLE_APP_TOKEN / BITABLE_TABLE_ID / FIELD_MAP_JSON`。
- CORS：允许来自扩展或本地开发的请求；不使用 Cookie。

## 8. UI 文案草图
- 字段：网站地址（只读）、中文说明、备注、标签；按钮：保存到飞书。

## 9. 里程碑
1) MV3 架子 + 假接口；2) 真实写入；3) 失败队列；4) URL Upsert；5) 打包与 README。
