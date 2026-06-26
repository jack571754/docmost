[根目录](../../CLAUDE.md) > [apps](../) > **client**

# Client 模块

## 模块职责

React 前端单页应用，提供 Docmost 的全部用户界面：页面编辑、空间管理、搜索、设置、协作编辑、分享等。基于 Mantine UI 组件库，使用 Vite 构建工具。

## 入口与启动

- **入口文件**：`src/main.tsx`
  - 创建 React 根节点
  - 挂载 BrowserRouter、MantineProvider、ModalsProvider、QueryClientProvider、HelmetProvider、PostHogProvider
- **路由定义**：`src/App.tsx`
  - 使用 react-router-dom v7 定义所有路由
- **开发启动**：`pnpm run client:dev`（Vite 开发服务器，自动代理 `/api`、`/socket.io`、`/collab` 到后端）
- **构建**：`pnpm run client:build`（tsc + vite build）

## 对外接口

前端不直接暴露 API，通过 `src/lib/api-client.ts` 中的 axios 实例与后端 `/api` 通信：
- 所有请求自动携带 Cookie（`withCredentials: true`）
- 401 响应自动重定向到登录页
- 404 且"workspace not found"时重定向到设置页

### 路由结构

| 路径 | 页面 | 说明 |
|---|---|---|
| `/home` | `Home` | 仪表盘首页 |
| `/login` | `LoginPage` | 登录 |
| `/invites/:id` | `InviteSignup` | 邀请注册 |
| `/forgot-password` | `ForgotPassword` | 忘记密码 |
| `/password-reset` | `PasswordReset` | 密码重置 |
| `/setup/register` | `SetupWorkspace` | 初始设置（仅自托管） |
| `/s/:spaceSlug` | `SpaceHome` | 空间首页 |
| `/s/:spaceSlug/trash` | `SpaceTrash` | 空间回收站 |
| `/s/:spaceSlug/p/:pageSlug` | `Page` | 页面编辑 |
| `/p/:pageSlug` | `PageRedirect` | 页面短链跳转 |
| `/spaces` | `SpacesPage` | 全部空间 |
| `/favorites` | `FavoritesPage` | 收藏 |
| `/share/:shareId/p/:pageSlug` | `SharedPage` | 分享页 |
| `/settings/account/profile` | `AccountSettings` | 账户设置 |
| `/settings/account/preferences` | `AccountPreferences` | 偏好设置 |
| `/settings/workspace` | `WorkspaceSettings` | 工作区设置 |
| `/settings/members` | `WorkspaceMembers` | 成员管理 |
| `/settings/groups` | `Groups` | 用户组 |
| `/settings/spaces` | `Spaces` | 空间管理 |
| `/settings/sharing` | `Shares` | 分享管理 |
| `/settings/audit` | `AuditLogsPage` | 审计日志 |

### 搜索功能（`features/search/`）

`SearchSpotlight`（`components/search-spotlight.tsx`）基于 Mantine Spotlight 实现，串联以下链路：

| 层 | 文件 | 职责 |
|---|---|---|
| 类型 | `types/search.types.ts` | `IPageSearch`、`ISuggestionResult`、`IKeywordSuggestion`、`SearchSuggestionParams`、`IPageSearchParams`、`IAttachmentSearch` |
| 服务 | `services/search-service.ts` | `searchPage`、`searchSuggestions`、`searchShare`、`searchAttachments`、`logSearchKeyword`（POST /search/log）、`getKeywordSuggestions`（GET /search/keywords） |
| 查询 | `queries/search-query.ts` | `usePageSearchQuery`、`useSearchSuggestionsQuery`、`useShareSearchQuery`、`useAttachmentSearchQuery`、`useKeywordSuggestionsQuery`（debounced、staleTime 1min、≥2 字符启用、`keepPreviousData`） |
| Hook | `hooks/use-unified-search.ts` | 统一搜索封装（剥离 `contentType` 后转调 `searchPage`） |
| 组件 | `components/search-spotlight.tsx` | spotlight 容器，300ms debounce；输入 ≥2 字符渲染关键词联想；点击结果/回车时调用 `logSearchKeyword` |
| 组件 | `components/keyword-suggestions.tsx` | 渲染 `Spotlight.ActionsGroup`，每项显示搜索词 + 次数，点击回填到搜索框 |
| 组件 | `components/search-result-item.tsx` | 页面/附件结果项；新增 `onResultClick` 回调用于触发搜索词记录 |
| 组件 | `components/search-spotlight-filters.tsx` | 空间/内容类型筛选 |
| 组件 | `components/share-search-spotlight.tsx` | 分享页搜索 spotlight |
| 组件 | `components/search-control.tsx` | 搜索入口控件 |
| 常量 | `constants.ts` | `searchSpotlightStore`、`shareSearchSpotlightStore`（Mantine spotlight store） |

