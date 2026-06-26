[根目录](../../CLAUDE.md) > [packages](../) > **editor-ext**

# Editor Extensions 模块

## 模块职责

TipTap/ProseMirror 编辑器扩展包，为 Docmost 提供富文本编辑器的自定义节点、标记和功能扩展。此包同时被 server（服务端 HTML 渲染/解析）和 client（客户端编辑器）使用，因此不能依赖任何框架特定的 API（如 React）。

## 入口与启动

- **入口文件**：`src/index.ts`
  - 导出所有扩展模块
- **构建**：`pnpm run editor-ext:build`（tsc --build）
- **开发模式**：`pnpm --filter @docmost/editor-ext run dev`（tsc --watch）

## 对外接口

导出的主要扩展（TipTap Extension）：

| 导出名 | 文件 | 说明 |
|---|---|---|
| `TrailingNode` | `trailing-node.ts` | 文档末尾自动添加空节点 |
| `Comment` / `CommentDecoration` | `comment/` | 评论标记与装饰 |
| `Math` / `MathBlock` / `MathInline` | `math/` | LaTeX 数学公式（行内/块级） |
| `Details` / `DetailsContent` / `DetailsSummary` | `details/` | 折叠/展开区块 |
| `Table` 系列 | `table/` | 增强表格（含拖拽排序 DnD） |
| `Image` / `ImageUpload` | `image/` | 图片节点与上传 |
| `Video` / `VideoUpload` | `video/` | 视频节点与上传 |
| `Audio` / `AudioUpload` | `audio/` | 音频节点与上传 |
| `Attachment` / `AttachmentUpload` | `attachment/` | 附件节点与上传 |
| `Pdf` / `PdfUpload` | `pdf/` | PDF 嵌入与上传 |
| `Callout` | `callout/` | 提示/警告框 |
| `CustomCodeBlock` | `custom-code-block/` | 增强代码块（语法高亮） |
| `Drawio` | `drawio.ts` | Draw.io 图表嵌入 |
| `Excalidraw` | `excalidraw.ts` | Excalidraw 白板嵌入 |
| `Embed` / `EmbedProvider` | `embed.ts` / `embed-provider.ts` | 外部内容嵌入（YouTube、Figma 等） |
| `Mention` | `mention.ts` | @提及 |
| `Markdown` | `markdown/` | Markdown 导入/导出（marked + turndown） |
| `SearchAndReplace` | `search-and-replace/` | 搜索与替换 |
| `Subpages` | `subpages/` | 子页面嵌入 |
| `Highlight` | `highlight.ts` | 文本高亮 |
| `Heading` | `heading/heading.ts` | 标题增强 |
| `UniqueId` | `unique-id/` | 唯一 ID 分配 |
| `SharedStorage` | `shared-storage/` | Yjs 共享存储 |
| `RecreateTransform` | `recreate-transform/` | 变换重建工具 |
| `Columns` / `Column` | `columns/` | 多列布局 |
| `Status` | `status.ts` | 状态标签 |
| `ResizableNodeView` | `resizable-nodeview.ts` | 可调整大小的节点视图 |
| `Link` | `link.ts` | 链接扩展 |
| `Selection` | `selection.ts` | 选择扩展 |
| `sanitizeUrl` | `link.ts` | URL 净化工具（被 client `lib/config.ts` 引用） |

### 工具函数

- `utils.ts` -- 通用编辑器工具函数
- `media-utils.ts` -- 媒体文件工具
- `markdown/utils/` -- Markdown 转换工具（turndown + marked 扩展）

## 关键依赖与配置

- **TipTap 3** -- 编辑器框架（由根 package.json 管理版本）
- **marked** -- Markdown 解析
- **@joplin/turndown** -- HTML 转 Markdown
- 无 React/Vue 等框架依赖（纯 TipTap/ProseMirror 扩展）

### 构建配置

- `tsconfig.json` -- TypeScript 编译配置
- 输出目录：`dist/`
- 主入口：`dist/index.js`
- 类型入口：`dist/index.d.ts`

## 数据模型

此模块不直接操作数据库。编辑器内容以 ProseMirror 文档模型存储，实时协作时使用 Yjs 文档格式（YDoc）。

## 测试与质量

- 目前无单元测试
- 格式化：`.prettierrc`

## 常见问题 (FAQ)

- **如何添加新编辑器扩展？** 在 `src/lib/` 下创建新目录，实现 TipTap Extension，然后在 `src/index.ts` 中导出。
- **为什么不能使用 React API？** 此包同时被 server 端使用（服务端渲染 HTML），不能依赖浏览器或框架特定 API。
- **如何调试编辑器扩展？** 在 client 的 `src/features/editor/extensions/extensions.ts` 中注册扩展后，使用浏览器 DevTools 调试。

## 相关文件清单

- `package.json` -- 依赖与脚本
- `tsconfig.json` -- TypeScript 配置
- `src/index.ts` -- 导出入口
- `src/lib/` -- 所有扩展实现

## 变更记录 (Changelog)

| 日期 | 操作 | 说明 |
|---|---|---|
| 2026-06-26 | 复核 | 增量复核：本模块源码无变更；补充 `sanitizeUrl` 导出说明（被 client `lib/config.ts` 用于文件 URL 净化） |
| 2026-06-15 | 新建 | 初始化 editor-ext 模块文档 |
