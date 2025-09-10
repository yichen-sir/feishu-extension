# 任务清单（逐项完成 · 每步可验证）
> 版本：2025-09-10

## 0. 准备
- 飞书建表（名称：feishu-extension；字段：标题、链接、中文说明、备注、标签、Favicon、收藏时间、来源）。

## 1. 初始化仓库
- 交付：extension/ 与 api/ + `api/health.ts` 返回 `{"ok":true}`
- 验收：
  ```
  vercel login && vercel link && vercel dev
  curl http://localhost:3000/api/health
  ```

## 2. MV3 清单与空白 UI
- 交付：manifest、popup、options、background
- 验收：chrome://extensions 加载 extension/，能打开 Popup 和 Options

## 3. Popup 自动取当前页
- 交付：自动填标题/URL/favicon/时间；中文说明/备注/标签输入框
- 验收：任意网页 → 点击扩展 → 字段自动填好

## 4. 右键 & 快捷键
- 交付：右键“保存到飞书”、Alt+S
- 验收：Service Worker 控制台能看到触发日志

## 5. 失败队列
- 交付：失败入队、alarms 定时重试
- 验收：填错 URL 触发失败；改回正确 URL 后自动重试成功

## 6. /api/bookmark（假实现）
- 交付：返回 `{ ok:true, record_id:"mock" }`
- 验收：Popup 保存成功

## 7. 飞书鉴权 + 写入（真实）
- 交付：使用 app_id/secret 获取 token；创建记录写入
- 验收：飞书表出现新纪录

## 8. 字段 ID 脚本
- 交付：/scripts/fetch-field-map.ts 打印 `{logicalName:"fld_xxx"}`
- 验收：复制到 Vercel 的 `FIELD_MAP_JSON`

## 9. CORS
- 交付：允许 *；处理 OPTIONS
- 验收：前端直连本地/线上后端均成功

## 10. URL Upsert
- 交付：同 URL 更新而非新增
- 验收：同一网址保存两次 → 第二次更新同一行

## 11. README & 打包
- 交付：最终 README（面向非技术）+ 可加载扩展目录
- 验收：按 README 全流程走通