> 注：原 `features/community/search/`（`SuggestionGroup.tsx`、`useSpotlightSuggestions.ts`）已删除，搜索建议逻辑统一收敛到 `features/search/`。

## 关键依赖与配置

### 核心依赖

- **React 18** + **React DOM** -- UI 框架
- **Mantine 8** -- UI 组件库（core, hooks, form, modals, notifications, spotlight, dates）
- **TanStack Query v5** -- 数据获取与缓存
- **Jotai** -- 原子化状态管理
- **TipTap 3** + **Yjs** -- 富文本编辑 + 实时协作
- **React Router DOM v7** -- 路由
- **Axios** -- HTTP 客户端
- **i18next** -- 国际化
- **Socket.IO Client** -- WebSocket 通信
- **Zod** -- 表单验证
- **DOMPurify** -- 搜索结果高亮 HTML 净化（`search-result-item.tsx`）

### 配置

- Vite 配置：`vite.config.ts`
  - 开发代理：`/api` -> 后端，`/socket.io` 和 `/collab` -> WebSocket
  - 代码分割：Mantine、Mermaid、Excalidraw、KaTeX 独立分块
  - 路径别名：`@` -> `src/`
- 运行时配置：通过 `window.CONFIG` 注入（生产环境，由后端 `StaticModule` 渲染）或 `process.env`（开发环境），见 `src/lib/config.ts`
  - 暴露字段：`APP_URL`、`CLOUD`、`FILE_UPLOAD_SIZE_LIMIT`、`FILE_IMPORT_SIZE_LIMIT`、`DRAWIO_URL`、`SUBDOMAIN_HOST`、`COLLAB_URL`、`BILLING_TRIAL_DAYS`、`POSTHOG_HOST`、`POSTHOG_KEY`
  - 搜索无客户端配置项：搜索词联想完全由后端 `search_keywords` 表驱动

## 数据模型

前端不直接定义数据模型，使用 TypeScript 类型定义在各 feature 目录下的 `types/` 中。主要类型：

- `features/auth/types/auth.types.ts` -- 认证相关
- `features/page/types/page.types.ts` -- 页面相关
- `features/workspace/types/workspace.types.ts` -- 工作区相关
- `features/comment/types/comment.types.ts` -- 评论相关
- `features/attachments/types/attachment.types.ts` -- 附件相关
- `features/group/types/group.types.ts` -- 用户组相关
- `features/notification/types/notification.types.ts` -- 通知相关
- `features/search/types/search.types.ts` -- 搜索相关（含 `IKeywordSuggestion`）
- `ee/ai/types/ai.types.ts` -- AI 相关（企业版）

### 目录结构（src/）

