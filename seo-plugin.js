import { projects as localProjects } from './src/data/projects.js';
import { studioContent as localStudioContent } from './src/data/studioContent.js';
import { awards as localAwards } from './src/data/awards.js';

// ==== 本地数据适配（不再请求 Sanity CMS） ====

// techStack 在数据文件中是完整纹理路径，SEO 构建器期望的是文件名（用于 TECH_STACK_NAMES 映射）
const projects = localProjects.map(p => ({
    ...p,
    techStack: (p.techStack || []).map(path => path.split('/').pop()),
}));

const studio = localStudioContent;

// awards 按分类分组，SEO 构建器期望的是扁平数组 [{ category, title, date, url }]
const awards = [
    ...(localAwards.sotd?.items || []).map(item => ({ category: 'sotd', title: item.label, date: item.date, url: item.url })),
    ...(localAwards.sotm?.items || []).map(item => ({ category: 'sotm', title: item.label, date: item.date, url: item.url })),
    ...(localAwards.other?.items || []).map(item => ({ category: 'other', title: item.label, date: item.date, url: item.url })),
];

const globalInfo = null;
const faqList = null;

// Tech stack filename -> human-readable name mapping for JSON-LD
const TECH_STACK_NAMES = {
    'reactlogo.webp': 'React',
    'htmllogo.webp': 'HTML',
    'csslogo.webp': 'CSS',
    'jslogo.webp': 'JavaScript',
    'tailwindlogo.webp': 'Tailwind CSS',
    'firebaselogo.webp': 'Firebase',
    'netlifylogo.webp': 'Netlify',
    'wordpresslogo.webp': 'WordPress',
    'elementorlogo.webp': 'Elementor',
    'phplogo.webp': 'PHP',
};

/**
 * Helper to ensure dates are in ISO-8601 format with timezone for SEO.
 */
function formatIsoDate(dateString) {
    if (!dateString) return undefined;
    if (dateString.includes('T')) return dateString; // Already has time/timezone
    return `${dateString}T12:00:00Z`; // Default to noon UTC
}

/**
 * Build dynamic JSON-LD structured data from Sanity content.
 * This generates schema.org entities that AI search engines (Google AI Overviews,
 * Perplexity, Gemini) use to understand and cite content in their answers.
 */
