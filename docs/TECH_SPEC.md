# 技术实现文档（Vercel 后端 + Chrome MV3）
> 版本：2025-09-10 · 目标：前端零密钥、后端 upsert、字段映射后端维护。

## 架构
- 前端（extension/）：manifest、popup、options、background、common。
- 后端（api/）：`api/bookmark.ts`（写入+upsert+token缓存+CORs）、`api/health.ts`。

## 接口契约
- 请求体：见 PRD §5.1。
- 响应：成功 `{"ok":true,"record_id":"rec_xxx"}`；失败 `{"ok":false,"error":"..."}`。

## 环境变量
- `FEISHU_APP_ID`、`FEISHU_APP_SECRET`
- `BITABLE_APP_TOKEN`（Bxxxx）、`BITABLE_TABLE_ID`（tblxxxx）
- `FIELD_MAP_JSON`：`{"title":"fld_xxx","url":"fld_xxx","cn_desc":"fld_xxx","notes":"fld_xxx","tags":"fld_xxx","favicon_url":"fld_xxx","collected_at":"fld_xxx","source":"fld_xxx"}`

## Upsert（伪代码）
- 先查 URL：MVP 可拉最近 N 条记录本地筛选；V2 用过滤接口精确匹配。
- 无则 `POST /records` 创建；有则 `PATCH /records/{record_id}` 更新。

## 字段格式
- 链接：`{"text":url,"link":url}`
- 标签：MVP 写字符串数组；选项不存在先当文本（V2 再做“确保选项存在”）。
- 时间：ISO 字符串。

## CORS
- `Access-Control-Allow-Origin:*`
- `Access-Control-Allow-Headers:content-type`
- `Access-Control-Allow-Methods:POST,OPTIONS`
- `OPTIONS` 预检 200 返回上述头。

## 失败队列（前端）
- `chrome.storage.local.pendingQueue = []`
- 保存失败 → 入队；`chrome.alarms` 每 1 分钟重试；成功移除。

## 目录建议
/extension … MV3 源码
/api/bookmark.ts、/api/health.ts
/scripts/fetch-field-map.ts（生成 FIELD_MAP_JSON）

## 验收
- 新增、覆盖（同 URL 更新）、断网补偿、CORS 本地/线上、保存≤3秒。