```
src/
  main.tsx                     # 入口
  App.tsx                      # 路由定义
  theme.ts                     # Mantine 主题
  i18n.ts                      # 国际化配置
  components/                  # 通用组件
    common/                    #   通用业务组件
    icons/                     #   自定义图标
    layouts/global/            #   全局布局（侧边栏、顶栏）
    settings/                  #   设置页通用组件
    ui/                        #   通用 UI 组件
  ee/                          # 企业版功能
    ai/                        #   AI 编辑器助手、搜索
    ai-chat/                   #   AI 对话
    api-key/                   #   API 密钥管理
    audit/                     #   审计日志
    billing/                   #   计费
    cloud/                     #   云平台集成
    comment/                   #   评论增强（解决）
    entitlement/               #   权限许可
    licence/                   #   许可证
    mfa/                       #   多因素认证
    page-permission/           #   页面权限
    page-verification/         #   页面验证
    pdf-export/                #   PDF 导出
    security/                  #   安全设置（SSO、LDAP）
    template/                  #   模板
  features/                    # 功能模块
    attachments/               #   附件
    auth/                      #   认证（登录、注册、密码重置）
    comment/                   #   评论
    editor/                    #   编辑器核心
      atoms/                   #     Jotai atoms
      components/              #     编辑器 UI 组件
      extensions/              #     TipTap 扩展注册
      hooks/                   #     编辑器 hooks
      utils/                   #     工具函数
    favorite/                  #   收藏
    group/                     #   用户组
    home/                      #   首页
    notification/              #   通知
    page/                      #   页面（树、移动、回收站）
    page-history/              #   页面历史
    search/                    #   搜索（spotlight、联想词、结果项、筛选、分享搜索）
    share/                     #   分享
    space/                     #   空间
    websocket/                 #   WebSocket 连接
    workspace/                 #   工作区
  hooks/                       # 通用 hooks
  lib/                         # 工具库
    api-client.ts              #   Axios 实例
    config.ts                  #   运行时配置
    app-route.ts               #   路由常量
    utils.tsx                  #   工具函数
  pages/                       # 页面组件
    auth/                      #   认证页
    dashboard/                 #   仪表盘
    favorites/                 #   收藏页
    page/                      #   页面
    settings/                  #   设置页
    share/                     #   分享页
    space/                     #   空间页
    spaces/                    #   全部空间
```

## 测试与质量

- 目前无单元测试
- ESLint：`pnpm lint`
- Prettier：`pnpm format`

## 常见问题 (FAQ)

- **如何添加新页面？** 在 `src/pages/` 下创建页面组件，在 `src/App.tsx` 中添加路由。
- **如何与后端 API 交互？** 使用 `src/lib/api-client.ts` 导出的 axios 实例，或在 feature 目录的 `services/` 中封装。
- **企业版功能如何启用？** 企业版组件在 `src/ee/` 下，通过 `use-feature.ts` hook 检查功能开关。
- **编辑器如何扩展？** 在 `packages/editor-ext` 中添加扩展，在 `src/features/editor/extensions/extensions.ts` 中注册。
- **搜索联想词如何生效？** 用户提交搜索词后端写入 `search_keywords`；再次输入前缀 ≥2 字符时 `useKeywordSuggestionsQuery` 拉取并渲染 `KeywordSuggestions`，点击联想项回填到搜索框。

## 相关文件清单

- `package.json` -- 依赖与脚本
- `vite.config.ts` -- Vite 配置
- `tsconfig.json` / `tsconfig.node.json` -- TypeScript 配置
- `eslint.config.mjs` -- ESLint 配置
- `postcss.config.js` -- PostCSS 配置
- `index.html` -- HTML 入口
- `src/features/search/` -- 搜索功能目录（含 `keyword-suggestions.tsx`）

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|---|---|---|
| 2026-06-26 | 更新 | 增量更新搜索功能：新增 `keyword-suggestions.tsx`、`useKeywordSuggestionsQuery`、`logSearchKeyword`/`getKeywordSuggestions` 服务；`search-result-item.tsx` 增加 `onResultClick`；`search-spotlight.tsx` 集成关键词联想与搜索词记录；记录 `features/community/search/` 已删除、DOMPurify 依赖、`window.CONFIG` 字段清单 |
| 2026-06-15 | 新建 | 初始化 client 模块文档 |
