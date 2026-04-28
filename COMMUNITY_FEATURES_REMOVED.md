# 社区版付费功能移除与二次开发记录

本文档记录本次社区版改造中已移除或隐藏的企业版功能入口，并为后续自研替代功能提供边界说明。

## 改造原则

- 不绕过 Docmost Enterprise Edition 授权校验。
- 不复制、搬运或改写 `apps/client/src/ee` 内的企业版实现。
- 前端社区版代码不再依赖 `@/ee`、`useHasFeature`、`entitlementAtom`、`useEntitlements`。
- 后端保留原有企业模块 fallback 与 license 逻辑，社区自研功能放在独立模块中扩展。
- 后续二次开发建议使用 `community` 命名空间，避免与官方 EE 模块混淆。

## 已移除或隐藏的功能

### 1. AI / AI Chat

当前处理：

- 移除主应用路由 `/ai`、`/ai/chat/:chatId`。
- 移除设置页 AI 入口 `/settings/ai`、`/settings/ai/mcp`。
- 移除首页 AI prompt 相关入口。
- 移除客户端对 `@/ee/ai`、`@/ee/ai-chat` 的引用。

后续自研建议：

- 前端可在 `apps/client/src/features/community/ai` 新建社区 AI 功能。
- 后端可在 `apps/server/src/community` 下拆分 `ai` 子模块。
- 新功能应重新设计 provider 配置、模型配置、权限控制和调用限流，不复用 EE 代码。

### 2. Templates

当前处理：

- 移除模板列表路由 `/templates`。
- 移除模板编辑路由 `/templates/:templateId`。
- 移除页面导入弹窗中的模板相关企业入口。
- 移除客户端对 `@/ee/template` 的引用。

后续自研建议：

- 可作为社区模板库单独实现：页面复制、空间内模板、工作区模板三层能力。
- 建议先实现最小可用版本：从已有页面保存为模板、从模板创建页面。
- 数据模型和 API 独立设计，避免依赖 EE 模板结构。

### 3. API Keys

当前处理：

- 移除个人设置中的 API Keys 入口 `/settings/account/api-keys`。
- 移除工作区 API 管理入口 `/settings/api-keys`。
- 移除相关预加载查询。
- 移除客户端对 `@/ee/api-key` 的引用。

后续自研建议：

- 可独立实现个人访问令牌和工作区服务令牌。
- 建议包含最小字段：名称、哈希后的 token、作用域、过期时间、最后使用时间、创建者。
- 不要在数据库中保存明文 token。

### 4. Audit Logs

当前处理：

- 移除设置页审计日志入口 `/settings/audit`。
- 移除审计日志预加载查询。
- 移除客户端对 `@/ee/audit` 的引用。
- 后端仍保留现有 no-op audit fallback。

后续自研建议：

- 可在社区模块中实现轻量审计表，记录用户、动作、资源类型、资源 ID、IP、User-Agent、时间。
- 先覆盖高价值事件：登录、成员变更、空间权限变更、页面删除、公开分享变更。
- 注意审计日志写入失败不应阻断主业务流程。

### 5. Billing / License

当前处理：

- 移除云端 Billing 设置入口 `/settings/billing`。
- 移除自托管 License & Edition 设置入口 `/settings/license`。
- 移除客户端对 `@/ee/billing`、`@/ee/licence` 的引用。
- 后端 license 与企业模块加载逻辑保持不变。

后续自研建议：

- 社区版不建议实现任何伪装企业授权的逻辑。
- 如果需要显示版本信息，可单独实现“社区版关于页面”，仅展示构建版本、部署方式、开源说明。

### 6. Security & SSO

当前处理：

- 移除工作区 Security & SSO 设置入口 `/settings/security`。
- 移除 SSO provider 预加载查询。
- 移除客户端对 `@/ee/security` 的引用。

后续自研建议：

- 可分阶段自研基础安全设置，例如密码策略、会话管理、登录限制。
- SSO 建议作为独立大功能规划，明确 OIDC/SAML 支持范围后再实现。
- 登录链路改动风险高，需要补充端到端测试。