function buildJsonLd(globalInfo, projects, studio, awards, faqList) {
    const graph = [];

    // --- 1. Person: Central node of the Knowledge Graph ---
    const person = {
        '@type': 'Person',
        '@id': 'https://me.wutongshuai.com/#person',
        name: '吴桐',
        alternateName: ['吴桐', 'WU TONG'],
        url: 'https://me.wutongshuai.com',
        jobTitle: 'AI 自媒体创作者',
        description: globalInfo?.aboutMe || '专注 AI 自媒体与内容创作的创作者，研究 AI 工具、内容选题与多平台分发，也做像素动画科普。',
        knowsAbout: ['AI 自媒体', '内容创作', '像素动画', 'React', 'Three.js', 'JavaScript', 'GSAP', 'WebGL', 'Godot'],
        sameAs: [
            globalInfo?.linkedinUrl,
            globalInfo?.githubUrl,
            globalInfo?.instagramUrl,
            globalInfo?.xUrl,
            globalInfo?.tiktokUrl,
            globalInfo?.youtubeUrl
        ].filter(Boolean)
    };
    graph.push(person);

    // --- 2. WebSite ---
    const website = {
        '@type': 'WebSite',
        '@id': 'https://me.wutongshuai.com/#website',
        url: 'https://me.wutongshuai.com',
        name: globalInfo?.siteTitle || '吴桐 | AI 自媒体创作者 · 3D 交互作品集',
        description: globalInfo?.siteDescription || '吴桐的 3D 交互作品集：AI 自媒体创作、像素动画科普与内容创作项目。',
        publisher: { '@id': 'https://me.wutongshuai.com/#person' }
    };
    graph.push(website);

    // --- 3. ProfilePage ---
    const profilePage = {
        '@type': 'ProfilePage',
        '@id': 'https://me.wutongshuai.com/#profilepage',
        url: 'https://me.wutongshuai.com',
        mainEntity: { '@id': 'https://me.wutongshuai.com/#person' },
        about: { '@id': 'https://me.wutongshuai.com/#person' }
    };
    graph.push(profilePage);

    // --- 4. FAQPage (GEO & AI search engine optimizer) ---
    if (faqList && faqList.length > 0) {
        const faqPage = {
            '@type': 'FAQPage',
            '@id': 'https://me.wutongshuai.com/#faq',
            mainEntity: faqList.map(item => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer
                }
            }))
        };
        graph.push(faqPage);
    }

    // --- 5. ItemList: Portfolio Projects (Google rich results for lists) ---
    if (projects && projects.length > 0) {
        graph.push({
            '@type': 'ItemList',
            '@id': 'https://me.wutongshuai.com/#projectslist',
            name: '吴桐的精选项目',
            description: 'AI 自媒体、像素动画科普与内容创作方向的精选项目，展示 React、Three.js 与创意前端实践。',
            numberOfItems: projects.length,
            itemListElement: projects.map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                    '@type': 'CreativeWork',
                    name: p.seoTitle || p.title,
                    description: p.seoDescription || p.description || '',
                    url: p.url || undefined,
                    creator: { '@id': 'https://me.wutongshuai.com/#person' },
                    ...(p.techStack && p.techStack.length > 0 ? {
                        keywords: p.techStack.map(t => TECH_STACK_NAMES[t] || t).join(', ')
                    } : {}),
                }
            }))
        });

        // Individual CreativeWork entries for each project (richer detail)
        projects.forEach(p => {
            // 中文标题无法生成可读 slug，优先使用数据文件中的 id 字段兜底
            const projectSlug = (p.id || p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'project';
            graph.push({
                '@type': 'CreativeWork',
                '@id': `https://me.wutongshuai.com/#project-${projectSlug}`,
                name: p.seoTitle || p.title,
                description: p.seoDescription || p.description || '',
                url: p.url || undefined,
                creator: { '@id': 'https://me.wutongshuai.com/#person' },
                ...(p.techStack && p.techStack.length > 0 ? {
                    keywords: p.techStack.map(t => TECH_STACK_NAMES[t] || t).join(', ')
                } : {}),
            });
        });
    }

    // --- 6. Studio Content ---
    if (studio && studio.length > 0) {
        studio.forEach((s, idx) => {
            const studioSlug = `studio-item-${idx}`;
            if (s.platform === 'youtube') {
                let embedUrl = undefined;
                if (s.url) {
                    const ytMatch = s.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
                    if (ytMatch && ytMatch[1]) {
                        embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
                    }
                }

                graph.push({
                    '@type': 'VideoObject',
                    '@id': `https://me.wutongshuai.com/#${studioSlug}`,
                    name: s.seoTitle || s.title,
                    description: s.seoDescription || s.description || '',
                    url: s.url || undefined,
                    contentUrl: s.url || undefined,
                    ...(embedUrl ? { embedUrl } : {}),
                    thumbnailUrl: s.thumbnailUrl || 'https://me.wutongshuai.com/og-image.webp',
                    ...(s.duration ? { duration: `PT${s.duration.replace(':', 'M')}S` } : {}),
                    ...(s.date ? { uploadDate: formatIsoDate(s.date) } : {}),
                    ...(s.views ? { interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/WatchAction', userInteractionCount: s.views } } : {}),
                    author: { '@id': 'https://me.wutongshuai.com/#person' },
                });
            } else if (s.platform === 'blog') {
                graph.push({
                    '@type': 'Article',
                    '@id': `https://me.wutongshuai.com/#${studioSlug}`,
                    headline: s.seoTitle || s.title,
                    description: s.seoDescription || s.description || '',
                    url: s.url || undefined,
                    image: s.thumbnailUrl || 'https://me.wutongshuai.com/og-image.webp',
                    ...(s.date ? { datePublished: formatIsoDate(s.date) } : {}),
                    ...(s.readTime ? { timeRequired: `PT${s.readTime.replace(' min', '')}M` } : {}),
                    author: { '@id': 'https://me.wutongshuai.com/#person' },
                });
            } else if (s.platform === 'tiktok') {
                graph.push({
                    '@type': 'VideoObject',
                    '@id': `https://me.wutongshuai.com/#${studioSlug}`,
                    name: s.seoTitle || s.title,
                    description: s.seoDescription || s.description || '',
                    url: s.url || undefined,
                    contentUrl: s.url || undefined,
                    thumbnailUrl: s.thumbnailUrl || 'https://me.wutongshuai.com/og-image.webp',
                    ...(s.date ? { uploadDate: formatIsoDate(s.date) } : {}),
                    ...(s.views ? { interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/WatchAction', userInteractionCount: s.views } } : {}),
                    ...(s.likes ? { aggregateRating: { '@type': 'AggregateRating', ratingCount: s.likes } } : {}),
                    author: { '@id': 'https://me.wutongshuai.com/#person' },
                });
            } else if (s.platform === 'instagram' || s.platform === 'x' || s.platform === 'linkedin') {
                graph.push({
                    '@type': 'SocialMediaPosting',
                    '@id': `https://me.wutongshuai.com/#${studioSlug}`,
                    headline: s.seoTitle || s.title,
                    description: s.seoDescription || s.description || '',
                    url: s.url || undefined,
                    image: s.thumbnailUrl || 'https://me.wutongshuai.com/og-image.webp',
                    ...(s.date ? { datePublished: formatIsoDate(s.date) } : {}),
                    ...(s.likes ? { interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: s.likes } } : {}),
                    author: { '@id': 'https://me.wutongshuai.com/#person' },
                });
            } else if (s.platform === 'codrops') {
                graph.push({
                    '@type': 'Article',
                    '@id': `https://me.wutongshuai.com/#${studioSlug}`,
                    headline: s.seoTitle || s.title,
                    description: s.seoDescription || s.description || '',
                    url: s.url || undefined,
                    image: s.thumbnailUrl || 'https://me.wutongshuai.com/og-image.webp',
                    ...(s.date ? { datePublished: formatIsoDate(s.date) } : {}),
                    author: { '@id': 'https://me.wutongshuai.com/#person' },
                });
            } else if (s.platform === 'activity' || s.platform === 'video') {
                graph.push({
                    '@type': 'VideoObject',
                    '@id': `https://me.wutongshuai.com/#${studioSlug}`,
                    name: s.seoTitle || s.title,
                    description: s.seoDescription || s.description || '',
                    url: s.url || undefined,
                    contentUrl: s.url || undefined,
                    thumbnailUrl: s.thumbnail || s.thumbnailUrl || 'https://me.wutongshuai.com/og-image.webp',
                    ...((s.sortDate || s.date) ? { uploadDate: formatIsoDate(s.sortDate || s.date) } : {}),
                    author: { '@id': 'https://me.wutongshuai.com/#person' },
                });
            } else if (s.platform === 'vibe-coding') {
                graph.push({
                    '@type': 'CreativeWork',
                    '@id': `https://me.wutongshuai.com/#${studioSlug}`,
                    name: s.seoTitle || s.title,
                    description: s.seoDescription || s.description || '',
                    url: s.url || undefined,
                    image: s.thumbnail || s.thumbnailUrl || 'https://me.wutongshuai.com/og-image.webp',
                    ...((s.sortDate || s.date) ? { datePublished: formatIsoDate(s.sortDate || s.date) } : {}),
                    keywords: 'Vibe Coding, AI Coding, 产品作品',
                    creator: { '@id': 'https://me.wutongshuai.com/#person' },
                });
            }
        });
    }

    // --- 7. Awards as schema.org Award/CreativeWork ---
    if (awards && awards.length > 0) {
        const categoryLabels = { sotd: '每日精选', sotm: '月度精选', other: '其他荣誉' };
        graph.push({
            '@type': 'ItemList',
            '@id': 'https://me.wutongshuai.com/#awardslist',
            name: '吴桐获得的创作与设计奖项',
            numberOfItems: awards.length,
            itemListElement: awards.map((a, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                    '@type': 'CreativeWork',
                    name: `${categoryLabels[a.category] || a.category} — ${a.seoTitle || a.title}`,
                    ...(a.date ? { dateCreated: formatIsoDate(a.date) } : {}),
                    url: a.url || undefined,
                    description: a.seoDescription || undefined,
                    award: categoryLabels[a.category] || a.category,
                    creator: { '@id': 'https://me.wutongshuai.com/#person' },
                }
            }))
        });
    }

    return {
        '@context': 'https://schema.org',
        '@graph': graph
    };
}

