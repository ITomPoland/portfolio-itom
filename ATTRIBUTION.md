# 署名与素材合规说明（ATTRIBUTION）

本文件记录本定制项目对开源代码与第三方素材的使用归属。**在任何分发、公开部署前，请完整阅读并核对本文件。**

## 1. 项目来源与授权

本项目基于开源项目 **portfolio-itom** 定制改造：

- 原仓库：<https://github.com/ITomPoland/portfolio-itom>
- 原作者：Tomasz "ITom" Szmajda
- 代码授权：MIT License（见仓库根目录 `LICENSE` 文件）

MIT License 允许对代码进行修改、商用与再分发，前提是**保留原版权声明与许可文本**（即保留 `LICENSE` 文件，内容不得删改）。

## 2. MIT 许可证义务

使用与分发本项目代码时，必须满足以下条件：

1. 保留仓库根目录的 `LICENSE` 文件，不得删除或篡改。
2. 保留源码中原有的版权声明。
3. 再分发时随代码附带本 `ATTRIBUTION.md`（或等价的署名说明）。

## 3. 素材使用情况声明

| 类别 | 现状 | 说明 |
| --- | --- | --- |
| 代码 | ✅ 依 MIT 协议使用 | 可自由修改、商用，须保留版权声明 |
| 原文案、个人肖像、作品截图、证书等个人素材 | ✅ 已替换为占位图 | 原作者的此类个人素材已移除，不得复用 |
| 3D 房间手绘场景纹理（墙、门、家具等） | ⚠️ 暂留，仅限本地预览 | 为原作者版权素材，公开部署前必须自行替换或获得原作者书面授权 |
| 字体、音效等其他素材 | ⚠️ 需逐一确认 | 部署前请核对来源与授权情况 |

## 4. 部署前合规自查清单

在将本项目部署到公网之前，请逐项确认：

- [ ] 替换 `public/textures/` 下所有原作者手绘场景纹理（或取得原作者书面授权后再使用）。
- [ ] 将 `public/images/placeholders/` 中的占位图换成自己的真实头像、作品截图与证书。
- [ ] 将 `src/data/` 中的文案与项目数据全部改为你自己的内容。
- [ ] 保留 `LICENSE` 文件与版权声明，并按需保留本 `ATTRIBUTION.md`。
- [ ] 将 `public/sitemap.xml` 中的占位域名 `https://example.com` 替换为你的真实域名。
- [ ] 检查 `public/robots.txt`、`public/_headers` 中的域名与收录策略是否符合部署计划。
- [ ] 在站点「关于」页或页脚添加对原作者的署名致谢（例如：基于 portfolio-itom（MIT）定制，原作者 Tomasz Szmajda）。

## 5. 参考链接

- portfolio-itom 原仓库：<https://github.com/ITomPoland/portfolio-itom>
- MIT License 文本：仓库根目录 `LICENSE`；官方参考 <https://opensource.org/license/mit>
