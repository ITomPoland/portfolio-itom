import { studioContent } from '../../../../data/studioContent';

/**
 * 创作室分类与现有屏幕模型的对应关系。
 * shape 只复用原来的电视、显示器和手机模型，不改变建模。
 */
export const PLATFORM_CONFIG = {
    activity: {
        color: '#87956f',
        accentColor: '#637253',
        icon: '策',
        label: '活动策划',
        shape: 'tv',
    },
    'vibe-coding': {
        color: '#596b57',
        accentColor: '#364634',
        icon: '</>',
        label: 'Vibe Coding',
        shape: 'monitor',
    },
    video: {
        color: '#b48358',
        accentColor: '#7e5434',
        icon: '▶',
        label: '视频创作',
        shape: 'monitor',
    },
};

// 与正式本地数据共用同一来源，避免备用路径重新显示示例作品。
export const CONTENT_DATA = studioContent;

export const getContentByPlatform = (platform) => {
    if (platform === 'all') return CONTENT_DATA;
    return CONTENT_DATA.filter((item) => item.platform === platform);
};

export const getLatestContent = () => {
    return [...CONTENT_DATA].sort(
        (a, b) => new Date(b.sortDate || b.date) - new Date(a.sortDate || a.date)
    )[0];
};
