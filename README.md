# 🎨 吴桐 · AI 自媒体创作者 3D 作品集

<div align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-0.182-black?style=for-the-badge&logo=threedotjs" alt="Three.js" />
  <img src="https://img.shields.io/badge/R3F-9.4-purple?style=for-the-badge&logo=react" alt="React Three Fiber" />
  <img src="https://img.shields.io/badge/GSAP-3.14-green?style=for-the-badge&logo=greensock" alt="GSAP" />
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
</div>

<br/>

「吴桐 · AI 自媒体创作者」的交互式 3D 作品集站点，基于开源项目 [portfolio-itom](https://github.com/ITomPoland/portfolio-itom)（MIT License）定制改造，内容已全部替换为中文版本。

> [!NOTE]
> 体验 3D 场景前，请在浏览器设置中开启硬件加速，以获得流畅的 60 FPS 渲染效果。

## 📖 项目简介

- 沉浸式 3D 房间漫游体验：走廊、画廊、关于、联系等多个场景房间。
- 技术栈：React 19 + Three.js + React Three Fiber（R3F）+ GSAP + Vite。
- 本地数据：文案与项目内容存放于 `src/data/`，不依赖外部 CMS，可直接修改。

## 🛠️ 本地运行

环境要求：Node.js v20 及以上。

```bash
# 1. 安装依赖（国内网络较慢时可使用镜像源）
npm install
# 或：npm install --registry=https://registry.npmmirror.com

# 2. 启动本地开发服务器
npm run dev
```

> [!IMPORTANT]
> 项目包含大量高清纹理，首次加载可能需要数秒。需要性能测试时，请使用 `npm run build && npm run preview`。

## ✏️ 内容如何替换

- 文案与作品数据：`src/data/`（`projects.js`、`awards.js`、`studioContent.js` 等）。
- 头像、作品截图、证书等个人素材：`public/images/placeholders/`。
- 站点元数据：`public/robots.txt`、`public/sitemap.xml`（部署前将占位域名 `https://example.com` 替换为真实域名）。
- 3D 场景纹理：`public/textures/`。**注意：当前场景纹理为原作者版权素材，仅限本地预览；公开部署前必须自行替换或获得原作者书面授权，详见 [ATTRIBUTION.md](ATTRIBUTION.md)。**

## 🤝 致谢与许可

- 本项目基于 [portfolio-itom](https://github.com/ITomPoland/portfolio-itom) 定制，原作者为 Tomasz "ITom" Szmajda。
- 代码依 [MIT License](LICENSE) 授权使用，保留仓库根目录的 `LICENSE` 文件即满足署名义务。
- 原作者的文案、个人肖像、作品截图等个人素材已替换为占位图；3D 房间手绘场景纹理暂保留（仅限本地使用），公开部署前请按 [ATTRIBUTION.md](ATTRIBUTION.md) 完成合规自查。
