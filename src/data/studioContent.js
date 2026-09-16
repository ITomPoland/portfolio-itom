/**
 * 创作室内容分类。
 *
 * 三类作品共用同一套屏幕展示和详情卡交互。
 */
export const studioCategories = [
    {
        id: 'activity',
        label: '活动策划',
        description: '活动策划、现场协作与传播内容',
    },
    {
        id: 'vibe-coding',
        label: 'Vibe Coding',
        description: '用 AI 协作完成的产品与交互实验',
    },
    {
        id: 'video',
        label: '视频创作',
        description: 'AI 影像、动态视觉与叙事短片',
    },
];

/**
 * 创作室已录入作品。
 *
 * platform 对应上面的内容分类；device 只决定沿用哪一种现有屏幕模型。
 * frontTexture 是素描/低饱和状态，paintedFrontTexture 是鼠标悬停后的彩色封面。
 */
export const studioContent = [
    {
        id: 'activity-oucuo-seagull',
        platform: 'activity',
        categoryLabel: '活动策划',
        format: '宣传片',
        device: 'tv',
        title: '《看海鸥，NO，是看欧厝》',
        description:
            '为 2025 年 10 月 16—22 日 AI 欧厝艺术画展制作的宣传片之一。我和冰鱼仔老师合作，借欧厝场地记录这次活动，也把它作为 123 工作室招新的内容延伸。',
        frontTexture: '/assets/studio/user-content/oucuo-seagull-sketch.webp',
        paintedFrontTexture: '/assets/studio/user-content/oucuo-seagull-painted.webp',
        thumbnail: '/assets/studio/user-content/oucuo-seagull-painted.webp',
        url: 'https://my.feishu.cn/wiki/MvMQwNPn3i2AvZkpHWhc4WNAnFc?from=from_copylink',
        date: '2025-10-16',
    },
    {
        id: 'activity-oucuo-small-view',
        platform: 'activity',
        categoryLabel: '活动策划',
        format: '宣传片',
        device: 'tv',
        title: '《小看看小欧厝》',
        description:
            '欧厝艺术画展的另一支宣传片，从更轻松、微缩的视角介绍场地与活动。那是冰鱼仔老师第一次在欧厝组织交流活动，也成为工作室招新期间的一次共同创作。',
        frontTexture: '/assets/studio/user-content/oucuo-small-view-sketch.webp',
        paintedFrontTexture: '/assets/studio/user-content/oucuo-small-view-painted.webp',
        thumbnail: '/assets/studio/user-content/oucuo-small-view-painted.webp',
        url: 'https://my.feishu.cn/wiki/MvMQwNPn3i2AvZkpHWhc4WNAnFc?from=from_copylink',
        date: '2025-10-16',
    },
    {
        id: 'activity-studio-recruitment',
        platform: 'activity',
        categoryLabel: '活动策划',
        format: '招新短片',
        device: 'monitor',
        title: '《123！招新》',
        description:
            '三名大学生从课堂里的无聊和迷茫出发，因为创作相遇，最后加入 123 工作室。片中结合 AI 动画、角色设计和动态视觉，用剪辑师、策划等身份呈现成员分工，希望把工作室年轻、自由、愿意一起尝试的状态讲清楚。',
        frontTexture: '/assets/studio/user-content/studio-recruitment-sketch.webp',
        paintedFrontTexture: '/assets/studio/user-content/studio-recruitment-painted.webp',
        thumbnail: '/assets/studio/user-content/studio-recruitment-painted.webp',
        url: 'https://my.feishu.cn/wiki/QpgrwQHVQipZbYkajSjc7mMLnUj?from=from_copylink',
        date: '2025-10-12',
    },
    {
        id: 'video-love-and-orange',
        platform: 'video',
        categoryLabel: '视频创作',
        format: 'AI 视觉短片',
        device: 'monitor',
        title: '《恋与橙》',
        description:
            '以家乡麻阳冰糖橙为主角，用青柠色调和 AI 视觉表现果肉、汁水飞溅与树影阳光。作品想摆脱常见的农产品宣传套路，把冰糖橙拍得更年轻，也保留它与家乡、助农之间的真实联系。',
        frontTexture: '/assets/studio/user-content/love-and-orange-sketch.webp',
        paintedFrontTexture: '/assets/studio/user-content/love-and-orange-painted.webp',
        thumbnail: '/assets/studio/user-content/love-and-orange-painted.webp',
        url: 'https://my.feishu.cn/wiki/RrK2w0V1qi70SskqEkqc2ZvCnlF?from=from_copylink',
        date: '2025-11-15',
    },
    {
        id: 'vibe-letters',
        platform: 'vibe-coding',
        categoryLabel: 'Vibe Coding',
        format: 'Web 互动产品',
        device: 'monitor',
        title: '没有地址的信',
        description:
            '一个跨校漂流信箱网页：先写完一封没有地址的信，再让它漂给另一位同学。产品源自抖音校园 Wow Land 第二期，为偏内向、不敢主动邀请陌生人的参与者降低开口门槛，把“写信—漂流状态—收信”做成可操作的网页体验；最终 156 人参加、完成 468 次邮箱发送，40 人成功匹配。',
        frontTexture: '/assets/studio/user-content/vibe-letters-sketch.webp',
        paintedFrontTexture: '/assets/studio/user-content/vibe-letters-painted.webp',
        thumbnail: '/assets/studio/user-content/vibe-letters-painted.webp',
        url: 'https://letters.wutongshuai.com/',
        date: '持续更新',
        sortDate: '2026-08-26',
    },
    {
        id: 'vibe-zhizhua',
        platform: 'vibe-coding',
        categoryLabel: 'Vibe Coding',
        format: 'AI 求职产品',
        device: 'monitor',
        title: '「职爪」ZHIZHUA',
        description:
            '面向秋招求职者的中文 AI 工作台，把简历库、岗位匹配、投递记录与进度跟踪放进同一套界面。产品仍在持续迭代，关键投递动作由用户亲自确认，不做无人值守的批量投递——把人留在决策环节里，让每一次投递都可控、可追溯。',
        frontTexture: '/assets/studio/user-content/vibe-zhizhua-sketch.webp',
        paintedFrontTexture: '/assets/studio/user-content/vibe-zhizhua-painted.webp',
        thumbnail: '/assets/studio/user-content/vibe-zhizhua-painted.webp',
        url: 'https://jd.wutongshuai.com/zh/dashboard',
        date: '持续开发',
        sortDate: '2026-08-26',
    },
    {
        id: 'vibe-wutongshu-ai',
        platform: 'vibe-coding',
        categoryLabel: 'Vibe Coding',
        format: 'AI 内容网站',
        device: 'monitor',
        title: '梧桐树 AI · 就业校园墙',
        description:
            '工作室的线上站点，后续将作为 23 届就业校园墙开发。原计划用于沉淀“AI 力”相关课程与带班笔记，但 AI 更新速度太快，从开发、授课到复盘的周期过长，内容逐渐停止维护；站点接下来将转型为工作室的 23 届就业校园墙。',
        frontTexture: '/assets/studio/user-content/vibe-wutongshu-ai-sketch.webp',
        paintedFrontTexture: '/assets/studio/user-content/vibe-wutongshu-ai-painted.webp',
        thumbnail: '/assets/studio/user-content/vibe-wutongshu-ai-painted.webp',
        url: 'https://wutongshuai.com/',
        date: '2026',
        sortDate: '2026-08-26',
    },
    {
        id: 'vibe-studio-feishu-knowledge-base',
        platform: 'vibe-coding',
        categoryLabel: 'Vibe Coding',
        format: '飞书知识库',
        device: 'monitor',
        title: '123工作室飞书知识库',
        description:
            '为工作室搭建的线上知识库，把成员作品与简历做成可对外展示的产品。作为工作室负责人，我发现本地文件管理让成员作品难以对外传播，于是用飞书整理工作室情况与成员简历；参加会展、黑客松时直接分享知识库链接，为工作室带来商业合作与就业机会——5 名成员获得 offer，2 名成员进入 Way to AGI 实习。',
        frontTexture: '/assets/studio/user-content/vibe-studio-feishu-sketch.webp',
        paintedFrontTexture: '/assets/studio/user-content/vibe-studio-feishu-painted.webp',
        thumbnail: '/assets/studio/user-content/vibe-studio-feishu-painted.webp',
        url: 'https://my.feishu.cn/wiki/E1OfwwHPUiiIntkbpHMc2ir3n7b?from=from_copylink',
        date: '持续维护',
        sortDate: '2025-11-05',
    },
    {
        id: 'vibe-success-diary',
        platform: 'vibe-coding',
        categoryLabel: 'Vibe Coding',
        format: '开源自动化工具',
        device: 'monitor',
        title: '成功日记：XMind 自动同步飞书',
        description:
            '让人继续在 XMind 里写成功日记，脚本在后台把内容同步成飞书镜像文档，方便接入飞书 CLI 的 AI 工具读取和整理。XMind 是唯一源头，飞书只负责展示同步结果。',
        frontTexture: '/assets/studio/user-content/vibe-success-diary-sketch.webp',
        paintedFrontTexture: '/assets/studio/user-content/vibe-success-diary-painted.webp',
        thumbnail: '/assets/studio/user-content/vibe-success-diary-painted.webp',
        url: 'https://github.com/wtgjx/success-diary-xmind-feishu-sync',
        date: '2026-06-11',
    },
    {
        id: 'vibe-packaging-skill',
        platform: 'vibe-coding',
        categoryLabel: 'Vibe Coding',
        format: 'Codex Skill',
        device: 'monitor',
        title: '包装刀版设计与 Illustrator 分层交付 Skill',
        description:
            '一个用于包装刀版设计的 Codex Skill，可读取 DXF、SVG、PDF、AI 或 PNG，保留刀线、折线和出血等技术信息，并输出可编辑的分层 AI、SVG、PDF、预览图与验证报告。',
        frontTexture: '/assets/studio/user-content/vibe-packaging-skill-sketch.webp',
        paintedFrontTexture: '/assets/studio/user-content/vibe-packaging-skill-painted.webp',
        thumbnail: '/assets/studio/user-content/vibe-packaging-skill-painted.webp',
        url: 'https://github.com/wtgjx/design-dieline-packaging-skill',
        date: '2026-07-09',
    },
    {
        id: 'vibe-visual-resume',
        platform: 'vibe-coding',
        categoryLabel: 'Vibe Coding',
        format: '开源本地化项目',
        device: 'monitor',
        title: 'AI 求职框架中国市场可视化版',
        description:
            '基于 MadsLorentzen/ai-job-search（MIT License）继续开发的中国市场版本。新增可视化仪表盘、简历库、Chrome 扩展投递记录和飞书多维表格同步，并保留人工确认环节。',
        frontTexture: '/assets/studio/user-content/vibe-visual-resume-sketch.webp',
        paintedFrontTexture: '/assets/studio/user-content/vibe-visual-resume-painted.webp',
        thumbnail: '/assets/studio/user-content/vibe-visual-resume-painted.webp',
        url: 'https://github.com/wtgjx/myname-visual-resume',
        date: '2026-08-05',
    },
];
