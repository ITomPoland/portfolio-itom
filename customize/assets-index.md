# 资产索引 —— public/assets/ 各区域文件清单

> 所有内容定制中用到的静态资源已从 `public/textures/`、`public/images/`、`public/` 复制到 `public/assets/<区域>/`，代码引用路径已同步更新为 `/assets/...`。
> 原文件保留在原位置不动，未删除。

---

## about/ — 关于我房间

奖项封面、插画、兜底奖项图（SOTDAYYOUNGMULTI* 后 4 项为兜底数据，不生效但保留预加载）

| 文件 | 被引用位置 | 用途 |
| --- | --- | --- |
| `SOTY.webp` / `SOTY_painted.webp` | `InfiniteSkyManager.jsx` L502/505 | 中卡（AI荣誉）封面 + 悬停版 |
| `SOTD.webp` / `SOTD_painted.webp` | `InfiniteSkyManager.jsx` L503/506 | 左卡（校园精选）封面 + 悬停版 |
| `SOTM.webp` / `SOTM_painted.webp` | `InfiniteSkyManager.jsx` L504/507 | 右卡（社会精选）封面 + 悬停版 |
| `awatarnachmurce.webp` | `InfiniteSkyManager.jsx` L262 | 关于房间插画纹理 |
| `SOTDAYYOUNGMULTIGSAP.webp` | `InfiniteSkyManager.jsx` L438（兜底数据） | 兜底奖项图 |
| `SOTDAYYOUNGMULTICSSWINNER.webp` | `InfiniteSkyManager.jsx` L439 | 兜底奖项图 |
| `SOTDAYYOUNGMULTIORPETRON.webp` | `InfiniteSkyManager.jsx` L440 | 兜底奖项图 |
| `SOTDAYYOUNGMULTIDESIGNNOMINESS.webp` | `InfiniteSkyManager.jsx` L441 | 兜底奖项图 |

> 注意：原作者素材（button/气球/岛屿/云朵等）未迁移至此，仍使用 `/textures/about/` 路径加载。

---

## corridor/ — 走廊与入口

| 文件 | 被引用位置 | 用途 |
| --- | --- | --- |
| `avatar_window.webp` | `EntranceDoors.jsx` L78 / `texturePreloadList.js` L27 | 入口窗户画像 |
| `avatar_anim/1~9.webp` | `Avatar.jsx` L28（动态拼接） / `texturePreloadList.js` L111-119 | 走廊尽头 9 帧头像动画 |

---

## gallery/ — 作品集房间

### 项目封面（普通 + 悬停版）

| 文件 | 对应卡片 | 被引用位置 |
| --- | --- | --- |
| `project-front-1~4.webp` / `project-painted-1~4.webp` | 卡片 1~4 | `projects.js` 的 `front` / `painted` 字段 |

### 自定义技术 logo（普通 + painted）

| 文件 | 对应卡片 | 被引用位置 |
| --- | --- | --- |
| `skill1~4logo.webp` / `skill1~4logo_painted.webp` | 卡片 1（AI 工作室） | `projects.js` `techStack` |
| `gaokao1~4logo.webp` / `gaokao1~4logo_painted.webp` | 卡片 2（高考志愿填报） | `projects.js` `techStack` |
| `aicode1~4logo.webp` / `aicode1~4logo_painted.webp` | 卡片 3（AI 编程） | `projects.js` `techStack` |
| `wordpresslogo/webp` + `_painted` | 卡片 4（开源与持续学习） | `projects.js` `techStack` |
| `elementorlogo/webp` + `_painted` | 卡片 4 | `projects.js` `techStack` |
| `phplogo/webp` + `_painted` | 卡片 4 | `projects.js` `techStack` |
| `csslogo/webp` | 卡片 4 | `projects.js` `techStack` |
| `css3logo_painted.webp` | 卡片 4（悬停版，GalleryRoom 特判） | `GalleryRoom.jsx` L244/280（拼接逻辑） |

> 注意：原作者英文 logo（`reactlogo`、`jslogo`、`htmllogo` 等）及 FALLBACK 封面（`monetuneprzod` 等）未迁移至此，仍使用 `/textures/gallery/` 路径。

---

## studio/ — 创作室房间

| 文件 | 被引用位置 | 用途 |
| --- | --- | --- |
| `studio-front-1~6.webp` | `studioContent.js` 的 `frontTexture` | 6 条内容的普通封面 |
| `studio-painted-front-1~6.webp` | `studioContent.js` 的 `paintedFrontTexture` | 6 条内容的悬停版封面 |

---

## contact/ — 联系房间

| 文件 | 被引用位置 | 用途 |
| --- | --- | --- |
| `faletopdown.webp` | `ContactRoom.jsx` L115 | 海面纹理 |
| `molo.webp` | `ContactRoom.jsx` L117 | 码头纹理 |
| `latarnia.webp` | `ContactRoom.jsx` L119 | 灯塔纹理 |
| `statek.webp` | `ContactRoom.jsx` L121 | 船只纹理 |
| `beczka.webp` | `ContactRoom.jsx` L405-445（5 个桶） | 社交桶纹理 |
| `paper_form.webp` | `MessagePaper.jsx` L330 | 表单纸页纹理 |
| `send_button.webp` | `MessagePaper.jsx` L331 | 发送按钮纹理 |

---

## global/ — 全局站点资源

| 文件 | 被引用位置 | 用途 |
| --- | --- | --- |
| `favico.png` | `index.html` L7-8 | 浏览器标签页图标 |
| `og-image.webp` | `index.html` L28/38（`og:image` / `twitter:image`） | 社交分享卡片（1200×630） |

---

## placeholders/ — 证书占位图

| 文件 | 来源分类 | 被引用位置 |
| --- | --- | --- |
| `cert-1~5.webp` | 原占位图（未替换） | `awards.js` `sotm`（社会精选） |
| `cert-ai-1~7.webp` | AI荣誉 | `awards.js` `other`（AI荣誉 ×7） |
| `cert-sotd-1~15.webp` | 校园精选 | `awards.js` `sotd`（校园精选 15 张） |
| `cert-sotd-front-1~3.webp` | 校园精选·最前面 | `awards.js` `sotd`（前 3 张：国创赛/三创赛/挑战杯） |

---

## 文件存在性验证

所有 `/assets/` 引用路径（96 条）已通过扫描验证，确认 `public/assets/` 下对应文件全部存在，无缺失。