// Helper to generate the llms.txt content in clean Markdown
function buildLlmsTxt(globalInfo, projects, studio, awards, faqList) {
    const siteTitle = globalInfo?.siteTitle || '吴桐 | AI 自媒体创作者 · 3D 交互作品集';
    const siteDescription = globalInfo?.siteDescription || '吴桐的 3D 交互作品集：AI 自媒体创作、像素动画科普与内容创作项目。';
    const aboutMe = globalInfo?.aboutMe || '吴桐，三年设计经验，当前定位 AI 设计师，正在往成为一名前沿 AI 独立开发者的路上努力。Base 长沙，现在主要工作是运营工作室、打比赛和做自媒体。';

    let content = `# ${siteTitle}\n`;
    content += `> ${siteDescription}\n\n`;

    content += `## 关于我\n`;
    content += `${aboutMe}\n\n`;

    content += `## 核心技术栈与技能\n`;
    content += `- React, Three.js, React Three Fiber (R3F), GSAP, JavaScript, TypeScript, WebGL, Godot, AI 工具与内容创作工作流。\n\n`;

    if (projects && projects.length > 0) {
        content += `## 精选项目\n`;
        projects.forEach(p => {
            const tech = p.techStack ? `（技术栈：${p.techStack.map(t => TECH_STACK_NAMES[t] || t).join(', ')}）` : '';
            content += `- [${p.seoTitle || p.title}](${p.url || 'https://me.wutongshuai.com'}): ${p.seoDescription || p.description || ''}${tech}\n`;
        });
        content += `\n`;
    }

    if (studio && studio.length > 0) {
        content += `## 创作室内容与文章\n`;
        studio.forEach(s => {
            content += `- [${s.seoTitle || s.title}（${s.categoryLabel || s.platform}）](${s.url || 'https://me.wutongshuai.com'}): ${s.seoDescription || s.description || ''}\n`;
        });
        content += `\n`;
    }

    if (awards && awards.length > 0) {
        content += `## 奖项与荣誉\n`;
        const categoryLabels = { sotd: '每日精选', sotm: '月度精选', other: '其他荣誉' };
        awards.forEach(a => {
            const category = categoryLabels[a.category] || a.category;
            content += `- **${category}** — [${a.seoTitle || a.title}](${a.url || 'https://me.wutongshuai.com'}): 获奖日期 ${a.date || '未知'}。${a.seoDescription || ''}\n`;
        });
        content += `\n`;
    }

    if (faqList && faqList.length > 0) {
        content += `## 常见问题（FAQ）\n`;
        faqList.forEach(item => {
            content += `- **${item.question}**\n`;
            content += `  ${item.answer.replace(/\n/g, '\n  ')}\n`;
        });
    }

    return content;
}

