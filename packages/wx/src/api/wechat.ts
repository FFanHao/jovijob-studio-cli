import fs from 'fs'
import path from 'path'
import os from 'os'
import axios from 'axios'
import FormData from 'form-data'
import sharp from 'sharp'
import { getValidAccessToken } from '../config.js'
import { getDraft, saveDraft } from './supabase.js'
import type { WechatArticle } from '../types.js'

const WX_BASE = 'https://api.weixin.qq.com'
const TEMP_DIR = path.join(os.tmpdir(), 'jovipost-wx')

function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true })
  }
}

// ───── 草稿管理 ─────

export async function addDraft(article: WechatArticle): Promise<string> {
  const token = await getValidAccessToken()
  const res = await axios.post(`${WX_BASE}/cgi-bin/draft/add?access_token=${token}`, {
    articles: [article],
  })
  if (res.data.errcode) {
    throw new Error(`新建草稿失败: ${res.data.errmsg} (${res.data.errcode})`)
  }
  return res.data.media_id as string
}

export async function updateDraft(mediaId: string, article: WechatArticle): Promise<void> {
  const token = await getValidAccessToken()
  const res = await axios.post(`${WX_BASE}/cgi-bin/draft/update?access_token=${token}`, {
    media_id: mediaId,
    index: 0,
    articles: article,
  })
  if (res.data.errcode && res.data.errcode !== 0) {
    throw new Error(`更新草稿失败: ${res.data.errmsg} (${res.data.errcode})`)
  }
}

export async function publishDraft(mediaId: string): Promise<string> {
  const token = await getValidAccessToken()
  const res = await axios.post(`${WX_BASE}/cgi-bin/freepublish/submit?access_token=${token}`, {
    media_id: mediaId,
  })
  if (res.data.errcode && res.data.errcode !== 0) {
    throw new Error(`发布失败: ${res.data.errmsg} (${res.data.errcode})`)
  }
  return res.data.publish_id as string
}

export async function getWxDraftList(offset = 0, count = 10): Promise<any> {
  const token = await getValidAccessToken()
  const res = await axios.post(`${WX_BASE}/cgi-bin/draft/get?access_token=${token}`, {
    offset,
    count,
    no_content: 0,
  })
  if (res.data.errcode && res.data.errcode !== 0) {
    throw new Error(`获取草稿列表失败: ${res.data.errmsg} (${res.data.errcode})`)
  }
  return res.data
}

// ───── 图片上传 ─────

export async function uploadContentImage(filePath: string): Promise<string> {
  const token = await getValidAccessToken()
  const form = new FormData()
  form.append('media', fs.createReadStream(filePath), { filename: path.basename(filePath) })

  const res = await axios.post(`${WX_BASE}/cgi-bin/media/uploadimg?access_token=${token}`, form, {
    headers: form.getHeaders(),
  })
  if (res.data.errcode) {
    throw new Error(`上传内容图片失败: ${res.data.errmsg} (${res.data.errcode})`)
  }
  return res.data.url as string
}

export async function uploadCoverImage(filePath: string): Promise<string> {
  const token = await getValidAccessToken()
  const form = new FormData()
  form.append('media', fs.createReadStream(filePath), { filename: path.basename(filePath) })

  const res = await axios.post(
    `${WX_BASE}/cgi-bin/material/add_material?access_token=${token}&type=image`,
    form,
    { headers: form.getHeaders() }
  )
  if (res.data.errcode) {
    throw new Error(`上传封面图片失败: ${res.data.errmsg} (${res.data.errcode})`)
  }
  return res.data.media_id as string
}

