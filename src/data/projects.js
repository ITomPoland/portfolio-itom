/**
 * 本地项目数据（Gallery 房间）
 *
 * 字段结构 = 消费方（GalleryRoom / ScreenReaderOverlay / seo-plugin）要求的最终形态：
 * - front / painted：指向本地项目卡的线稿版与淡水彩版
 * - techStack：直接指向最终展示纹理，路径必须在 public/assets/gallery/ 下真实存在
 */

export const projects = [
    {
        id: 'ai-studio',
        title: 'AI 工作室介绍',
        url: 'https://my.feishu.cn/wiki/E1OfwwHPUiiIntkbpHMc2ir3n7b?from=from_copylink',
        description:
            '我的 AI 工作室：把 AI 工具、设计能力与内容创作整合成一套高效工作流，一个人也能完成从前到后的交付。涵盖设计服务、自媒体内容与参赛作品的生产，是我目前的主阵地。',
        front: '/assets/gallery/project-front-1.webp',
        painted: '/assets/gallery/project-painted-1.webp',
        techStack: [
            '/assets/gallery/sage/skill1logo.webp',
            '/assets/gallery/sage/skill2logo.webp',
            '/assets/gallery/sage/skill3logo.webp',
            '/assets/gallery/sage/skill4logo.webp',
        ],
    },
    {
        id: 'gaokao-consult',
        title: '高考志愿填报',
        url: 'https://my.feishu.cn/wiki/IFbywQfhVi6bORkxZ0Oc45icngh?from=from_copylink',
        description:
            '为高考考生与家长提供志愿填报咨询服务：结合 AI 工具与最新招生数据，帮你在院校、专业与城市之间做出更合适的选择。一对一沟通，提供清晰可执行的填报建议。',
        front: '/assets/gallery/project-front-2.webp',
        painted: '/assets/gallery/project-painted-2.webp',
        techStack: [
            '/assets/gallery/sage/gaokao1logo.webp',
            '/assets/gallery/sage/gaokao2logo.webp',
            '/assets/gallery/sage/gaokao3logo.webp',
            '/assets/gallery/sage/gaokao4logo.webp',
        ],
    },
    {
        id: '2027-job-report',
        title: 'AI 编程',
        url: 'https://github.com/wtgjx',
        description:
            '面向应届生与转行者的公开研究报告：汇总 AI 时代内容创作与开发岗位的新趋势、薪资区间与技能要求，用可视化图表呈现数据。报告每月更新一次，所有数据来源均公开可查。',
        front: '/assets/gallery/project-front-3.webp',
        painted: '/assets/gallery/project-painted-3.webp',
        techStack: [
            '/assets/gallery/sage/aicode1logo.webp',
            '/assets/gallery/sage/aicode2logo.webp',
            '/assets/gallery/sage/aicode3logo.webp',
            '/assets/gallery/sage/aicode4logo.webp',
        ],
    },
    {
        id: 'about-wutong',
        title: '关于我',
        description: '很高兴认识你，我是吴桐\nNice to meet you. I’m Wu Tong.',
        front: '/textures/paper-texture.webp',
        photo: '/assets/gallery/wutong-profile-landscape.png',
        signature: '/assets/gallery/wutong-intro-handwriting.png',
        layout: 'profile',
        hideFrontTitle: true,
        techStack: [],
    },
];
