import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
  listDrafts,
  getDraft,
  saveDraft,
  deleteDraft,
  generateCover,
  previewHtml,
  type ImageDraft,
} from './api/xiaohongshu.js'

const server = new McpServer({
  name: 'jovipost-red',
  version: '1.0.0',
})

// ===== list_xhs_drafts =====
server.tool(
  'list_xhs_drafts',
  '列出所有小红书封面草稿（按更新时间倒序）',
  {},
  async () => {
    const list = await listDrafts()
    return { content: [{ type: 'text', text: JSON.stringify(list, null, 2) }] }
  }
)

// ===== get_xhs_draft =====
server.tool(
  'get_xhs_draft',
  '获取指定 ID 的小红书草稿详情',
  { id: z.string().describe('草稿 UUID') },
  async ({ id }) => {
    const draft = await getDraft(id)
    return { content: [{ type: 'text', text: JSON.stringify(draft, null, 2) }] }
  }
)

// ===== save_xhs_draft =====
server.tool(
  'save_xhs_draft',
  '新建或更新小红书草稿。传 id 则更新已有草稿，否则新建。',
  {
    id: z.string().optional().describe('草稿 UUID，有值则更新'),
    title: z.string().describe('职位标题'),
    company: z.string().describe('公司名称'),
    company_logo: z.string().optional().describe('公司 Logo URL'),
    job_type: z.string().optional().describe('职位类型，如 全职'),
    salary: z.string().optional().describe('薪资范围，如 50K-70K/年'),
    currency: z.enum(['1', '2', '3', '4']).optional().describe('货币：1=¥ 2=€ 3=$ 4=£'),
    city: z.string().optional().describe('工作城市'),
    experience: z.string().optional().describe('经验要求'),
    education: z.string().optional().describe('学历要求'),
    tags: z.array(z.string()).optional().describe('职位标签数组'),
    job_content: z.string().optional().describe('岗位职责'),
    job_requirement: z.string().optional().describe('任职要求'),
    job_benefits: z.string().optional().describe('福利待遇'),
    job_url: z.string().optional().describe('职位投递链接'),
  },
  async (params) => {
    const draft: ImageDraft = {
      ...params,
      title: params.title,
      company: params.company,
    }
    const result = await saveDraft(draft)
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

// ===== delete_xhs_draft =====
server.tool(
  'delete_xhs_draft',
  '删除指定 ID 的小红书草稿',
  { id: z.string().describe('草稿 UUID') },
  async ({ id }) => {
    await deleteDraft(id)
    return { content: [{ type: 'text', text: `草稿 ${id} 已删除` }] }
  }
)

// ===== generate_xhs_cover =====
server.tool(
  'generate_xhs_cover',
  '根据职位数据生成 1080×1440 小红书封面 PNG 图片。可传草稿数据或直接传字段。',
  {
    draft_id: z.string().optional().describe('草稿 UUID，若传入则从 Supabase 加载数据'),
    title: z.string().optional().describe('职位标题（不传 draft_id 时必填）'),
    company: z.string().optional().describe('公司名称（不传 draft_id 时必填）'),
    company_logo: z.string().optional().describe('公司 Logo URL'),
    job_type: z.string().optional().describe('职位类型'),
    salary: z.string().optional().describe('薪资范围'),
    currency: z.enum(['1', '2', '3', '4']).optional().describe('货币：1=¥ 2=€ 3=$ 4=£'),
    city: z.string().optional().describe('工作城市'),
    experience: z.string().optional().describe('经验要求'),
    education: z.string().optional().describe('学历要求'),
    tags: z.array(z.string()).optional().describe('职位标签'),
    job_content: z.string().optional().describe('岗位职责'),
    job_requirement: z.string().optional().describe('任职要求'),
    job_benefits: z.string().optional().describe('福利待遇'),
    output_path: z.string().optional().describe('输出路径，默认 ~/Downloads/xhs-cover-{timestamp}.png'),
  },
  async (params) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: Record<string, any>
    if (params.draft_id) {
      const draft = await getDraft(params.draft_id)
      if (!draft) return { content: [{ type: 'text', text: `未找到草稿 ID: ${params.draft_id}` }] }
      data = draft as Record<string, any>
    } else {
      const { output_path: _, draft_id: __, ...rest } = params
      data = rest
    }
    const result = await generateCover(data, params.output_path)
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

// ===== preview_xhs_html =====
server.tool(
  'preview_xhs_html',
  '返回渲染后的小红书封面 HTML 字符串（轻量预览，无需 Puppeteer）',
  {
    draft_id: z.string().optional().describe('草稿 UUID，若传入则从 Supabase 加载数据'),
    title: z.string().optional().describe('职位标题'),
    company: z.string().optional().describe('公司名称'),
    company_logo: z.string().optional().describe('公司 Logo URL'),
    job_type: z.string().optional().describe('职位类型'),
    salary: z.string().optional().describe('薪资范围'),
    currency: z.enum(['1', '2', '3', '4']).optional().describe('货币：1=¥ 2=€ 3=$ 4=£'),
    city: z.string().optional().describe('工作城市'),
    experience: z.string().optional().describe('经验要求'),
    education: z.string().optional().describe('学历要求'),
    tags: z.array(z.string()).optional().describe('职位标签'),
    job_content: z.string().optional().describe('岗位职责'),
    job_requirement: z.string().optional().describe('任职要求'),
    job_benefits: z.string().optional().describe('福利待遇'),
  },
  async (params) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: Record<string, any>
    if (params.draft_id) {
      const draft = await getDraft(params.draft_id)
      if (!draft) return { content: [{ type: 'text', text: `未找到草稿 ID: ${params.draft_id}` }] }
      data = draft as Record<string, any>
    } else {
      const { draft_id: _, ...rest } = params
      data = rest
    }
    const html = previewHtml(data)
    return { content: [{ type: 'text', text: html }] }
  }
)

// ===== 启动 =====
const transport = new StdioServerTransport()
await server.connect(transport)
