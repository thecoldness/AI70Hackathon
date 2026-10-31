# Trace — The art of learning

为 Dartmouth AI at 70「What Must Remain Human?」制作的可交互 iPad 网页 demo。Trace 作为一个在后台运行的学习伙伴，记录用户主动选择的参考、亲自完成的练习与反思，并把过程呈现为可探索的学习路径。

## 启动

```sh
npm install
npm run dev
```

打开终端显示的本地地址。构建检查：`npm run build`。不需要 API key、后端或浏览器扩展。

## 一条完整的演示路线

1. 先在 iPad 主屏幕打开 **Instagram**，选择一个画家账号，只浏览这位画家的作品。打开一幅想学习的画，例如 Felicia Chen 为 **Kung Fu Panda 4** 绘制的 **Misty Coast**，停留在作品详情。此时没有悬浮按钮，也不会生成学习记录。
2. 点击底部 Home 手势条，打开 **Trace**，点击 **Start learning session**；回主屏幕再打开 **Instagram**。它会恢复同一画家、同一作品及浏览位置。点击悬浮目标按钮 **Set as learning goal**，把当前作品设为学习目标，即个人路径的第一个节点。启动 Trace 本身不会自动设定目标。
3. 关闭作品详情，打开同一画家的 **Mountain Shape Studies** 或 **Sunlit Harbor Chase**，点击心形收藏。
4. 回到主屏幕，打开 **Pinterest**，此时图集混合展示 **Kung Fu Panda、Zootopia、Frozen、Van Gogh、Monet**。演示时选择 **City in Layers** 或 **Tundra Town** 等 Zootopia 概念图，以及其他 Kung Fu Panda 作品并点击心形。图片、平台来源、选择顺序和时间都会保留。
5. 回到主屏幕，打开 **Procreate**。在画布上绘画、导入自己的 PNG/JPEG/WebP，或点击 **Reveal demo study** 使用清楚标注的演示素材。
6. 点击 Home 手势条、**Gallery** 或 **Finish & leave Procreate**。退出后，Trace 弹出 **Keep this study in your journal?**，选择真正有帮助的参考，写下自己的观察，点击 **Yes, add to my journal**。选择 **Not now** 则不保存练习。
7. 保存后仍在主屏幕。再次点开 **Trace**，查看社区图谱或 **My path**，其中包含 input、跨 App 参考记录、自己的练习及反思。
8. 点击自己的练习节点，再点 **Compare & reflect**，比较原作、自己的练习和示例临摹；可以给感悟点赞、保存自己的文字、打开关联教学提纲。
9. 回到 **Community atlas**，点击Zootopia 群组中较远的 **Finding a way through** 练习节点，自动展开 Jules 从 Kung Fu Panda 原图跨到 Zootopia 的示例学习路径。也可先选原图，再点 **Find a path from here** 选择目的地。支持暂停、逐步查看和重播；图谱自动缩放到路径。

Instagram 与 Pinterest 各自保留作品详情、搜索、筛选及滚动位置；切换 App 不会把浏览页重置。主屏幕和 Dock 均可启动 App。外框右上角回转箭头重置 demo；Trace 中的下载图标导出当前学习记录。`Esc` 关闭当前对话框，对话框支持键盘焦点循环。录制前先重置，按以上顺序操作。

## 2 分 20 秒视频安排

| 时间 | 画面与讲述 |
| --- | --- |
| 0:00–0:15 | 主题：成果变得容易获得，理解仍需要人在实践中形成。 |
| 0:15–0:45 | 先在 Instagram 浏览并找到喜欢的作品，再启动 Trace，回到同一作品设定学习目标，并跨 App 收藏参考。 |
| 0:45–1:05 | 进入 Procreate 临摹，退出时确认保存；有真实绘画录像时可插入几秒。 |
| 1:05–1:35 | 回主屏幕重新打开 Trace，查看图谱、对比练习并阅读感悟。 |
| 1:35–2:05 | 缩远到共同图谱，选择起点和另一成果，回放学习路径。 |
| 2:05–2:20 | 说明系统承担记录、连接、反馈入口；人保留选择、观察、动手和反思。 |

推荐使用 Mac 上已有的 OBS 或 QuickTime 录屏，iMovie 剪辑和配音。保留页面中的演示标记；提交视频控制在 2:30 内。录制前点击重置、关闭多余标签页、完成一次彩排。建议使用横屏，浏览器缩放保持 100%。

## 演示边界

- iPad、Instagram、Pinterest、Procreate 均是同一网页内的模拟界面，没有连接或爬取真实平台，也没有系统级后台监控。
- 没有连接实际 AI 模型；记录、关联和页面效果由 demo 的确定逻辑驱动。
- 社区人物、文字、路径、点赞和热度是示例数据。路径回放使用明确记录的示例序列，不把图谱最短路径伪装成人的学习经历。
- 练习示例复用已标注来源的参考作品并施加 CSS 视觉处理，仅用于说明交互，不是人类学习成果或能力提升的证据。可替换为团队实际绘制并同意展示的作品。
- 图谱中的同一艺术品与用户的选图记录分开表示：来源、时间属于具体的记录事件。
- 只有用户在 Trace 主动开始后才出现悬浮按钮：先用目标图标设定学习目标，再用心形记录参考。用户返回原来浏览的 Instagram 作品后，主动点击 **Set as learning goal** 才会创建第一个节点；后续选择成为参考。启动前的浏览不进入日志，启动后也不记录未点击的作品。暂停后不接受记录；退出绘画 App 时，保存练习需要确认。数据保存在当前浏览器的 localStorage；私有笔记不会发送到服务器。
- 当前 demo 保留一轮练习，可以替换该练习；完整的多轮历史、真实账户及多人同步不在本版范围内。
- 图片导入限制为 3 MB。存储空间不足时会提示导出记录，当前页面仍可使用。重置会清空这个 demo 在当前浏览器内的学习记录与互动。
- Kung Fu Panda 4 概念图来自 Felicia Chen 本人作品集；Zootopia 概念图来自 Disney Animation 官方视觉开发页和 Matthias Lechner 本人作品集；新增的 Frozen 环境与角色概念图来自 Disney Animation 官方影片页，可在 Pinterest 混合图集中浏览或用 Frozen 分类筛选，并主动收藏到路径中。梵高和莫奈参考来自 Wikimedia Commons。完整来源与各自版权信息保存在 [public/art/credits.json](public/art/credits.json)，概念图没有标为公有领域。图像展示名称是描述性标签，Instagram 账号是演示账号。

## 代码位置

- `src/App.tsx`：学习会话、跨 App 状态、模拟平台、退出保存、练习与反馈。
- `src/TabletFrame.tsx`：iPad 外框、主屏幕、App 图标、Dock、后台状态和 Home 手势。
- `src/Atlas.tsx`：D3 力布局、SVG 图片节点、路径、缩放和平移。
- `src/data.ts`：作品、节点、示例人物、感悟与明确的学习序列。
- `src/styles.css`：图谱、绘画与反馈界面的基础样式。
- `src/tablet.css`：iPad 主屏幕、App 界面、响应布局和动效。

技术栈：React、TypeScript、Vite、D3-force、Lucide 图标。网页为静态应用，在线发布也不上传浏览器内的个人记录。
