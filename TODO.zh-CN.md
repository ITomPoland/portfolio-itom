# 🎨 Portfolio ITOM — 总任务清单

> **目标：** 将作品集打磨至 **AWWWARDS SOTD / FWA** 水准 — 绝不让步。  
> **启动日期：** 2026-02-13  
> **技术栈：** React + Three.js (R3F) + GSAP + Vite

---

## 🔴 优先级 1 — 严重缺陷与缺失功能

### 1. 修复从 About 室"泄漏"到走廊的云朵
- [X] 排查 `SkyChunk.jsx` — 当前的 `CORRIDOR_CLIP_Z = -8` 未能生效，云朵"逃逸"到了走廊
- [X] 考虑改用按相机裁剪，而非固定的 Z 阈值
- [X] 添加视觉测试 — About 室双向进出
- **相关文件：** [SkyChunk.jsx](file:///c:/Users/tomsz/Desktop/portfolio/portfolio-itom/src/components/canvas/rooms/About/SkyChunk.jsx), [InfiniteSkyManager.jsx](file:///c:/Users/tomsz/Desktop/portfolio/portfolio-itom/src/components/canvas/rooms/About/InfiniteSkyManager.jsx)

### 2. 修复 The Studio 中点击后显示器的表现
- [X] 调试 `StudioRoom.jsx` 中的 `handleMonitorClick` — 相机并非总能正确居中显示器
- [X] 检查 `openOverlay(item)` 是否确实以正确数据打开了 overlay
- [X] 在移动端与桌面端测试 — 不同的 `responsiveParams`
- [X] 修复 `GlobalOverlay.jsx` — `ContentCard` 若未能正确显示内容
- **相关文件：** [StudioRoom.jsx](file:///c:/Users/tomsz/Desktop/portfolio/portfolio-itom/src/components/canvas/rooms/Studio/StudioRoom.jsx), [GlobalOverlay.jsx](file:///c:/Users/tomsz/Desktop/portfolio/portfolio-itom/src/components/ui/GlobalOverlay.jsx)

---

## 🟠 优先级 2 — 关键优化（视觉与 UX）

### 3. 打磨 About 室纹理与奖项展示
- [X] 检查现有纹理（SOTY, SOTD, SOTM, FEATURED）的可读性 — 是否过小/过大
- [X] 在 `AwardsMilestone` 中修正奖项卡片的位置与尺寸
- [X] 添加"查看"动画 — 点击奖项类别 → 显示该类别下所有奖项
  - [X] 设计 UI — 画布上的弹窗/overlay 或 HTML overlay
  - [X] 添加奖项卡片的点击交互
  - [X] 用 GSAP 动画化列表展开
- **相关文件：** [InfiniteSkyManager.jsx](file:///c:/Users/tomsz/Desktop/portfolio/portfolio-itom/src/components/canvas/rooms/About/InfiniteSkyManager.jsx)

### 4. 为走廊添加装饰（目前空空如也！）
- [X] 现有装饰（`Doodles.jsx`）— 核实已渲染内容及缺失内容
- [X] 利用 `/textures/corridor/decorations/` 下的现有纹理：
  - `coffee_cup.webp`, `coffee_debug.webp`, `idea_process.webp`, `paper_airplane.webp`, `paper_ball.webp`, `pencil.webp`, `while_true_loop.webp`
- [X] 添加新元素：
  - [X] "手绘"风格的墙面相框/挂画（如设计草图）
  - [X] 带咖啡与笔记的小书桌
  - [X] 指向各房间的标识/箭头
  - [X] 盆栽植物（纸艺/草图风格）
  - [X] 书架（带纹理的细长矩形）
  - [X] 语录牌（励志/程序员主题）
- [X] 将装饰分布于走廊两侧
- [X] 添加微妙动画（漂浮、脉冲）
- **相关文件：** [Corridor.jsx](file:///c:/Users/tomsz/Desktop/portfolio/portfolio-itom/src/components/canvas/corridor/Corridor.jsx), [Doodles.jsx](file:///c:/Users/tomsz/Desktop/portfolio/portfolio-itom/src/components/canvas/corridor/Doodles.jsx), [CorridorWalls.jsx](file:///c:/Users/tomsz/Desktop/portfolio/portfolio-itom/src/components/canvas/corridor/CorridorWalls.jsx)

### 4.5 细节扩充与房间活化（音频组指导意见）
- [ ] **The Gallery：** 添加背景中动画化的小细节，让场景更有生气（如烟囱冒烟、移动的起重机、飞翔的鸟）。
- [ ] **Corridor：** 为墙上空白的画作/相框补充相应图形。
- [X] **The Studio：** 更新点击显示器后右侧弹出的 UI（HTML），为显示器添加缩略图并嵌入真实视频。
- [ ] **About：** 优化云朵（使其更好看）并移除星星。为气球添加交互：点击气球后破裂，露出"Skills"板块中技术的完整名称。
- [ ] **Contact：** 丰富空旷的环境（目前仅有海与木桶）：添加背景中的极简波浪、地平线上的小岛以及天空中的云朵。

### 5. 改进图形 — 可读性与背景细节的平衡
- [X] About 室：检查云朵背景下文字（里程碑）的对比度
- [X] Gallery 室：确保项目卡片在房屋与绳索背景下清晰可读
- [X] Studio 室：检查显示器上的信息是否清晰
- [X] Contact 室：确保联系方式选项突出显示
- [X] 走廊：门牌标识清晰可见，装饰不过于喧宾夺主
- [X] 添加景深 — 重要元素更高不透明度，背景更低
- **相关文件：** 所有房间（About, Studio, Gallery, Contact）

### 6. 交互元素：B&W → 悬停变彩色
- [X] 设计着色器/材质切换：交互元素默认灰度显示
- [X] 悬停时 → 动画过渡到全彩（GSAP 或着色器 uniform）
- [X] 目标元素：
  - [X] 走廊中的门（房间标识）
  - [X] Studio 中的显示器
  - [X] Gallery 中的项目卡片
  - [X] Contact 中的社交媒体木桶
  - [X] About 中的奖项卡片
- [X] 方案：将 `saturation` uniform 从 0 动画至 1
- **相关文件：** 新实用工具 + 修改所有房间

---

## 🟡 优先级 3 — 新功能

### 7. 添加用户引导教程
- [X] 确定形式：
  - **方案 A：** 首次进入时的工具提示（如 About 中的"滚动飞行"）
  - **方案 B：** 3-4 秒后出现的提示气泡
  - **方案 C：** 角落带"?"的帮助图标，描述交互方式
- [X] 按房间的引导：
  - [X] **Corridor：** "点击门进入" + "使用地图传送"
  - [X] **About：** "滚动穿越我的故事"
  - [X] **Studio：** "拖拽旋转 • 滚动浏览 • 点击查看"
  - [X] **Gallery：** "滚动浏览 • 点击查看"
  - [X] **Contact：** "选择联系方式"
- [X] 仅在首次显示（localStorage）
- [X] 进出场动画（淡入 + 滑动）
- **相关文件：** 新 UI 组件

### 8. 添加音效（最后做）
- [X] `AudioManager.jsx` 已就绪 — 具备 `play()`、`stop()`、`fade()`、音量控制
- [X] 待添加音效列表：
  - [X] **环境音：** 安静的背景循环（纸张、风声？）
  - [X] **Corridor：** 脚步声 / 拖沓声
  - [X] **门：** 开/关门声
  - [X] **About：** 飞行时的风声、云朵处的 whoosh
  - [X] **Studio：** 电子设备的嗡鸣、选择显示器时的点击声
  - [X] **Gallery：** 绳索上纸张/衣物的沙沙声
  - [X] **Contact：** 海浪声、扔瓶子时的水花声
  - [X] **UI：** 悬停音效、传送 swoosh 音
- [X] 创建 `/public/sounds/` 文件夹
- [X] 添加 UI 开关（已存在 `AudioControls.jsx`）
- **相关文件：** [AudioManager.jsx](file:///c:/Users/tomsz/Desktop/portfolio/portfolio-itom/src/context/AudioManager.jsx), [AudioControls.jsx](file:///c:/Users/tomsz/Desktop/portfolio/portfolio-itom/src/components/ui/AudioControls.jsx)

### 9. 彩蛋与细节
- [ ] Konami 代码？秘密房间？
- [ ] 点击 About 中的头像 → 表情变化动画
- [ ] 多次点击纸飞机 → 循环/旋转
- [ ] 走廊中某处的隐藏元素（如图画下方）
- [ ] 秘密模式：暗黑模式开关（整个世界 B&W → 反相）
- [ ] 进度条/计数器："你已发现 X/Y 个秘密"
- [ ] 点击走廊中的咖啡 → 蒸汽动画
- [ ] 走廊某处的"404"门 → 有趣的动画
- **相关文件：** 视创意而定 — 多处

---

## 🟢 优先级 4 — 打磨与优化

### 10. 改进 Studio 中的内容数据
- [X] 补全真实 URL（YouTube, Blog, TikTok）
- [X] 添加缩略图（真实图片或生成图片）
- [X] 更新日期与指标数据
- **相关文件：** [contentData.js](file:///c:/Users/tomsz/Desktop/portfolio/portfolio-itom/src/components/canvas/rooms/Studio/contentData.js)

### 11. 性能与响应式
- [ ] 移动端审查（尤其 About — 大量云朵 + 里程碑）
- [ ] 检查 `PerformanceContext.jsx` — 在弱设备上降低画质
- [ ] 测试向所有房间的传送 — 无闪烁
- [ ] 检查内存泄漏（useFrame 中不断创建 `new THREE.Vector3()`！）
  - `InfiniteSkyManager.jsx` 第 155-157, 470-471, 710-711 行 — 每帧新建 Vector3！
  - `SkyChunk.jsx` 第 145 行 — 每帧 `new THREE.Vector3()`
- [ ] LOD（细节层次）— 远离相机时减少云朵/涂鸦数量

### 12. 无障碍与 SEO（A11y 整改计划 🚨）
- [X] **A1 — 3D 键盘导航：** ~~在 `useInfiniteCamera.js` 中添加 `keydown` 监听（方向键、空格、PgUp/PgDn）并映射为滚动。~~ ✅ 已完成
- [X] **A2 — 空格激活 Contact：** ~~修复焦点管理 — 地图关闭时 pin-slot 按钮设为 `tabIndex={-1}`。~~ ✅ 已被 A3 修复（inert 阻断焦点）
- [X] **A3 — 关闭菜单后的 Tab 顺序：** ~~在 `NavigationUI.jsx` 中为关闭状态的面板（地图、音频、成就）添加 `inert`。~~ ✅ 已完成
- [X] **A4 — 地图焦点陷阱：** ~~打开后自动聚焦关闭按钮 + 处理 `Escape` + 焦点陷阱（Tab 回到首个元素）。~~ ✅ 已完成
- [X] **A5 — 滑块的 Aria 标签：** ~~为 Music/SFX 滑块添加 `aria-label` 与 `aria-valuetext`。~~ ✅ 已完成
- [X] **A6 — 地图悬停区改为 `<button>`：** ~~在 `NavigationUI.jsx` 中将 `<div>` 悬停区替换为带 `aria-label` 与 `onFocus/onBlur` 的 `<button>`。~~ ✅ 已完成
- [X] **A7 — Canvas 的 SR 兜底：** ~~创建隐藏 HTML 层，包含对应 3D 交互元素的按钮。~~ ✅ 已完成
- [ ] **响应式（移动端）：** 在小屏幕上修正相机的 FOV/Z 位置，视口裁切了场景。
- [ ] **加载优化：** 点击门后添加视觉反馈（spinner）+ 预加载最近房间的纹理。
- [X] **SEO Meta 标签：** ~~添加 title、description、OG、Twitter Card、JSON-LD、canonical、noscript 兜底。~~ ✅ 已完成
- [X] **Meta 标签与 OG 图片：** 在 `index.html` 中添加 `<meta description>`、Open Graph 标签、Twitter Card。 ✅ 已完成（通过构建期插件完全动态化）
- [ ] 预加载器显示资源加载百分比（已有 `Preloader.jsx`，可能需更新）

### 13. 动画与微交互
- [ ] 悬停交互元素时的自定义光标（位于 `/public/cursors/`）
- [ ] 房间背景的视差效果（已有 `useMouseParallax.js` hook）
- [ ] 平滑页面过渡 — 纸张纹理过渡（已有 `PaperTransition.jsx`）
- [ ] 添加微妙的粒子效果（走廊中的尘埃？About 中的萤火虫？）

### 14. 代码质量与性能
- [X] **P1 — useFrame 中的 `new THREE.Vector3()`：** ~~移至模块级常量。~~ ✅ 已完成（4 个文件）
- [X] **P2 — useFrame 中的 `setState`（SkillsMilestone）：** ~~替换为 `useRef` + 命令式更新。~~ ✅ 已完成
- [X] **P3 — 生产环境 `console.log`：** ~~已删除 `StudioRoom.jsx:49,338,389`。~~ ✅ 已完成
- [X] **P4 — 死代码 hook `useCorridorCamera`：** ~~无任何地方导入 → 已删除。~~ ✅ 已完成
- [X] **P5 — 生产环境导入 `r3f-perf`：** ~~`App.jsx:4` → 已移除导入。~~ ✅ 已完成

---

## 📊 代码分析的额外观察

| 问题 | 详情 | 优先级 |
|---------|-----------|-----------|
| `contentData.js` — 占位数据 | 所有 URL、缩略图均为 null，为示例数据 | 🟠 |
| `Doodles.jsx` — 310 行但可能未完全渲染 | 检查 `SketchElement`、`AnimatedStar`、`ThoughtBubble` 等是否激活 | 🟡 |
| `AudioManager.jsx` — fade() 为桩函数 | `fade()` 立即暂停而非逐渐减小音量 | 🟡 |
| Gallery 缺少纹理 | 项目卡片可能没有真实截图 | 🟠 |

---

## ⏱ 建议的工作顺序

```
第 1 周：#1（云朵） → #2（显示器） → #4（走廊装饰）
第 2 周：#3（奖项） → #5（图形可读性） → #6（B&W→彩色悬停）
第 3 周：#7（教程） → #10（真实内容） → #11（性能）
第 4 周：#9（彩蛋） → #13（微交互） → #8（音效）
最后：#12（无障碍） → 最终 QA
```