export function generateSeoHtml() {
    let cachedLlmsContent = '';

    function getLlmsContent() {
        if (!cachedLlmsContent) {
            try {
                cachedLlmsContent = buildLlmsTxt(globalInfo, projects, studio, awards, faqList);
            } catch (e) {
                console.error('SEO Plugin Error: Failed to build llms.txt from local data', e);
                cachedLlmsContent = `# 吴桐\n> AI 自媒体创作者\n`;
            }
        }
        return cachedLlmsContent;
    }

    return {
        name: 'sanity-seo-plugin',

        // Serve llms.txt in local development mode
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (req.url === '/llms.txt') {
                    const content = await getLlmsContent();
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.end(content);
                } else {
                    next();
                }
            });
        },

        // This hook runs when Vite generates or serves index.html
        async transformIndexHtml(html) {
            try {
                // 使用本地数据构建 SEO 内容（不再请求 Sanity CMS）

                // Fallback values if globalInfo is not yet created in Sanity
                const siteTitle = globalInfo?.siteTitle || '吴桐 | AI 自媒体创作者 · 3D 交互作品集';
                const siteDescription = globalInfo?.siteDescription || '吴桐的 3D 交互作品集：AI 自媒体创作、像素动画科普与内容创作项目。';
                const aboutMe = globalInfo?.aboutMe || '吴桐，三年设计经验，当前定位 AI 设计师，正在往成为一名前沿 AI 独立开发者的路上努力。Base 长沙，现在主要工作是运营工作室、打比赛和做自媒体。';

                // Cache llms.txt content for later bundle emission
                cachedLlmsContent = buildLlmsTxt(globalInfo, projects, studio, awards, faqList);

                // ====== PART 1: Build the semantic HTML string ======
                let seoHtml = `\n<div id="seo-content" class="sr-only-seo">\n`;
                
                seoHtml += `  <header>\n`;
                seoHtml += `    <h1>${siteTitle}</h1>\n`;
                seoHtml += `    <p>${siteDescription}</p>\n`;
                seoHtml += `  </header>\n`;

                seoHtml += `  <section id="about">\n`;
                seoHtml += `    <h2>关于我</h2>\n`;
                seoHtml += `    <p>${aboutMe}</p>\n`;
                if (globalInfo?.githubUrl) seoHtml += `    <a href="${globalInfo.githubUrl}">GitHub</a>\n`;
                if (globalInfo?.linkedinUrl) seoHtml += `    <a href="${globalInfo.linkedinUrl}">LinkedIn</a>\n`;
                seoHtml += `  </section>\n`;

                if (projects && projects.length > 0) {
                    seoHtml += `  <section id="projects">\n    <h2>项目</h2>\n    <ul>\n`;
                    projects.forEach(p => {
                        seoHtml += `      <li>\n        <h3>${p.seoTitle || p.title}</h3>\n        <p>${p.seoDescription || p.description || ''}</p>\n        ${p.url ? `<a href="${p.url}">查看 ${p.seoTitle || p.title}</a>\n` : ''}      </li>\n`;
                    });
                    seoHtml += `    </ul>\n  </section>\n`;
                }

                if (studio && studio.length > 0) {
                    seoHtml += `  <section id="studio">\n    <h2>创作室（内容）</h2>\n    <ul>\n`;
                    studio.forEach(s => {
                        seoHtml += `      <li>\n        <h3>${s.seoTitle || s.title}（${s.categoryLabel || s.platform}）</h3>\n        <p>${s.seoDescription || s.description || ''}</p>\n        ${s.url ? `<a href="${s.url}">查看内容</a>\n` : ''}      </li>\n`;
                    });
                    seoHtml += `    </ul>\n  </section>\n`;
                }

                if (awards && awards.length > 0) {
                    seoHtml += `  <section id="awards">\n    <h2>奖项与荣誉</h2>\n    <ul>\n`;
                    awards.forEach(a => {
                        seoHtml += `      <li>\n        <h3>${a.seoTitle || a.title}</h3>\n        <p>${a.category} - ${a.date}</p>\n        <p>${a.seoDescription || ''}</p>\n        ${a.url ? `<a href="${a.url}">链接</a>\n` : ''}      </li>\n`;
                    });
                    seoHtml += `    </ul>\n  </section>\n`;
                }

                // FAQ Section (GEO/AI search optimizer fallback)
                if (faqList && faqList.length > 0) {
                    seoHtml += `  <section id="faq">\n`;
                    seoHtml += `    <h2>常见问题（FAQ）</h2>\n`;
                    faqList.forEach(item => {
                        seoHtml += `    <article>\n`;
                        seoHtml += `      <h3>${item.question}</h3>\n`;
                        seoHtml += `      <p>${item.answer}</p>\n`;
                        seoHtml += `    </article>\n`;
                    });
                    seoHtml += `  </section>\n`;
                }

                seoHtml += `</div>\n`;

                // ====== PART 2: Build dynamic JSON-LD ======
                const jsonLdSchemas = buildJsonLd(globalInfo, projects, studio, awards, faqList);
                const jsonLdScript = `\n  <!-- Dynamic Structured Data (JSON-LD) — generated from local data at build time -->\n  <script type="application/ld+json">\n${JSON.stringify(jsonLdSchemas, null, 2)}\n  </script>\n`;

                // ====== PART 3: Transform HTML ======
                // Update the <title> tag
                let transformedHtml = html.replace(
                    /<title>(.*?)<\/title>/,
                    `<title>${siteTitle}</title>`
                );
                
                // Add or replace meta description
                if (transformedHtml.includes('<meta name="description"')) {
                    transformedHtml = transformedHtml.replace(
                        /<meta name="description" content="(.*?)"\s*\/?>/,
                        `<meta name="description" content="${siteDescription}" />`
                    );
                } else {
                    transformedHtml = transformedHtml.replace(
                        '</head>',
                        `  <meta name="description" content="${siteDescription}" />\n</head>`
                    );
                }

                // Update Open Graph dynamic metadata
                transformedHtml = transformedHtml
                    .replace(
                        /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
                        `<meta property="og:title" content="${siteTitle}" />`
                    )
                    .replace(
                        /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
                        `<meta property="og:description" content="${siteDescription}" />`
                    );

                // Update Twitter card dynamic metadata
                transformedHtml = transformedHtml
                    .replace(
                        /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
                        `<meta name="twitter:title" content="${siteTitle}" />`
                    )
                    .replace(
                        /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
                        `<meta name="twitter:description" content="${siteDescription}" />`
                    );

                // Inject dynamic JSON-LD right before </head> (next to the existing static one)
                transformedHtml = transformedHtml.replace('</head>', `${jsonLdScript}</head>`);

                // Replace the static placeholder with the dynamic one to prevent duplicate #seo-content and double h1s
                if (transformedHtml.includes('id="seo-content"')) {
                    transformedHtml = transformedHtml.replace(
                        /<div id="seo-content" class="sr-only-seo">[\s\S]*?<\/div>/,
                        seoHtml
                    );
                } else {
                    // Fallback injection if the template doesn't contain the static block
                    transformedHtml = transformedHtml.replace('</body>', `${seoHtml}</body>`);
                }

                return transformedHtml;
            } catch (error) {
                console.error('SEO Plugin Error: Failed to build SEO content from local data', error);
                // Return original HTML on failure so we don't break the build
                return html;
            }
        },

        // Emit llms.txt to the build output directory
        async generateBundle() {
            const content = await getLlmsContent();
            this.emitFile({
                type: 'asset',
                fileName: 'llms.txt',
                source: content
            });
        }
    };
}
