export const PORTFOLIO_KNOWLEDGE = Object.freeze({
  lastVerifiedAt: '2026-08-24',
  owner: {
    name: '吴桐',
    currentIdentity: [
      '长沙师范学院大四学生',
      '123工作室负责人',
      'AIGC主理人'
    ],
    careerGoal: '产品经理',
    publicActivityRole: '活动总负责人',
    interests: ['足球', '手工皮具', '跑步', '音乐'],
    publicExperience: [
      '有国旗护卫队、学生自我管理组织、心理部和实验室助理等校园经历。',
      '参加过校外托管中心社会实践，辅导孩子、组织活动并进行陪伴，由此锻炼耐心、沟通和突发情况处理能力。',
      '参与过挑战杯智能体搭建、电子商务相关创新创业竞赛，以及 AI 编程和项目实践。',
      '建立并持续运营 123工作室，围绕 AIGC 内容、项目实践和知识协作开展工作。'
    ]
  },
  featuredWorks: [
    {
      title: '2025/11/15冬日限定的一抹金黄——麻阳冰糖橙',
      type: '视频作品与活动项目',
      status: '已收录在个人说明书的重点作品中',
      description: '围绕麻阳冰糖橙展开的校园农产品实践。现有项目资料覆盖内容传播、视觉与包装、运营执行、团队招募协作，以及订单和物流状态管理。该同名视频是项目的重点内容作品之一。',
      ownerRole: '对外可按用户确认的“活动总负责人”介绍；尚未提供个人在拍摄、剪辑、销售等环节的逐项分工。',
      limits: '没有可公开核验的销量、收入、客户名单或个人业绩数字，不得推断。'
    },
    {
      title: '没有地址的信，写一封，漂出去',
      type: 'Web 互动作品',
      status: '已有公开网页',
      description: '围绕“写一封没有地址的信，让它漂出去”这一主题呈现的网页作品。',
      publicUrl: 'https://letters.wutongshuai.com/',
      limits: '作品集中暂未提供更细的技术栈、用户规模、运营数据或吴桐的逐项开发分工。'
    },
    {
      title: '「职爪」职爪 ZHIZHUA，秋招，从投递到 Offer',
      type: 'AI Coding / 求职产品',
      status: '持续开发与验证中；已实现能力和规划能力必须区分',
      description: '面向个人求职者的本地优先 AI 求职工作台，产品方向是把候选人档案、岗位发现与可解释评估、材料准备、人工投递确认、状态跟踪、面试和复盘连接成可追溯的人机协同流程。项目在开源 AI 求职框架基础上进行中国市场可视化与流程改造。',
      verifiedCapabilities: [
        '中国市场可视化仪表盘',
        '简历库管理',
        'Chrome 扩展的投递进度采集与跟踪',
        '飞书多维表格同步方向'
      ],
      publicUrl: 'https://github.com/wtgjx/myname-visual-resume',
      attribution: '核心框架来自 MadsLorentzen/ai-job-search（MIT License），吴桐的项目是在其基础上的本地化与可视化改造。',
      limits: '不是无需确认的批量自动投递机器人。关键投递动作由用户人工确认；不能把 PRD 中规划或实验中的能力说成已经完整上线。'
    },
    {
      title: '123设计工作室知识库',
      type: '飞书知识与协作系统',
      status: '已建立并持续维护',
      description: '吴桐以飞书搭建的工作室知识与协作系统，覆盖知识学习、项目实践、成员档案、工作室成长手册、文化建设、AI 视频与 IP 制作工作流、提示词、Vibe Coding，以及活动项目记录。',
      ownerRole: '吴桐是 123工作室负责人。',
      limits: '该空间包含内部协作资料；不得透露成员隐私、内部链接、文档令牌或未公开内容。'
    }
  ],
  portfolioAttribution: {
    statement: '这个 3D 作品集是在 Tomasz “ITom” Szmajda 的 MIT 开源作品基础上进行中文化、内容替换、交互扩展与视觉定制。',
    limits: '不得声称吴桐从零完成了全部 3D 建模、场景设计或第三方纹理素材。'
  },
  privacy: [
    '不得透露 API 密钥、飞书内部链接、知识库令牌或其他凭据。',
    '不得透露客户、订单、收件人、团队成员的姓名、电话、地址等私人信息。',
    '不得根据资料空白推断收入、销量、播放量、奖项、客户、个人贡献或完成时间。'
  ]
});

export const PORTFOLIO_KNOWLEDGE_TEXT = JSON.stringify(
  PORTFOLIO_KNOWLEDGE,
  null,
  2
);
