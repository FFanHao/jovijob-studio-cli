import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { saveWechatConfig, getValidAccessToken, getWechatConfig } from './config.js'
import { listDrafts, getDraft, saveDraft, deleteDraft } from './api/supabase.js'
import { pushToWechat, publishDraft, getWxDraftList, uploadImageFromUrl } from './api/wechat.js'
import { htmlToWechat, rawHtmlToWechat } from './utils/html.js'

const server = new McpServer({
  name: 'jovipost-wx',
  version: '0.1.0',
})

// ─── wx_check_auth ────────────────────────────────────────────────────────────

server.tool(
  'wx_check_auth',
  '检查微信公众号 AppID/AppSecret 配置及 Token 是否有效',
  {},
  async () => {
    const config = getWechatConfig()
    if (!config?.appId) {
      return { content: [{ type: 'text', text: '未配置微信凭据，请先调用 wx_setup_auth' }] }
    }
    try {
      const token = await getValidAccessToken()
      return {
        content: [{
          type: 'text',
          text: `配置有效\nAppID: ${config.appId}\nToken: ${token.substring(0, 20)}...`,
        }],
      }
    } catch (err) {
      return { content: [{ type: 'text', text: `Token 无效: ${(err as Error).message}` }] }
    }
  }
)

// ─── wx_setup_auth ────────────────────────────────────────────────────────────

server.tool(
  'wx_setup_auth',
  '配置微信公众号 AppID 和 AppSecret',
  { appId: z.string().describe('微信公众号 AppID'), appSecret: z.string().describe('微信公众号 AppSecret') },
  async ({ appId, appSecret }) => {
    saveWechatConfig(appId, appSecret)
    return { content: [{ type: 'text', text: `已保存微信配置，AppID: ${appId}` }] }
  }
)

// ─── wx_list_local_drafts ─────────────────────────────────────────────────────

server.tool(
  'wx_list_local_drafts',
  '列出 Supabase 本地草稿列表',
  {},
  async () => {
    const list = await listDrafts()
    if (list.length === 0) {
      return { content: [{ type: 'text', text: '暂无本地草稿' }] }
    }
    const text = list.map(d =>
      `ID: ${d.id}\n标题: ${d.title}\n作者: ${d.author || '-'}\n微信草稿: ${d.wechat_media_id || '未推送'}\n更新时间: ${d.updated_at || '-'}`
    ).join('\n\n---\n\n')
    return { content: [{ type: 'text', text }] }
  }
)

// ─── wx_get_local_draft ───────────────────────────────────────────────────────

server.tool(
  'wx_get_local_draft',
  '获取本地草稿详情，包含模块数据和处理后的微信 HTML',
  { id: z.string().describe('草稿 ID') },
  async ({ id }) => {
    const draft = await getDraft(id)
    let wechatHtml = ''
    if (draft.modules && draft.modules.length > 0) {
      wechatHtml = htmlToWechat(draft.modules)
    } else if (draft.content) {
      wechatHtml = rawHtmlToWechat(draft.content)
    }

    const info = `ID: ${draft.id}\n标题: ${draft.title}\n作者: ${draft.author || '-'}\n摘要: ${draft.summary || '-'}\n封面图: ${draft.cover_image_url || '-'}\n微信草稿ID: ${draft.wechat_media_id || '未推送'}\n预览链接: ${draft.wechat_preview_url || '-'}`
    return {
      content: [
        { type: 'text', text: info },
        { type: 'text', text: `\n\n--- 微信HTML（${wechatHtml.length} 字符）---\n${wechatHtml.substring(0, 500)}...` },
      ],
    }
  }
)

// ─── wx_save_local_draft ──────────────────────────────────────────────────────

server.tool(
  'wx_save_local_draft',
  '新建或更新本地草稿（传 id 则更新，不传则新建）',
  {
    id: z.string().optional().describe('草稿 ID（更新时传入）'),
    title: z.string().describe('文章标题'),
    content: z.string().optional().describe('HTML 内容'),
    author: z.string().optional().describe('作者'),
    summary: z.string().optional().describe('摘要（150字以内）'),
    cover_image_url: z.string().optional().describe('封面图 URL'),
  },
  async (params) => {
    const draft = await saveDraft({
      id: params.id,
      title: params.title,
      content: params.content,
      author: params.author,
      summary: params.summary,
      cover_image_url: params.cover_image_url,
    })
    return { content: [{ type: 'text', text: `草稿已保存，ID: ${draft.id}，标题: ${draft.title}` }] }
  }
)

// ─── wx_delete_local_draft ────────────────────────────────────────────────────

server.tool(
  'wx_delete_local_draft',
  '删除本地草稿',
  { id: z.string().describe('草稿 ID') },
  async ({ id }) => {
    await deleteDraft(id)
    return { content: [{ type: 'text', text: `已删除草稿 ${id}` }] }
  }
)

// ─── wx_push_to_wechat ────────────────────────────────────────────────────────

server.tool(
  'wx_push_to_wechat',
  '将本地草稿推送到微信草稿箱（自动上传图片、转换格式）',
  {
    draftId: z.string().describe('本地草稿 ID'),
    title: z.string().optional().describe('覆盖文章标题'),
    author: z.string().optional().describe('覆盖作者'),
    summary: z.string().optional().describe('覆盖摘要'),
    coverImageUrl: z.string().optional().describe('覆盖封面图 URL'),
  },
  async (params) => {
    const { mediaId, previewUrl } = await pushToWechat(params.draftId, {
      title: params.title,
      author: params.author,
      summary: params.summary,
      coverImageUrl: params.coverImageUrl,
    })
    return {
      content: [{
        type: 'text',
        text: `推送成功\nMedia ID: ${mediaId}\n预览链接: ${previewUrl}`,
      }],
    }
  }
)

// ─── wx_publish ───────────────────────────────────────────────────────────────

server.tool(
  'wx_publish',
  '将微信草稿发布到公众号',
  { mediaId: z.string().describe('微信草稿 media_id') },
  async ({ mediaId }) => {
    const publishId = await publishDraft(mediaId)
    return { content: [{ type: 'text', text: `发布成功，publish_id: ${publishId}` }] }
  }
)

// ─── wx_list_wx_drafts ────────────────────────────────────────────────────────

server.tool(
  'wx_list_wx_drafts',
  '获取微信草稿箱列表',
  {
    offset: z.number().optional().default(0).describe('偏移量'),
    count: z.number().optional().default(10).describe('数量'),
  },
  async ({ offset, count }) => {
    const result = await getWxDraftList(offset, count)
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

// ─── wx_upload_image ──────────────────────────────────────────────────────────

server.tool(
  'wx_upload_image',
  '上传图片到微信内容图片库（支持 URL 输入，返回微信 URL）',
  {
    imageUrl: z.string().describe('图片 URL（支持 WebP，自动转换）'),
  },
  async ({ imageUrl }) => {
    const wxUrl = await uploadImageFromUrl(imageUrl)
    return { content: [{ type: 'text', text: `上传成功\n微信图片 URL: ${wxUrl}` }] }
  }
)

export async function startMcpServer() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

const transport = new StdioServerTransport()
await server.connect(transport)
