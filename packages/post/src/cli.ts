#!/usr/bin/env node
import { Command } from 'commander'
import fs from 'fs'
import {
  loadCookie,
  saveCookie,
  importCookieFromElectronState,
  requireCookie,
} from './config.js'
import {
  publishJob,
  getJobList,
  getCompanies,
  getRecruiters,
  getLabels,
  checkAuth,
} from './api/joviJob.js'
import { germanCities } from './data/cities.js'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import zhiweiData from './data/zhiwei.json' with { type: 'json' }

const program = new Command()
program.name('jovipost').description('JoviJob 职位发布 CLI + MCP Server').version('1.0.0')

// ===== auth =====
const auth = program.command('auth').description('Cookie 认证管理')

auth
  .command('import <file>')
  .description('从 Electron App 的 jovijob-state.json 导入 Cookie')
  .action((file: string) => {
    try {
      const cookie = importCookieFromElectronState(file)
      saveCookie(cookie)
      console.log('Cookie 已导入并保存到 ~/.jovijob/session.json')
      console.log('预览：', cookie.substring(0, 80) + '...')
    } catch (err: unknown) {
      console.error('导入失败：', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

auth
  .command('set-cookie <cookie>')
  .description('手动设置 Cookie 字符串')
  .action((cookie: string) => {
    saveCookie(cookie)
    console.log('Cookie 已保存到 ~/.jovijob/session.json')
  })

auth
  .command('check')
  .description('检查当前 Cookie 是否有效')
  .action(async () => {
    const cookie = loadCookie()
    if (!cookie) {
      console.error('未找到 Cookie，请先运行：jovipost auth import 或 jovipost auth set-cookie')
      process.exit(1)
    }
    console.log('正在验证 Cookie...')
    const result = await checkAuth(cookie)
    console.log(result.valid ? '✅' : '❌', result.message)
    if (!result.valid) process.exit(1)
  })

// ===== job =====
const job = program.command('job').description('职位管理')

job
  .command('list')
  .description('获取后台职位列表')
  .action(async () => {
    const cookie = requireCookie()
    const jobs = await getJobList(cookie)
    console.log(JSON.stringify(jobs, null, 2))
  })

job
  .command('publish')
  .description('发布职位（从 JSON 文件或 stdin 读取参数）')
  .option('--file <path>', '从 JSON 文件读取职位数据')
  .option('--stdin', '从 stdin 读取 JSON 数据')
  .action(async (opts: { file?: string; stdin?: boolean }) => {
    let raw = ''
    if (opts.file) {
      raw = fs.readFileSync(opts.file, 'utf-8')
    } else if (opts.stdin) {
      raw = fs.readFileSync('/dev/stdin', 'utf-8')
    } else {
      console.error('请提供 --file <path> 或 --stdin')
      process.exit(1)
    }
    const jobData = JSON.parse(raw)
    const cookie = requireCookie()
    const result = await publishJob(jobData, cookie)
    console.log(JSON.stringify(result, null, 2))
    if (result.code !== 200) process.exit(1)
  })

// ===== cities =====
program
  .command('cities')
  .description('列出城市 ID 对照表')
  .action(() => {
    console.log(JSON.stringify(germanCities, null, 2))
  })

// ===== categories =====
program
  .command('categories')
  .description('列出职位分类树')
  .option('--keyword <kw>', '过滤关键词')
  .action((opts: { keyword?: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = zhiweiData
    if (opts.keyword) {
      const kw = opts.keyword.toLowerCase()
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
    console.log(JSON.stringify(data, null, 2))
  })

// ===== labels =====
program
  .command('labels')
  .description('列出职位标签（公开页面，无需登录）')
  .action(async () => {
    const labels = await getLabels()
    console.log(JSON.stringify(labels, null, 2))
  })

// ===== companies =====
program
  .command('companies')
  .description('列出企业列表及其 ID')
  .action(async () => {
    const cookie = requireCookie()
    const companies = await getCompanies(cookie)
    console.log(JSON.stringify(companies, null, 2))
  })

// ===== recruiters =====
program
  .command('recruiters')
  .description('列出招聘人列表')
  .option('--gongsi-id <id>', '按公司 ID 过滤')
  .action(async (opts: { gongsiId?: string }) => {
    const cookie = requireCookie()
    const recruiters = await getRecruiters(cookie, opts.gongsiId)
    console.log(JSON.stringify(recruiters, null, 2))
  })

// ===== mcp =====
program
  .command('mcp')
  .description('启动 MCP Server（stdio 模式，供 Claude Desktop / Claude Code 调用）')
  .action(async () => {
    // 直接导入 mcp-server 模块，其顶层代码会自动启动 Server
    await import('./mcp-server.js')
  })

program.parse()