### 7. MFA

当前处理：

- 移除登录 MFA challenge 路由 `/login/mfa`。
- 移除强制 MFA setup 路由 `/login/mfa/setup`。
- 移除账号设置中的 MFA 企业入口。
- 移除认证流程里对企业 MFA 状态的依赖。

后续自研建议：

- 如果自研，建议先支持 TOTP，再考虑恢复码和 WebAuthn。
- 需要覆盖注册、登录、重置密码、邀请注册、管理员重置 MFA 等流程。
- 必须避免用户启用 MFA 后无法恢复账号。

### 8. Page Verification

当前处理：

- 移除 Verified pages 设置入口 `/settings/verifications`。
- 移除相关预加载查询。
- 移除客户端对 `@/ee/page-verification` 的引用。

后续自研建议：

- 可改造成社区版“页面认证/审核”功能。
- 建议先实现页面级状态字段和审核人记录，再扩展到空间级策略。

### 9. Page Permissions

当前处理：

- 移除页面头部菜单中企业版页面权限入口。
- 移除空间安全设置中依赖企业功能的权限入口。
- 移除相关 feature entitlement 判断。

后续自研建议：

- 自研页面权限前需要先明确继承规则：工作区、空间、页面、分享链接之间的优先级。
- 建议先实现只读/可编辑两级权限，避免一次性引入复杂 ACL。

### 10. PDF Export / Render

当前处理：

- 移除 PDF 渲染路由 `/pdf-render/:pageId`。
- 移除客户端对 `@/ee/pdf-export` 的引用。

后续自研建议：

- 可用独立服务实现 PDF 导出，例如 Playwright 渲染公开或临时签名页面。
- 导出任务建议走异步队列，避免阻塞 Web 请求。

### 11. Cloud-only 页面

当前处理：

- 移除云端工作区创建页 `/create`。
- 移除云端工作区选择页 `/select`。
- 移除邮箱验证页 `/verify-email`。
- 移除云端选择重定向 hook。

后续自研建议：

- 自托管社区版默认保留 `/setup/register` 初始化流程即可。
- 如果后续做多租户，需要单独设计租户模型、域名解析、注册邀请和计费边界。

## 已保留的社区版能力

- 工作区初始化、登录、邀请注册、密码重置。
- 首页、空间、页面编辑、收藏、回收站。
- 成员、群组、空间、公开分享等基础设置。
- 文件上传、评论、搜索等开源基础功能。

## 二次开发目录建议

前端：

- `apps/client/src/features/community`
- 按功能拆分子目录，例如 `ai`、`templates`、`audit`、`api-keys`。
- 不从 `apps/client/src/ee` import 任何代码。

后端：

- `apps/server/src/community`
- 当前已接入空模块 `CommunityModule`。
- 后续每个社区功能建议独立 module、service、controller、repository。

Docker：

- 当前 `docker-compose.yml` 使用官方镜像并挂载本地构建产物：
  - `./apps/server/dist:/app/apps/server/dist:ro`
  - `./apps/client/dist:/app/apps/client/dist:ro`
  - `./packages/editor-ext/dist:/app/packages/editor-ext/dist:ro`
- 已调整静态资源服务逻辑，运行时不再写入 client dist，可保持只读挂载。

## 验证命令

检查社区前端是否仍引用企业模块：

```powershell
rg -n "@/ee|useHasFeature|entitlementAtom|useEntitlements" apps/client/src -g "!apps/client/src/ee/**"
```

预期：无输出。

构建：

```powershell
pnpm.cmd run build
```

Docker 重启：

```powershell
wsl -e sh -lc "cd /mnt/c/Users/lj153/docmost && docker compose up -d --force-recreate docmost"
```

访问验证：

```powershell
wsl -e sh -lc "curl -sS -I http://localhost:3000 | head -20"
```

预期：返回 `HTTP/1.1 200 OK`。
