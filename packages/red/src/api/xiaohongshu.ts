import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import os from 'os'

// ===== Supabase =====
const supabaseUrl = process.env.SUPABASE_URL || 'https://qalkhkirjtfpyrbozyxh.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_4NRhzQA6rFjN6A5Vk8zK_A_UjxH9MI9'
const supabase = createClient(supabaseUrl, supabaseKey)

// ===== 类型 =====
export interface ImageDraft {
  id?: string
  job_id?: string
  title: string
  company: string
  company_logo?: string
  job_type?: string
  salary?: string
  currency?: string
  city?: string
  experience?: string
  education?: string
  tags?: string[]
  job_content?: string
  job_requirement?: string
  job_benefits?: string
  job_url?: string
  wechat_title?: string
  wechat_background?: string
  export_wechat?: boolean
  export_xiaohongshu?: boolean
  created_at?: string
  updated_at?: string
}

// ===== Supabase CRUD =====

export async function listDrafts(): Promise<ImageDraft[]> {
  const { data, error } = await supabase
    .from('image_drafts')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getDraft(id: string): Promise<ImageDraft | null> {
  const { data, error } = await supabase
    .from('image_drafts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function saveDraft(draft: ImageDraft): Promise<ImageDraft | null> {
  const now = new Date().toISOString()

  if (draft.id) {
    const { data, error } = await supabase
      .from('image_drafts')
      .update({ ...draft, updated_at: now })
      .eq('id', draft.id)
      .select()
      .single()
    if (!error && data) return data
  }

  const { data, error } = await supabase
    .from('image_drafts')
    .insert({ ...draft, created_at: now, updated_at: now })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDraft(id: string): Promise<boolean> {
  const { error } = await supabase.from('image_drafts').delete().eq('id', id)
  if (error) throw error
  return true
}

// ===== 模板替换（移植自 jovijob-studio/electron/main.ts） =====

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function replaceTemplate(html: string, data: Record<string, any>): string {
  // 1. 数组循环 {{#each key}}...{{/each}}
  for (const [key, value] of Object.entries(data)) {
    if (!Array.isArray(value) || value.length === 0) {
      html = html.replace(new RegExp(`{{#each\\s+${key}}}[\\s\\S]*?{{/each}}`, 'g'), '')
      continue
    }
    html = html.replace(new RegExp(`{{#each\\s+${key}}}([\\s\\S]*?){{/each}}`, 'g'), (_, template) => {
      return (value as string[]).map((item) => template.replace(/{{this}}/g, item)).join('')
    })
  }

  // 2. 条件块 {{#if key}}...{{/if}}
  const ifKeys = new Set<string>()
  const ifKeyRegex = /{{#if\s+(\w+)}}/g
  let ifKeyMatch
  while ((ifKeyMatch = ifKeyRegex.exec(html)) !== null) {
    ifKeys.add(ifKeyMatch[1])
  }

  for (const key of ifKeys) {
    const value = data[key]
    const isEmpty = value === undefined || value === null || value === '' ||
                    (Array.isArray(value) && value.length === 0)
    if (isEmpty) {
      html = html.replace(new RegExp(`{{#if\\s+${key}}}[\\s\\S]*?{{else}}([\\s\\S]*?){{/if}}`, 'g'), '$1')
      html = html.replace(new RegExp(`{{#if\\s+${key}}}[\\s\\S]*?{{/if}}`, 'g'), '')
    }
  }

  for (const key of ifKeys) {
    const value = data[key]
    const isEmpty = value === undefined || value === null || value === '' ||
                    (Array.isArray(value) && value.length === 0)
    if (!isEmpty) {
      html = html.replace(new RegExp(`{{#if\\s+${key}}}([\\s\\S]*?){{else}}[\\s\\S]*?{{/if}}`, 'g'), '$1')
      html = html.replace(new RegExp(`{{#if\\s+${key}}}`, 'g'), '')
      html = html.replace(/{{\/if}}/g, '')
    }
  }

  // 3. 公司 Logo 特殊处理
  if (data.company_logo) {
    html = html.replace(
      /<img src="{{company_logo}}" alt="公司Logo" id="logoImg" style="display:none">/,
      '<img src="{{company_logo}}" alt="公司Logo" id="logoImg" style="display:block">'
    )
    html = html.replace(
      /<span class="company-logo-text" id="logoText">{{company}}<\/span>/,
      '<span class="company-logo-text" id="logoText" style="display:none">{{company}}</span>'
    )
  } else {
    html = html.replace(
      /<img src="{{company_logo}}" alt="公司Logo" id="logoImg" style="display:none">/,
      '<img src="" alt="公司Logo" id="logoImg" style="display:none">'
    )
    html = html.replace(
      /<span class="company-logo-text" id="logoText">{{company}}<\/span>/,
      '<span class="company-logo-text" id="logoText" style="display:block">{{company}}</span>'
    )
  }

  // 4. 标签区域
  if (!data.tags || (data.tags as string[]).length === 0) {
    html = html.replace(/<div class="tags-section" id="tagsSection">[\s\S]*?<\/div>/, '')
  }

  // 5. 信息卡片区域
  const hasInfoCards = data.job_type || data.salary || data.city || data.experience || data.education
  if (!hasInfoCards) {
    html = html.replace(/<div class="info-cards" id="infoCards">[\s\S]*?<\/div>/, '')
  }

  // 6. 内容区域
  const hasContent = data.job_content || data.job_requirement || data.job_benefits
  if (!hasContent) {
    html = html.replace(/<div class="content-section" id="contentSection">[\s\S]*?<\/div>/, '')
  }

  // 7. 薪资图标
  if (html.includes('{{salaryIcon}}')) {
    const currency = (data.currency as string) || '3'
    const symbol = currency === '1' ? '¥' : currency === '2' ? '€' : currency === '4' ? '£' : '$'
    const salaryIconSvg = `<svg class="info-card-icon" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="white" stroke-width="2">
      <text x="16" y="23" text-anchor="middle" fill="white" stroke="none" font-size="22" font-weight="bold">${symbol}</text>
    </svg>`
    html = html.replace(/{{salaryIcon}}/g, salaryIconSvg)
  }

  // 8. 简单变量替换 {{key}}
  const validKeys = new Set<string>()
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '' && !Array.isArray(value)) {
      validKeys.add(key)
    }
  }
  html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => validKeys.has(key) ? match : '')
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '' || Array.isArray(value)) continue
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
  }

  return html
}

