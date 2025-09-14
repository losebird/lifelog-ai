
import type { InsightTemplate } from '../types';

export const initialTemplates: InsightTemplate[] = [
  {
    id: 'weekly-review',
    name: '每周复盘',
    description: '回顾过去一周的成就、挑战和学习，为下一周做计划。',
    questions: [
      "过去一周，我取得了哪些进展或成就？",
      "我遇到了哪些挑战？我从中学到了什么？",
      "我的精力和情绪状态如何？",
      "下周我要关注的 1-3 个最重要目标是什么？",
      "有什么我可以改进或停止做的事情？"
    ]
  },
  {
    id: 'daily-reflection',
    name: '每日三问',
    description: '一个简单的每日反思练习，帮助你专注于积极和成长。',
    questions: [
        "今天发生了什么好事？",
        "今天我学到了什么新东西？",
        "明天有什么可以做得更好的地方？"
    ]
  },
  {
    id: 'swot-analysis',
    name: '个人 SWOT 分析',
    description: '分析你的优势、劣势、机会和威胁，以获得更清晰的自我认知。',
    questions: [
        "根据我的记录，我最近表现出的主要优势 (Strengths) 是什么？",
        "记录中是否反映出我需要改进的劣势 (Weaknesses)？",
        "我是否错过了记录中提到的任何机会 (Opportunities)？",
        "记录中是否暗示了任何潜在的威胁 (Threats) 或风险？"
    ]
  },
   {
    id: 'goal-alignment',
    name: '目标对齐检查',
    description: '检查你最近的活动是否与你的长期目标保持一致。',
    questions: [
        "我最近的行动和记录，在多大程度上支持了我的长期目标？",
        "哪些活动占用了我大量时间，但对我的目标贡献不大？",
        "为了更好地与我的目标对齐，我下周可以做出什么调整？"
    ]
  }
];
