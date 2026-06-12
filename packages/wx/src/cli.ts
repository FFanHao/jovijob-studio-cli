#!/usr/bin/env node
import { Command } from 'commander'
import fs from 'fs'
import { saveWechatConfig, getValidAccessToken } from './config.js'
import { listDrafts, getDraft, saveDraft, deleteDraft } from './api/supabase.js'
import { pushToWechat, publishDraft, getWxDraftList } from './api/wechat.js'

const program = new Command()

program
  .name('jovipost-wx')
  .description('JoviJob 微信公众号 CLI 工具')
  .version('0.1.0')

// ─── auth ─────────────────────────────────────────────────────────────────────

const auth = program.command('auth').description('认证管理')

auth
  .command('setup')
  .description('配置 AppID 和 AppSecret')
  .requiredOption('--appid <id>', '微信公众号 AppID')
  .requiredOption('--secret <s>', '微信公众号 AppSecret')
  .action((opts) => {
    saveWechatConfig(opts.appid, opts.secret)
    console.log('已保存微信配置')
  })

auth
  .command('check')
  .description('验证 Token 是否有效')
  .action(async () => {
    try {
      const token = await getValidAccessToken()
      console.log(`Token 有效: ${token.substring(0, 20)}...`)
    } catch (err) {
      console.error(`错误: ${(err as Error).message}`)
      process.exit(1)
    }
  })

// ─── drafts ───────────────────────────────────────────────────────────────────

const draftsCmd = program.command('drafts').description('本地草稿管理')

draftsCmd
  .command('list')
  .description('列出本地草稿')
  .action(async () => {
    try {
      const list = await listDrafts()
      if (list.length === 0) {
        console.log('暂无草稿')
        return
      }
      list.forEach(d => {
        console.log(`[${d.id}] ${d.title}${d.wechat_media_id ? ' [已推送微信]' : ''} - ${d.updated_at?.split('T')[0] || ''}`)
      })
    } catch (err) {
      console.error(`错误: ${(err as Error).message}`)
      process.exit(1)
    }
  })

draftsCmd
  .command('get <id>')
  .description('获取草稿详情')
  .action(async (id: string) => {
    try {
      const draft = await getDraft(id)
      console.log(JSON.stringify(draft, null, 2))
    } catch (err) {
      console.error(`错误: ${(err as Error).message}`)
      process.exit(1)
    }
  })

draftsCmd
  .command('delete <id>')
  .description('删除草稿')
  .action(async (id: string) => {
    try {
      await deleteDraft(id)
      console.log(`已删除草稿 ${id}`)
    } catch (err) {
      console.error(`错误: ${(err as Error).message}`)
      process.exit(1)
    }
  })

// ─── push ─────────────────────────────────────────────────────────────────────

program
  .command('push')
  .description('推送草稿到微信草稿箱')
  .option('--id <draftId>', '本地草稿 ID')
  .option('--file <htmlFile>', '推送 HTML 文件')
  .option('--title <title>', '文章标题')
  .option('--author <author>', '作者')
  .action(async (opts) => {
    try {
      if (opts.id) {
        const { mediaId, previewUrl } = await pushToWechat(opts.id, {
          title: opts.title,
          author: opts.author,
        })
        console.log(`推送成功`)
        console.log(`Media ID: ${mediaId}`)
        console.log(`预览链接: ${previewUrl}`)
      } else if (opts.file) {
        const html = fs.readFileSync(opts.file, 'utf-8')
        const draft = await saveDraft({ title: opts.title || opts.file, content: html })
        const { mediaId, previewUrl } = await pushToWechat(draft.id!, { title: opts.title })
        console.log(`推送成功`)
        console.log(`Media ID: ${mediaId}`)
        console.log(`预览链接: ${previewUrl}`)
      } else {
        console.error('请指定 --id 或 --file')
        process.exit(1)
      }
    } catch (err) {
      console.error(`错误: ${(err as Error).message}`)
      process.exit(1)
    }
  })

// ─── publish ──────────────────────────────────────────────────────────────────

program
  .command('publish')
  .description('发布微信草稿到公众号')
  .requiredOption('--media-id <id>', '微信草稿 media_id')
  .action(async (opts) => {
    try {
      const publishId = await publishDraft(opts.mediaId)
      console.log(`发布成功，publish_id: ${publishId}`)
    } catch (err) {
      console.error(`错误: ${(err as Error).message}`)
      process.exit(1)
    }
  })

// ─── wx-drafts ────────────────────────────────────────────────────────────────

const wxDraftsCmd = program.command('wx-drafts').description('微信草稿箱管理')

wxDraftsCmd
  .command('list')
  .description('获取微信草稿箱列表')
  .option('--offset <n>', '偏移量', '0')
  .option('--count <n>', '数量', '10')
  .action(async (opts) => {
    try {
      const result = await getWxDraftList(parseInt(opts.offset), parseInt(opts.count))
      console.log(JSON.stringify(result, null, 2))
    } catch (err) {
      console.error(`错误: ${(err as Error).message}`)
      process.exit(1)
    }
  })

// ─── mcp ──────────────────────────────────────────────────────────────────────

program
  .command('mcp')
  .description('启动 MCP Server（stdio 模式，供 Claude 调用）')
  .action(async () => {
    await import('./mcp-server.js')
  })

program.parse()