// ===== 图片生成 =====

const __dirname = dirname(fileURLToPath(import.meta.url))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateCover(data: Record<string, any>, outputPath?: string): Promise<{ success: boolean; path?: string; error?: string }> {
  const templatePath = join(__dirname, 'data', 'xiaohongshu-cover.html')
  const templateHtml = fs.readFileSync(templatePath, 'utf-8')

  if (!data.logo_url) {
    data.logo_url = 'https://jovijob.com/image/upload/everydayjob.png'
  }

  const html = replaceTemplate(templateHtml, data)

  const finalOutputPath = outputPath || join(os.homedir(), 'Downloads', `xhs-cover-${Date.now()}.png`)

  try {
    const puppeteer = await import('puppeteer')
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1440, deviceScaleFactor: 2 })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.screenshot({ path: finalOutputPath as `${string}.png`, type: 'png', omitBackground: true })
    await browser.close()
    return { success: true, path: finalOutputPath }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export function previewHtml(data: Record<string, any>): string {
  const templatePath = join(__dirname, 'data', 'xiaohongshu-cover.html')
  const templateHtml = fs.readFileSync(templatePath, 'utf-8')
  if (!data.logo_url) {
    data.logo_url = 'https://jovijob.com/image/upload/everydayjob.png'
  }
  return replaceTemplate(templateHtml, data)
}