export async function uploadImageFromUrl(imageUrl: string): Promise<string> {
  // 已在微信素材库的图片直接返回
  if (imageUrl.includes('mmbiz.qpic.cn') || imageUrl.includes('mmbiz.qlogo.cn')) {
    return imageUrl
  }

  ensureTempDir()

  // 下载图片
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
  const contentType = (response.headers['content-type'] as string) || ''
  const isWebP = imageUrl.toLowerCase().endsWith('.webp') || contentType.includes('image/webp')

  const rawBuffer = Buffer.from(response.data as ArrayBuffer)
  const filename = `wx_upload_${Date.now()}.jpg`
  const tmpPath = path.join(TEMP_DIR, filename)

  if (isWebP) {
    const converted = await sharp(rawBuffer).jpeg({ quality: 90 }).toBuffer()
    fs.writeFileSync(tmpPath, converted)
  } else {
    fs.writeFileSync(tmpPath, rawBuffer)
  }

  try {
    const wxUrl = await uploadContentImage(tmpPath)
    return wxUrl
  } finally {
    fs.unlinkSync(tmpPath)
  }
}

// ───── 推送草稿到微信 ─────

export async function pushToWechat(
  draftId: string,
  options: { title?: string; author?: string; summary?: string; coverImageUrl?: string } = {}
): Promise<{ mediaId: string; previewUrl: string }> {
  // 获取本地草稿
  const draft = await getDraft(draftId)

  // 组合 HTML
  let html: string
  if (draft.content) {
    html = draft.content
  } else if (draft.modules && draft.modules.length > 0) {
    const { htmlToWechat } = await import('../utils/html.js')
    html = htmlToWechat(draft.modules)
  } else {
    throw new Error('草稿内容为空，无法推送')
  }

  // 扫描并上传所有外部图片
  const imgRegex = /<img[^>]+src="([^"]+)"/gi
  const imgUrls: string[] = []
  let match: RegExpExecArray | null
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1]
    if (src && !src.includes('mmbiz.qpic.cn') && !src.includes('data:')) {
      imgUrls.push(src)
    }
  }

  // 上传图片并替换 URL
  for (const url of [...new Set(imgUrls)]) {
    try {
      const wxUrl = await uploadImageFromUrl(url)
      html = html.split(url).join(wxUrl)
    } catch (err) {
      console.warn(`跳过图片上传失败 ${url}: ${(err as Error).message}`)
    }
  }

  // 上传封面图
  let thumbMediaId: string | undefined
  const coverUrl = options.coverImageUrl || draft.cover_image_url
  if (coverUrl) {
    try {
      // 先下载封面图到临时文件
      ensureTempDir()
      const response = await axios.get(coverUrl, { responseType: 'arraybuffer' })
      const isWebP = coverUrl.toLowerCase().endsWith('.webp') ||
        ((response.headers['content-type'] as string) || '').includes('image/webp')
      const rawCoverBuffer = Buffer.from(response.data as ArrayBuffer)
      const tmpPath = path.join(TEMP_DIR, `cover_${Date.now()}.jpg`)
      if (isWebP) {
        const converted = await sharp(rawCoverBuffer).jpeg({ quality: 90 }).toBuffer()
        fs.writeFileSync(tmpPath, converted)
      } else {
        fs.writeFileSync(tmpPath, rawCoverBuffer)
      }
      try {
        thumbMediaId = await uploadCoverImage(tmpPath)
      } finally {
        fs.unlinkSync(tmpPath)
      }
    } catch (err) {
      console.warn(`封面图上传失败: ${(err as Error).message}`)
    }
  }

  const article: WechatArticle = {
    title: options.title || draft.title || '无标题',
    author: options.author || draft.author || '',
    digest: options.summary || draft.summary || '',
    content: html,
    need_open_comment: 0,
    only_fans_can_comment: 0,
  }
  if (thumbMediaId) {
    article.thumb_media_id = thumbMediaId
  }

  // 推送或更新草稿
  let mediaId: string
  if (draft.wechat_media_id) {
    await updateDraft(draft.wechat_media_id, article)
    mediaId = draft.wechat_media_id
  } else {
    mediaId = await addDraft(article)
  }

  const previewUrl = `https://mp.weixin.qq.com/cgi-bin/showdraft?action=edit&draft_id=${mediaId}`

  // 更新本地草稿记录
  await saveDraft({ ...draft, wechat_media_id: mediaId, wechat_preview_url: previewUrl })

  return { mediaId, previewUrl }
}
