# 部署与联调（Vercel 路线）
> 版本：2025-09-10

## 本地开发
```
npm i -g vercel
vercel login
vercel link
vercel dev   # http://localhost:3000
```
健康检查：`curl http://localhost:3000/api/health` → `{"ok":true}`

## 环境变量（Vercel 或 .env.local）
- FEISHU_APP_ID / FEISHU_APP_SECRET
- BITABLE_APP_TOKEN（URL base/Bxxxx）
- BITABLE_TABLE_ID（URL ?table=tblxxxx）
- FIELD_MAP_JSON（脚本生成的 JSON）

## 部署
```
vercel deploy --prod
```
接口地址：`https://xxx.vercel.app/api/bookmark`

## CORS（无需 Cookie）
- 允许：`*`
- 处理 OPTIONS 预检：200 返回 CORS 头

## 插件 Options
- 开发：`http://localhost:3000/api/bookmark`
- 上线：`https://xxx.vercel.app/api/bookmark`

## 常见问题
- 91403：应用未加入表协作者或权限没开
- 字段类型报错：检查 FIELD_MAP_JSON 与字段类型是否匹配
- CORS：优先允许 *，确认已处理 OPTIONS
