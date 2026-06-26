[根目录](../../CLAUDE.md) > [apps](../) > **server**

# Server 模块

## 模块职责

NestJS 后端服务，提供 Docmost 的全部服务端能力：REST API、WebSocket 通信、实时协作编辑、后台任务队列、数据持久化、邮件、搜索、导入导出等。

## 入口与启动

- **主应用入口**：`src/main.ts`
  - 使用 Fastify 适配器创建 NestJS 应用
  - 全局 API 前缀 `/api`
  - 启用 CORS、全局 ValidationPipe、全局拦截器
  - 默认监听端口 3000（`PORT` 环境变量）
- **协作服务器入口**：`src/collaboration/server/collab-main.ts`
  - 独立 NestJS 应用，仅加载协作相关模块
  - 默认监听端口 3001（`COLLAB_PORT` 环境变量）

## 对外接口

所有 API 路由前缀为 `/api`，主要控制器：

| 路径 | 控制器 | 职责 |
|---|---|---|
| `auth` | `AuthController` | 登录、注册、密码重置 |
| `users` | `UserController` | 用户 CRUD、头像、偏好 |
| `pages` | `PageController` | 页面 CRUD、移动、侧边栏、导出 |
| `spaces` | `SpaceController` | 空间 CRUD、成员管理 |
| `comments` | `CommentController` | 评论 CRUD、解决/恢复 |
| `groups` | `GroupController` | 用户组 CRUD、成员管理 |
| `search` | `SearchController` | 全文搜索、用户/组/页面建议、搜索词日志与联想（见下） |
| `search-attachments` | `AttachmentSearchController` | 附件全文搜索 |
| `shares` | `ShareController` | 分享链接管理 |
| `favorites` | `FavoriteController` | 收藏管理 |
| `notifications` | `NotificationController` | 通知读取/归档 |
| `sessions` | `SessionController` | 会话管理 |
| `workspace` | `WorkspaceController` | 工作区设置、邀请、成员 |
| `health` | `HealthController` | 健康检查 |
| `version` | `VersionController` | 版本信息 |
| `file-tasks` | `FileTaskController` | 导入任务状态 |
| `community/audit` | `AuditController` | 审计日志（社区版） |
| `community/page-permissions` | `PagePermissionsController` | 页面权限（社区版） |

### 搜索接口（`core/search/search.controller.ts`）

| 方法 & 路径 | 鉴权 | 入参 DTO | 说明 |
|---|---|---|---|
| `POST /search` | JWT | `SearchDTO` | 页面全文搜索（tsvector + `f_unaccent` + `pg-tsquery`）。`SEARCH_DRIVER=typesense` 时走企业版 `PageSearchService` |
| `POST /search/suggest` | JWT | `SearchSuggestionDTO` | 联想用户/组/页面（按 `includeUsers`/`includeGroups`/`includePages` 开关，页面按当前空间优先排序，并经页面级权限过滤） |
| `POST /search/log` | JWT | `SearchLogDTO` | 记录用户提交的搜索词，对 `(workspaceId, query)` 做 upsert，累加 `search_count`（长度 < 2 忽略） |
| `GET /search/keywords?query=&limit=` | JWT | query 参数 | 返回与给定前缀匹配的热门搜索词联想，按 `search_count` desc、`last_searched_at` desc 排序，默认 limit 8 |
| `POST /search/share-search` | `@Public()` | `SearchShareDTO` | 分享页公开搜索（按 shareId 解析可见页面集合，含子页时排除受限祖先） |

服务层 `SearchService` 关键方法：`searchPage`、`searchSuggestions`、`logSearchKeyword`、`getKeywordSuggestions`。依赖 `PageRepo`、`SpaceMemberRepo`、`ShareRepo`、`PagePermissionRepo`。

WebSocket 网关：
- `WsGateway` -- 主 WebSocket 网关，处理树结构变更通知
- `CollaborationGateway` -- Hocuspocus 协作网关，处理实时编辑

## 关键依赖与配置

### 核心依赖

- **NestJS 11** -- 后端框架
- **Kysely** -- SQL 查询构建器（ORM）
- **BullMQ** -- 任务队列
- **Hocuspocus** -- 实时协作服务器
- **Socket.IO** -- WebSocket 通信
- **CASL** -- 权限管理
- **Passport** -- 认证策略（JWT、Google OAuth、SAML、OIDC）
- **pg-tsquery** -- 构建 PostgreSQL tsquery（用于全文搜索）
- **@fastify/static** -- 静态文件服务（`integrations/static/static.module.ts`，注入 `window.CONFIG`）

### 配置管理

所有配置通过 `EnvironmentService`（`src/integrations/environment/environment.service.ts`）从环境变量读取。关键配置项参见根 `.env.example`。

