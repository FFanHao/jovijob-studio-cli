#!/usr/bin/env node
import { Command } from 'commander'
import fs from 'fs'
import {
  listDrafts,
  getDraft,
  saveDraft,
  deleteDraft,
  generateCover,
} from './api/xiaohongshu.js'

const program = new Command()
program.name('jovipost-red').description('JoviJob 小红书封面生成 CLI + MCP Server').version('1.0.0')

// ===== drafts =====
const drafts = program.command('drafts').description('小红书草稿管理')

drafts
  .command('list')
  .description('列出所有草稿')
  .action(async () => {
    const list = await listDrafts()
    console.log(JSON.stringify(list, null, 2))
  })

drafts
  .command('get <id>')
  .description('获取草稿详情')
  .action(async (id: string) => {
    const draft = await getDraft(id)
    console.log(JSON.stringify(draft, null, 2))
  })

drafts
  .command('delete <id>')
  .description('删除草稿')
  .action(async (id: string) => {
    await deleteDraft(id)
    console.log(`草稿 ${id} 已删除`)
  })

// ===== generate =====
program
  .command('generate')
  .description('生成小红书封面图（从草稿 ID 或 stdin/file 读取数据）')
  .option('--id <draftId>', '草稿 ID（从 Supabase 加载数据）')
  .option('--file <path>', '从 JSON 文件读取数据')
  .option('--stdin', '从 stdin 读取 JSON 数据')
  .option('--out <path>', '输出图片路径（默认 ~/Downloads/xhs-cover-{timestamp}.png）')
  .action(async (opts: { id?: string; file?: string; stdin?: boolean; out?: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: Record<string, any>

    if (opts.id) {
      const draft = await getDraft(opts.id)
      if (!draft) {
        console.error(`未找到草稿 ID: ${opts.id}`)
        process.exit(1)
      }
      data = draft as Record<string, any>
    } else if (opts.file) {
      data = JSON.parse(fs.readFileSync(opts.file, 'utf-8'))
    } else if (opts.stdin) {
      data = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8'))
    } else {
      console.error('请提供 --id <draftId>、--file <path> 或 --stdin')
      process.exit(1)
    }

    console.log('正在生成封面图...')
    const result = await generateCover(data, opts.out)
    if (result.success) {
      console.log('生成成功：', result.path)
    } else {
      console.error('生成失败：', result.error)
      process.exit(1)
    }
  })

// ===== mcp =====
program
  .command('mcp')
  .description('启动 MCP Server（stdio 模式，供 Claude 调用）')
  .action(async () => {
    await import('./mcp-server.js')
  })

program.parse()
