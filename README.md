# Trace — Claude edition

基于《Trace 界面与交互复现文档》重建的 iPad 网页 demo。交互流程、状态逻辑与素材保持原规格；视觉换成 Claude 风格：暖纸色底、墨色排版、单一陶土色（clay）强调、Newsreader 衬线标题 + Inter 正文 + JetBrains Mono 标签。

## 启动

```sh
npm install
npm run dev -- --port 5175
npm run build
```

## 与原版的差异

- **视觉**：Trace 从深绿暗色改为浅色纸面；主强调色由淡黄绿改为 clay `#c96442`；特征簇用 sage / slate / ochre / plum 四色区分。
- **结构**：三份互相覆盖的 CSS 改为按层拆分的 `tokens → shell → apps → trace`，没有需要靠层叠顺序修正的旧规则。
- **逻辑**：`src/data.ts`、`src/learning.ts` 与原仓库固定提交一致；记录规则集中在 `src/state.ts` 的 `recordArt`。
- **练习保存**：画布（导入图 / 演示画布 + 笔画）合成为一张 JPEG 存入日志。

## 文件

| 文件 | 职责 |
| --- | --- |
| `src/App.tsx` | 会话、跨 App 状态、记录、保存、导航 |
| `src/state.ts` | 本地存储（`trace-ipad-learning-v2`）与 `recordArt` |
| `src/TabletFrame.tsx` / `HomeScreen.tsx` | iPad 外框、状态栏、主屏、Dock、Home 手势 |
| `src/SocialApp.tsx` | Instagram / Pinterest、作品详情、悬浮记录按钮 |
| `src/Procreate.tsx` | 练习画布、导入、演示画布、合成 |
| `src/TraceApp.tsx` | Trace 顶栏、开始页、Community / My path 切换 |
| `src/PersonalPaths.tsx` | 并行学习路径卡片 |
| `src/ReferenceCommunity.tsx` | 单图星状社区、详情栏、视频、笔记 |
| `src/Atlas.tsx` | D3 力导向总图与路径回放 |
| `src/Modals.tsx` | 保存练习、练习对比弹层 |

素材（`public/`）来自原仓库 `thecoldness/AI70Hackathon@01aafe9`，版权归原作者与工作室，署名保留在 `src/data.ts` 与 `public/art/credits.json`。

## AI 学习日志

保存练习时，Trace 会把这条路径的文字信息（标题、作者、标签、平台和时间、你的笔记，不含图片）发给 Claude（`claude-opus-5-5`），写一篇私密学习日志，显示在 My path。

- 调用在 dev/preview 服务器端完成（`server/journal.ts`，接口 `POST /api/journal`），密钥不会进入浏览器。
- 把 `.env.example` 复制为 `.env.local`，填入 `ANTHROPIC_API_KEY`，重启 `npm run dev`。
- 没有密钥或调用失败时，自动使用本地模板生成日志，并标注 "Written from your recorded steps"。
- 已开启服务端 fallback（`fallbacks: "default"`）：如果请求被安全策略拒绝，会自动换合适的模型重试。
- 纯静态部署（只有 `dist/`）没有这个接口，日志会使用模板。