搜索相关配置（`environment.service.ts`）：
- `getSearchDriver()` -- 返回 `'database'`（默认）或 `'typesense'`
- `getTypesenseUrl()` / `getTypesenseApiKey()` / `getTypesenseLocale()` -- Typesense 连接参数
- 校验（`environment.validation.ts`）：`SEARCH_DRIVER` ∈ `['database','typesense']`；`TYPESENSE_URL`/`TYPESENSE_API_KEY`/`TYPESENSE_LOCALE` 仅在 `typesense` 模式下必填

### 数据库

- PostgreSQL + Kysely（通过 `kysely-postgres-js` 驱动）
- 连接池大小：`DATABASE_MAX_POOL`（默认 10）
- 迁移工具：`kysely-migration-cli`
- 自动生成类型：`kysely-codegen` -> `src/database/types/db.d.ts`

### 存储

- 驱动选择：`STORAGE_DRIVER`（`local` 或 `s3`）
- 本地存储路径：`data/storage/`
- S3 配置：`AWS_S3_*` 系列环境变量

### 邮件

- 驱动选择：`MAIL_DRIVER`（`smtp` 或 `postmark`）
- 邮件模板使用 `@react-email` 渲染
- 开发预览：`pnpm run email:dev`（端口 5019）

## 数据模型

核心数据表（定义于 `src/database/types/db.d.ts`）：

| 表名 | 说明 |
|---|---|
| `Workspaces` | 多租户工作区 |
| `Users` | 用户 |
| `Spaces` | 知识空间 |
| `SpaceMembers` | 空间成员 |
| `Pages` | 页面（含 Yjs 文档） |
| `PageHistory` | 页面历史版本 |
| `Comments` | 评论 |
| `Attachments` | 附件 |
| `Groups` | 用户组 |
| `GroupUsers` | 组-用户关联 |
| `Backlinks` | 反向链接 |
| `Shares` | 分享链接 |
| `Favorites` | 收藏 |
| `Notifications` | 通知 |
| `Watchers` | 关注/订阅 |
| `UserTokens` | 用户令牌 |
| `UserSessions` | 用户会话 |
| `UserMfa` | MFA 配置 |
| `AuthProviders` | SSO 认证提供商 |
| `AuthAccounts` | SSO 认证账号 |
| `WorkspaceInvitations` | 工作区邀请 |
| `Billing` | 订阅计费（企业版） |
| `FileTasks` | 文件导入任务 |
| `ApiKeys` | API 密钥（企业版） |
| `Audit` | 审计日志（企业版） |
| `PageAccess` | 页面访问级别（企业版） |
| `PagePermissions` | 页面权限（企业版） |
| `PageVerifications` | 页面验证（企业版） |
| `PageVerifiers` | 页面验证人（企业版） |
| `Templates` | 模板（企业版） |
| `AiChats` | AI 对话（企业版） |
| `AiChatMessages` | AI 对话消息（企业版） |
| `SearchKeywords` | 搜索词统计（2026-06-26 新增，见下） |

#### `search_keywords` 表（迁移 `20260626T130000-search-keywords.ts`）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | uuid (pk, `gen_uuid_v7()`) | 主键 |
| `workspace_id` | uuid (fk workspaces, cascade) | 工作区 |
| `query` | varchar (not null) | 归一化后的搜索词（小写 trim） |
| `space_id` | uuid (fk spaces, cascade, nullable) | 可选关联空间 |
| `search_count` | int8 (default 1) | 累计搜索次数 |
| `last_searched_at` | timestamptz (default now) | 最近搜索时间 |
| `created_at` | timestamptz (default now) | 创建时间 |

索引：
- `uq_search_keywords_workspace_query` -- unique(workspace_id, query)，支撑 upsert
- `idx_search_keywords_workspace_count` -- (workspace_id, search_count, last_searched_at)，支撑联想查询

### 目录结构（src/）

