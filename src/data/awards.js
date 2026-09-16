/**
 * 本地荣誉数据（About 房间）
 *
 * 结构 = 消费方（InfiniteSkyManager / ScreenReaderOverlay / GlobalOverlay）要求的最终形态，
 * 与原先 useSanityData 中 cache.awards 保持一致：
 * { sotd: {id, layout, title, items[], platformConfig}, sotm: {...}, other: {...} }
 * - sotd = 左边卡片（校园精选）
 * - sotm = 右边卡片（社会精选）
 * - other = 中间卡片（AI荣誉，InfiniteSkyManager 中 SOTY 按钮打开 other）
 * - items[].image：指向证书占位图（正式证书图待替换）
 * - items[].date：中文日期格式
 */

export const awards = {
    sotd: {
        id: 'award-sotd',
        layout: 'certificate_grid',
        title: '校园精选',
        items: [
            { label: '国创赛省三等奖', date: '', image: '/assets/placeholders/cert-sotd-front-1.webp', url: '/assets/placeholders/cert-sotd-front-1.webp', fit: 'contain' },
            { label: '三创赛省级一', date: '', image: '/assets/placeholders/cert-sotd-front-2.webp', url: '/assets/placeholders/cert-sotd-front-2.webp', fit: 'contain' },
            { label: '挑战杯省二', date: '', image: '/assets/placeholders/cert-sotd-front-3.webp', url: '/assets/placeholders/cert-sotd-front-3.webp', fit: 'contain' },
            { label: '校园精选 · 获奖证书 1', date: '', image: '/assets/placeholders/cert-sotd-1.webp', url: '/assets/placeholders/cert-sotd-1.webp' },
            { label: '校园精选 · 获奖证书 2', date: '', image: '/assets/placeholders/cert-sotd-2.webp', url: '/assets/placeholders/cert-sotd-2.webp' },
            { label: '校园精选 · 获奖证书 3', date: '', image: '/assets/placeholders/cert-sotd-3.webp', url: '/assets/placeholders/cert-sotd-3.webp' },
            { label: '校园精选 · 获奖证书 4', date: '', image: '/assets/placeholders/cert-sotd-4.webp', url: '/assets/placeholders/cert-sotd-4.webp' },
            { label: '校园精选 · 获奖证书 5', date: '', image: '/assets/placeholders/cert-sotd-5.webp', url: '/assets/placeholders/cert-sotd-5.webp' },
            { label: '校园精选 · 获奖证书 6', date: '', image: '/assets/placeholders/cert-sotd-6.webp', url: '/assets/placeholders/cert-sotd-6.webp' },
            { label: '校园精选 · 获奖证书 7', date: '', image: '/assets/placeholders/cert-sotd-7.webp', url: '/assets/placeholders/cert-sotd-7.webp', fit: 'contain' },
            { label: '创新体验竞赛国二', date: '', image: '/assets/placeholders/cert-sotd-8.webp', url: '/assets/placeholders/cert-sotd-8.webp' },
            { label: '创新体验竞赛省一', date: '', image: '/assets/placeholders/cert-sotd-9.webp', url: '/assets/placeholders/cert-sotd-9.webp' },
            { label: '三创赛校一等奖', date: '', image: '/assets/placeholders/cert-sotd-10.webp', url: '/assets/placeholders/cert-sotd-10.webp', fit: 'contain' },
            { label: '三好学生', date: '', image: '/assets/placeholders/cert-sotd-11.webp', url: '/assets/placeholders/cert-sotd-11.webp' },
            { label: '实习证书', date: '', image: '/assets/placeholders/cert-sotd-12.webp', url: '/assets/placeholders/cert-sotd-12.webp', fit: 'contain' },
            { label: '挑战杯省级二等奖', date: '', image: '/assets/placeholders/cert-sotd-13.webp', url: '/assets/placeholders/cert-sotd-13.webp' },
            { label: '未来设计师省三', date: '', image: '/assets/placeholders/cert-sotd-14.webp', url: '/assets/placeholders/cert-sotd-14.webp' },
            { label: '中国好创意国赛一等奖', date: '', image: '/assets/placeholders/cert-sotd-15.webp', url: '/assets/placeholders/cert-sotd-15.webp' },
        ],
        platformConfig: { label: '校园精选', color: '#1a1a1a', icon: '🏆' },
    },
    sotm: {
        id: 'award-sotm',
        layout: 'certificate_grid',
        title: '社会精选',
        items: [
            {
                label: '社会精选 · 创作成果展示',
                date: '2026年7月',
                image: '/assets/placeholders/cert-3.webp',
                url: 'https://example.com/awards/sotm-1',
            },
            {
                label: '社会精选 · 公开分享与收录',
                date: '2026年6月',
                image: '/assets/placeholders/cert-4.webp',
                url: 'https://example.com/awards/sotm-2',
            },
            {
                label: '社会精选 · 行业评选入围',
                date: '2026年5月',
                image: '/assets/placeholders/cert-5.webp',
                url: 'https://example.com/awards/sotm-3',
            },
        ],
        platformConfig: { label: '社会精选', color: '#1a1a1a', icon: '🏆' },
    },
    other: {
        id: 'award-other',
        layout: 'certificate_grid',
        title: 'AI荣誉',
        items: [
            {
                label: 'PB全国高校组亚军',
                date: '',
                image: '/assets/placeholders/cert-ai-1.webp',
                url: '/assets/placeholders/cert-ai-1.webp',
            },
            {
                label: 'AI荣誉 · 获奖证书 2',
                date: '',
                image: '/assets/placeholders/cert-ai-2.webp',
                url: '/assets/placeholders/cert-ai-2.webp',
                fit: 'contain', // 横向证书完整显示，不裁剪不变形
            },
            {
                label: 'AI荣誉 · 获奖证书 3',
                date: '',
                image: '/assets/placeholders/cert-ai-3.webp',
                url: '/assets/placeholders/cert-ai-3.webp',
            },
            {
                label: 'AI荣誉 · 获奖证书 4',
                date: '',
                image: '/assets/placeholders/cert-ai-4.webp',
                url: '/assets/placeholders/cert-ai-4.webp',
            },
            {
                label: 'AI荣誉 · 获奖证书 5',
                date: '',
                image: '/assets/placeholders/cert-ai-5.webp',
                url: '/assets/placeholders/cert-ai-5.webp',
            },
            {
                label: 'AI荣誉 · 获奖证书 6',
                date: '',
                image: '/assets/placeholders/cert-ai-6.webp',
                url: '/assets/placeholders/cert-ai-6.webp',
            },
            {
                label: 'AI荣誉 · 获奖证书 7',
                date: '',
                image: '/assets/placeholders/cert-ai-7.webp',
                url: '/assets/placeholders/cert-ai-7.webp',
            },
        ],
        platformConfig: { label: 'AI荣誉', color: '#1a1a1a', icon: '🏆' },
    },
};
