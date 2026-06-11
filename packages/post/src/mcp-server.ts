import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { requireCookie } from './config.js'
import {
  publishJob,
  getJobList,
  getCompanies,
  getRecruiters,
  getLabels,
  checkAuth,
  type JobData,
} from './api/joviJob.js'
import { germanCities } from './data/cities.js'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import zhiweiData from './data/zhiwei.json' with { type: 'json' }

const server = new McpServer({
  name: 'jovipost',
  version: '1.0.0',
})

// ===== check_auth =====
server.tool(
  'check_auth',
  '检查当前 Cookie 是否有效，返回登录状态',
  {},
  async () => {
    const cookie = requireCookie()
    const result = await checkAuth(cookie)
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

// ===== list_cities =====
server.tool(
  'list_cities',
  '列出可用城市及其 ID（city_id0 + province_id0），用于 publish_job 的地区字段',
  {},
  async () => {
    return { content: [{ type: 'text', text: JSON.stringify(germanCities, null, 2) }] }
  }
)

// ===== list_job_categories =====
server.tool(
  'list_job_categories',
  '列出三级职位分类树（zhiwei_level2_id0 / zhiwei_level1_id0 / zhiwei_id0），用于 publish_job',
  {
    keyword: z.string().optional().describe('可选关键词，过滤分类名称'),
  },
  async ({ keyword }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = zhiweiData
    if (keyword) {
      const kw = keyword.toLowerCase()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data = (zhiweiData as any[]).filter((cat: any) => {
        const matchL1 = cat.name?.toLowerCase().includes(kw)
        const filteredL2 = (cat.children || []).filter((l2: any) => {
          const matchL2 = l2.name?.toLowerCase().includes(kw)
          const filteredL3 = (l2.children || []).filter((l3: any) =>
            l3.name?.toLowerCase().includes(kw)
          )
          return matchL2 || filteredL3.length > 0
        })
        return matchL1 || filteredL2.length > 0
      })
    }
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
  }
)

// ===== list_labels =====
server.tool(
  'list_labels',
  '列出职位标签及其 ID（label_id0），从公开页面获取，无需认证',
  {},
  async () => {
    const labels = await getLabels()
    return { content: [{ type: 'text', text: JSON.stringify(labels, null, 2) }] }
  }
)

// ===== list_companies =====
server.tool(
  'list_companies',
  '列出后台企业列表及其 ID（gongsi_id），需要有效 Cookie',
  {},
  async () => {
    const cookie = requireCookie()
    const companies = await getCompanies(cookie)
    return { content: [{ type: 'text', text: JSON.stringify(companies, null, 2) }] }
  }
)

// ===== list_recruiters =====
server.tool(
  'list_recruiters',
  '列出招聘人列表及其 member_id，可按 gongsi_id 过滤',
  {
    gongsi_id: z.string().optional().describe('公司 ID，不传则返回所有招聘人'),
  },
  async ({ gongsi_id }) => {
    const cookie = requireCookie()
    const recruiters = await getRecruiters(cookie, gongsi_id)
    return { content: [{ type: 'text', text: JSON.stringify(recruiters, null, 2) }] }
  }
)

// ===== get_job_list =====
server.tool(
  'get_job_list',
  '获取后台职位列表，用于核查发布结果或获取现有职位 ID',
  {},
  async () => {
    const cookie = requireCookie()
    const jobs = await getJobList(cookie)
    return { content: [{ type: 'text', text: JSON.stringify(jobs, null, 2) }] }
  }
)

// ===== publish_job =====
server.tool(
  'publish_job',
  '发布或更新职位。传入 id 字段则更新已有职位，否则新建。调用前建议先用 list_companies、list_recruiters、list_cities、list_job_categories 获取相关 ID。',
  {
    title: z.string().describe('职位标题'),
    content: z.string().describe('岗位职责'),
    content2: z.string().describe('任职要求'),
    content3: z.string().optional().describe('福利待遇'),
    id: z.string().optional().describe('职位 ID，有值则更新已有职位'),
    gongsi_id: z.string().optional().describe('公司 ID，默认 650'),
    member_id: z.string().optional().describe('招聘人 member_id，默认 153'),
    city_id0: z.string().optional().describe('城市 ID，从 list_cities 获取'),
    province_id0: z.string().optional().describe('省份 ID，从 list_cities 获取'),
    country_id0: z.string().optional().describe('国家 ID，默认 2（德国）'),
    xingzhi: z.enum(['1', '2', '3']).optional().describe('职位类型：1=全职 2=兼职 3=实习，默认 1'),
    xinzi_currency: z.enum(['1', '2', '3', '4', '5']).optional().describe('薪资货币：1=¥ 2=€ 3=$ 4=£ 5=CHF，默认 2(€)'),
    xinzi_types: z.enum(['2', '3', '4', '6']).optional().describe('薪资类型：2=时薪 3=周薪 4=月薪 6=年薪，默认 6'),
    xinzi_min: z.string().optional().describe('最低薪资'),
    xinzi_max: z.string().optional().describe('最高薪资'),
    jingyan: z.enum(['1', '2', '3', '4', '5', '6', '7', '8']).optional().describe('经验要求：1=在校生 2=应届生 3=1年以下 4=1-3年 5=3-5年 6=5-10年 7=10年以上 8=不限'),
    xueli: z.enum(['3', '4', '5', '6', '7', '8', '10']).optional().describe('学历要求：3=高中 4=中专 5=大专 6=本科 7=硕士 8=博士 10=不限'),
    zhiwei_id0: z.string().optional().describe('三级职位分类 ID，从 list_job_categories 获取'),
    zhiwei_level1_id0: z.string().optional().describe('一级职位分类 ID'),
    zhiwei_level2_id0: z.string().optional().describe('二级职位分类 ID'),
    label_id0: z.string().optional().describe('标签 ID，从 list_labels 获取，多个用逗号分隔'),
    toudi_mode: z.enum(['1', '2']).optional().describe('投递方式：1=平台接收 2=外部链接，默认 2'),
    from_url: z.string().optional().describe('外部投递链接'),
    states: z.enum(['1', '2', '3']).optional().describe('状态：1=草稿 2=显示 3=下架，默认 2'),
  },
  async (params) => {
    const cookie = requireCookie()
    const job: JobData = { ...params }
    const result = await publishJob(job, cookie)
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

// ===== 启动 =====
const transport = new StdioServerTransport()
await server.connect(transport)