```
src/
  main.ts                      # 主应用入口
  app.module.ts                # 根模块
  collaboration/               # 实时协作（Hocuspocus + Yjs）
    server/                    #   独立协作服务器
    extensions/                #   Hocuspocus 扩展（认证、持久化、Redis同步）
    processors/                #   历史版本处理器
    services/                  #   协作历史服务
  common/                      # 公共模块
    decorators/                #   自定义装饰器
    guards/                    #   JWT 认证守卫
    helpers/                   #   工具函数、ProseMirror 工具
    interceptors/              #   HTTP 响应拦截器、审计拦截器
    logger/                    #   Pino 日志配置
    middlewares/               #   域名中间件、审计上下文中间件
    validators/                #   自定义验证器
  community/                   # 社区版功能
    audit/                     #   审计日志
    page-permissions/          #   页面权限
  core/                        # 核心业务模块
    auth/                      #   认证
    attachment/                #   附件管理
    casl/                      #   CASL 权限
    comment/                   #   评论
    favorite/                  #   收藏
    group/                     #   用户组
    notification/              #   通知
    page/                      #   页面（含 page-access 子模块）
    search/                    #   搜索（dto/ + controller + service + module + specs）
    session/                   #   会话
    share/                     #   分享
    space/                     #   空间
    user/                      #   用户
    watcher/                   #   关注/订阅
    workspace/                 #   工作区
  database/                    # 数据库层
    migrations/                #   迁移文件（当前 44 个）
    repos/                     #   仓储层（Kysely 查询）
    services/                  #   迁移服务
    types/                     #   类型定义（db.d.ts 自动生成）
    pagination/                #   分页工具
  integrations/                # 基础设施集成
    audit/                     #   审计服务
    environment/               #   环境配置
    export/                    #   导出功能
    health/                    #   健康检查
    import/                    #   导入功能
    mail/                      #   邮件
    queue/                     #   任务队列（BullMQ）
    redis/                     #   Redis 配置
    security/                  #   安全（版本、robots.txt）
    static/                    #   静态文件服务（注入 window.CONFIG）
    storage/                   #   文件存储（local/S3）
    telemetry/                 #   遥测
    throttle/                  #   速率限制
    transactional/             #   事务性邮件模板
  ws/                          # WebSocket 网关
```

## 测试与质量

- 测试框架：Jest + ts-jest
- 运行命令：`pnpm test`
- 覆盖率：`pnpm test:cov`
- E2E：`pnpm test:e2e`
- 代码检查：`pnpm lint`
- 格式化：`pnpm format`

现有测试文件（19 个 .spec.ts）：
- `common/helpers/utils.spec.ts`
- `common/validators/no-urls.validator.spec.ts`
- `core/auth/auth.controller.spec.ts`
- `core/auth/services/auth.service.spec.ts`
- `core/auth/services/token.service.spec.ts`
- `core/comment/comment.service.spec.ts`
- `core/group/group.controller.spec.ts`
- `core/group/services/group.service.spec.ts`
- `core/page/page.controller.spec.ts`
- `core/page/services/page.service.spec.ts`
- `core/search/search.controller.spec.ts`（仅 "should be defined" 桩，未覆盖 keyword 新方法）
- `core/search/search.service.spec.ts`（仅 "should be defined" 桩，未覆盖 `logSearchKeyword` / `getKeywordSuggestions` / `searchSuggestions`）
- `core/space/services/space.service.spec.ts`
- `core/space/space.controller.spec.ts`
- `core/user/user.controller.spec.ts`
- `core/workspace/services/workspace.service.spec.ts`
- `integrations/environment/environment.service.spec.ts`
- `integrations/storage/drivers/local.driver.spec.ts`
- `integrations/storage/storage.service.spec.ts`

## 常见问题 (FAQ)

- **如何添加新的数据库迁移？** 运行 `pnpm migration:create`，在 `src/database/migrations/` 下创建迁移文件。
- **如何添加新的 API 端点？** 在 `src/core/` 下对应模块中创建 controller + service + dto，然后在模块中注册。
- **企业版模块如何加载？** `app.module.ts` 通过动态 `require('./ee/ee.module')` 尝试加载，社区版不包含此文件时会静默跳过。搜索的 Typesense 驱动同样通过 `SearchController.searchTypesense` 动态 `require('./ee/typesense/...')`。
- **协作服务器如何独立部署？** 设置 `COLLAB_URL` 指向独立协作服务器地址，协作服务器通过 `COLLAB_PORT` 监听。
- **搜索词联想如何工作？** 用户在 spotlight 提交搜索（点击结果或回车）时前端调用 `POST /search/log`，服务端 upsert `search_keywords`；下次输入前缀 ≥2 字符时前端调用 `GET /search/keywords` 取热门词联想。

## 相关文件清单

- `package.json` -- 依赖与脚本
- `tsconfig.json` / `tsconfig.build.json` -- TypeScript 配置
- `eslint.config.mjs` -- ESLint 配置（项目根目录）
- `.env.example` -- 环境变量模板
- `Dockerfile` -- Docker 构建
- `docker-compose.yml` -- Docker Compose 编排
- `src/core/search/` -- 搜索模块（controller / service / dto / module / specs）
- `src/database/migrations/20260626T130000-search-keywords.ts` -- 搜索词统计表迁移

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|---|---|---|
| 2026-06-26 | 更新 | 增量更新搜索模块：补充 `POST /search/suggest`、`POST /search/log`、`GET /search/keywords` 接口与 `SearchSuggestionDTO`/`SearchLogDTO`；新增 `SearchKeywords` 表与迁移 `20260626T130000-search-keywords.ts`；修正迁移总数为 44；补充 `SEARCH_DRIVER` 配置、`pg-tsquery`/`@fastify/static` 依赖；标注 search spec 覆盖缺口 |
| 2026-06-15 | 新建 | 初始化 server 模块文档 |
