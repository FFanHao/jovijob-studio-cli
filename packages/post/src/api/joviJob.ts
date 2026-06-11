import https from 'https'
import { buildFormData } from '../utils/form-builder.js'

// ===== 类型定义 =====

export interface JobData {
  id?: string
  title?: string
  gongsi_id?: string
  gongsi_title?: string
  member_id?: string
  member_id_title?: string
  member_name?: string
  states?: string
  states_txt?: string
  xingzhi?: string
  xingzhi_title?: string
  xinzi_currency?: string
  xinzi_currency_title?: string
  xinzi_types?: string
  xinzi_types_title?: string
  xinzi_min?: string
  xinzi_max?: string
  xinzi_txt?: string
  jingyan?: string
  jingyan_title?: string
  xueli?: string
  xueli_title?: string
  zhiwei_level2_id0?: string
  zhiwei_level1_id0?: string
  zhiwei_id0?: string
  zhiwei_title?: string
  label_id0?: string
  label_title?: string
  country_id0?: string
  country_title?: string
  province_id0?: string
  province_title?: string
  city_id0?: string
  city_title?: string
  addr?: string
  content?: string
  content2?: string
  content3?: string
  toudi_mode?: string
  toudi_mode_title?: string
  from_url?: string
  add_time?: string
  add_time2?: string
  update_time?: string
  hits?: string
  collect?: string
  renew?: string
  savedAt?: string
}

export const defaultJobData: JobData = {
  title: '',
  gongsi_id: '650',
  gongsi_title: '',
  member_id: '153',
  member_id_title: '范昊（fan.hao@jovijob.com）',
  states: '2',
  xingzhi: '1',
  xinzi_currency: '2',
  xinzi_types: '6',
  xinzi_min: '',
  xinzi_max: '',
  jingyan: '',
  xueli: '',
  zhiwei_level2_id0: '',
  zhiwei_level1_id0: '',
  zhiwei_id0: '',
  label_id0: '',
  country_id0: '2',
  province_id0: '',
  city_id0: '',
  addr: '',
  content: '',
  content2: '',
  content3: '',
  toudi_mode: '2',
  from_url: '',
}

export interface PublishResult {
  code: number
  msg: string
  id?: string
}

export interface JobListItem {
  id: string
  title: string
  salary: string
  company: string
  states: string
  statusText: string
  publishDate: string
  contact: string
  contactEmail: string
}

export interface CompanyInfo {
  id: string
  name: string
  industry: string
  scale: string
  jobCount: number
}

export interface RecruiterInfo {
  id: string
  name: string
  position: string
  companyName: string
}

export interface LabelInfo {
  id: string
  name: string
}

// ===== 常量 =====

const JOVIJOB_HOST = 'www.jovijob.com'
const JOVIJOB_PATH = '/adminIsAdmin/php_job.php'

// ===== HTTP 工具 =====

function httpsGet(path: string, cookie?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: JOVIJOB_HOST,
      port: 443,
      path,
      method: 'GET',
      timeout: 30000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Host': JOVIJOB_HOST,
        'Referer': 'https://www.jovijob.com/adminIsAdmin/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ...(cookie ? { 'Cookie': cookie } : {}),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')) })
    req.end()
  })
}

function httpsPost(path: string, body: string, cookie: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: JOVIJOB_HOST,
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': Buffer.byteLength(body),
        'Cookie': cookie,
        'Host': JOVIJOB_HOST,
        'Origin': 'https://www.jovijob.com',
        'Referer': 'https://www.jovijob.com/adminIsAdmin/php_job.php',
        'X-Requested-With': 'XMLHttpRequest',
        'userToken': '',
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function isLoginPage(html: string): boolean {
  return html.includes('type="password"') || html.includes("type='password'") ||
    html.includes('name="password"') || html.includes("name='password'")
}

// ===== 核心 API =====

/** 发布或更新职位（有 id 字段则更新） */
export async function publishJob(job: JobData, cookie: string): Promise<PublishResult> {
  const body = buildFormData(job)
  const raw = await httpsPost(JOVIJOB_PATH, body, cookie)
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch { /* fall through */ }
  return { code: 200, msg: '操作完成' }
}

/** 获取职位列表 */
export async function getJobList(cookie: string): Promise<JobListItem[]> {
  const html = await httpsGet(JOVIJOB_PATH, cookie)
  if (isLoginPage(html)) throw new Error('登录已失效，请重新获取 Cookie')
  return parseJobListFromHTML(html)
}

/** 获取职位详情 */
export async function getJobDetail(jobId: string, cookie: string): Promise<JobData> {
  const html = await httpsGet(`${JOVIJOB_PATH}?id=${jobId}&act=do`, cookie)
  if (isLoginPage(html)) throw new Error('登录已失效，请重新获取 Cookie')
  // 尝试 JSON
  const trimmed = html.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const jsonData = JSON.parse(trimmed)
    if (jsonData.data) return jsonData.data
    if (jsonData.id || jsonData.title) return jsonData
  }
  return parseJobDetailFromHTML(html, jobId)
}

/** 获取公司列表 */
export async function getCompanies(cookie: string): Promise<CompanyInfo[]> {
  const companies: CompanyInfo[] = []

  const firstPage = await httpsGet('/adminIsAdmin/php_gongsi.php', cookie)
  if (isLoginPage(firstPage)) throw new Error('登录已失效，请重新获取 Cookie')

  const pageInfoMatch = firstPage.match(/共(\d+)条信息、分(\d+)页显示/)
  const totalPages = pageInfoMatch ? parseInt(pageInfoMatch[2]) : 1

  const pages = [firstPage]
  for (let page = 2; page <= totalPages; page++) {
    pages.push(await httpsGet(`/adminIsAdmin/php_gongsi.php?Page=${page}`, cookie))
  }

  for (const html of pages) {
    const regex = /name="selAnnounce\[\]" value="(\d+)"[\s\S]*?(?=name="selAnnounce\[\]" value=|<tr class="tr2"|$)/g
    let match
    while ((match = regex.exec(html)) !== null) {
      const block = match[0]
      const id = match[1]

      let name = ''
      const nameMatch = block.match(/<div>([^<]+)<\/div>/)
      if (nameMatch) name = nameMatch[1].trim()

      let scale = ''
      const scaleMatch = block.match(/<span[^>]*>\[[^\]]+\]<\/span>\s*<span[^>]*>([^<]+)<\/span>/)
      if (scaleMatch) scale = scaleMatch[1].trim()

      let industry = ''
      const pMatches = block.match(/<p[^>]*>([^<]+)<\/p>/g)
      if (pMatches) {
        for (const p of pMatches) {
          const text = p.replace(/<[^>]+>/g, '').trim()
          if (text && !text.includes('置顶') && !text.includes('热门') && !text.includes('：')) {
            industry = text; break
          }
        }
      }

      let jobCount = 0
      const jobCountMatch = block.match(/(\d+)\s*\/\s*\d+\s*\/\s*\d+\s*\/\s*\d+/)
      if (jobCountMatch) jobCount = parseInt(jobCountMatch[1]) || 0

      if (id && name) companies.push({ id, name, industry, scale, jobCount })
    }
  }

  companies.sort((a, b) => parseInt(b.id) - parseInt(a.id))
  return companies
}

/** 获取指定公司的招聘人列表 */
export async function getRecruiters(cookie: string, gongsiId?: string): Promise<RecruiterInfo[]> {
  const firstPage = await httpsGet('/adminIsAdmin/A_member.php?userCount=current_identity12', cookie)
  if (isLoginPage(firstPage)) throw new Error('登录已失效，请重新获取 Cookie')

  const pageInfoMatch = firstPage.match(/共(\d+)条信息、分(\d+)页显示/)
  const totalPages = pageInfoMatch ? parseInt(pageInfoMatch[2]) : 1

  const pages = [firstPage]
  for (let page = 2; page <= totalPages; page++) {
    pages.push(await httpsGet(`/adminIsAdmin/A_member.php?userCount=current_identity12&Page=${page}`, cookie))
  }

  const recruiters: RecruiterInfo[] = []
  const seen = new Set<string>()

  for (const html of pages) {
    const regex = /name="selAnnounce\[\]" value="(\d+)"[\s\S]*?(?=name="selAnnounce\[\]" value=|<tr class="tr|$)/g
    let match
    while ((match = regex.exec(html)) !== null) {
      const block = match[0]
      const memberId = match[1]
      if (seen.has(memberId)) continue
      seen.add(memberId)

      let name = ''
      const nameMatch = block.match(/<p>([^<]+)<\/p>/)
      if (nameMatch) name = nameMatch[1].replace(/用户\d+/, '').trim()

      let position = ''
      const posMatches = block.match(/<p style='color:#999999;font-size:12px;'>([^<]*)<\/p>/g)
      if (posMatches && posMatches.length >= 1) {
        position = posMatches[0].replace(/<[^>]+>/g, '').trim()
      }

      let companyName = ''
      if (posMatches && posMatches.length >= 2) {
        companyName = posMatches[1].replace(/<[^>]+>/g, '').trim()
      }

      if (memberId && name) {
        recruiters.push({ id: memberId, name, position, companyName })
      }
    }
  }

  // 如果指定了公司 ID，则先通过公司 ID 查公司名，再过滤
  if (gongsiId) {
    const companies = await getCompanies(cookie)
    const company = companies.find((c) => c.id === gongsiId)
    if (company) {
      return recruiters.filter((r) => r.companyName === company.name)
    }
  }

  return recruiters
}

/** 获取标签列表（公开页面，无需 Cookie） */
export async function getLabels(): Promise<LabelInfo[]> {
  const html = await httpsGet('/job/')
  const labels: LabelInfo[] = []
  const seen = new Set<string>()

  // 从求职页面标签筛选区抓取 label
  const regex = /[?&]label=(\d+)[^"]*"[^>]*>([^<]+)</g
  let match
  while ((match = regex.exec(html)) !== null) {
    const id = match[1]
    const name = match[2].trim()
    if (id && name && !seen.has(id)) {
      seen.add(id)
      labels.push({ id, name })
    }
  }

  // 备用：从标签 checkbox 或 data 属性解析
  if (labels.length === 0) {
    const altRegex = /value="(\d+)"[^>]*data-name="([^"]+)"/g
    while ((match = altRegex.exec(html)) !== null) {
      const id = match[1]
      const name = match[2].trim()
      if (!seen.has(id)) { seen.add(id); labels.push({ id, name }) }
    }
  }

  return labels
}

/** 检查 Cookie 是否有效 */
export async function checkAuth(cookie: string): Promise<{ valid: boolean; message: string }> {
  try {
    const html = await httpsGet(JOVIJOB_PATH, cookie)
    if (isLoginPage(html)) {
      return { valid: false, message: 'Cookie 已失效，请重新获取' }
    }
    // 如果能解析到职位列表或表单，说明有效
    const hasContent = html.includes('php_job') || html.includes('product_xiugai') || html.length > 5000
    if (hasContent) {
      return { valid: true, message: 'Cookie 有效，登录正常' }
    }
    return { valid: false, message: '返回内容异常，Cookie 可能已失效' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { valid: false, message: `连接失败：${msg}` }
  }
}

// ===== HTML 解析 =====

function parseJobListFromHTML(html: string): JobListItem[] {
  const jobs: JobListItem[] = []
  let searchStart = 0

  while (true) {
    const trStart = html.indexOf('<tr class="tr1 product_xiugai">', searchStart)
    if (trStart === -1) break

    let depth = 1
    let pos = trStart + 29
    let endPos = -1

    while (pos < html.length && depth > 0) {
      const substr = html.substring(pos, pos + 4)
      if (substr === '<tr>' || substr === '<tr ' || substr === '<tr\t' || substr === '<tr\n') depth++
      else if (substr === '</tr') depth--
      if (depth === 0) { endPos = pos + 5; break }
      pos++
    }

    if (endPos === -1) break
    const tr = html.substring(trStart, endPos)

    let id = ''
    const idMatch = tr.match(/name="selAnnounce\[\]" value="(\d+)"/)
    if (idMatch) id = idMatch[1]
    if (!id) { searchStart = trStart + 1; continue }

    let title = ''
    const titleMatch = tr.match(/<div class="ellipsis1">([^<]+)<\/div>/)
    if (titleMatch) title = titleMatch[1].trim()

    let salary = ''
    const salaryMatch = tr.match(/(€|￥)(\d+(?:-\d+)?(?:每年|每月|每小时)?)/)
    if (salaryMatch) salary = salaryMatch[1] + salaryMatch[2]

    let company = ''
    const companyMatch = tr.match(/<span class="fs">企业：<\/span>[\s\S]*?<span class="ellipsis1">([^<]+)<\/span>/)
    if (companyMatch) company = companyMatch[1].trim()

    let statusText = ''
    let states = ''
    const statusColorMatch = tr.match(/<span style="color:([^"]+)">([^<]+)<\/span>/)
    if (statusColorMatch) {
      const content = statusColorMatch[2].trim()
      if (content.includes('招聘中') || content.includes('审核通过')) { statusText = '已发布'; states = '2' }
      else if (content.includes('下架')) { statusText = '已下架'; states = '3' }
      else if (content.includes('草稿')) { statusText = '草稿'; states = '1' }
      else { statusText = content; states = '4' }
    }

    let contact = ''
    let contactEmail = ''
    const contactMatches = tr.match(/<div>([^<]+)<\/div><div>([^<]+)<\/div>/g)
    if (contactMatches && contactMatches.length > 0) {
      const last = contactMatches[contactMatches.length - 1].match(/<div>([^<]+)<\/div><div>([^<]+)<\/div>/)
      if (last) { contact = last[1].trim(); contactEmail = last[2].trim() }
    }

    let publishDate = ''
    const dateMatch = tr.match(/(\d{4}-\d{2}-\d{2})/)
    if (dateMatch) publishDate = dateMatch[1]

    jobs.push({ id, title, salary, company, states, statusText, publishDate, contact, contactEmail })
    searchStart = endPos
  }

  return jobs
}

function parseJobDetailFromHTML(html: string, jobId: string): JobData {
  const detail: JobData = { id: jobId }

  const titleMatch = html.match(/<input[^>]*name="title"[^>]*value="([^"]*)"/i)
  if (titleMatch) detail.title = titleMatch[1]

  const gongsiIdMatch = html.match(/<input[^>]*name="gongsi_id"[^>]*value="([^"]*)"/i)
  if (gongsiIdMatch) detail.gongsi_id = gongsiIdMatch[1]

  const statesMatch = html.match(/name="states"[^>]*value="(\d+)"/i)
  if (statesMatch) detail.states = statesMatch[1]

  const currencyMatch = html.match(/name="xinzi_currency"[^>]*>[\s\S]*?<option[^>]+value="([^"]+)"[^>]+selected[^>]*>/i)
  if (currencyMatch) detail.xinzi_currency = currencyMatch[1]

  const typesMatch = html.match(/name="xinzi_types"[^>]*>[\s\S]*?<option[^>]+value="([^"]+)"[^>]+selected[^>]*>/i)
  if (typesMatch) detail.xinzi_types = typesMatch[1]

  const minMatch = html.match(/name="xinzi_min"[^>]*value="([^"]+)"/i)
  if (minMatch) detail.xinzi_min = minMatch[1]

  const maxMatch = html.match(/name="xinzi_max"[^>]*value="([^"]+)"/i)
  if (maxMatch) detail.xinzi_max = maxMatch[1]

  const jingyanMatch = html.match(/name="jingyan"[^>]*>[\s\S]*?<option[^>]+value="([^"]+)"[^>]+selected[^>]*>/i)
  if (jingyanMatch) detail.jingyan = jingyanMatch[1]

  const xueliMatch = html.match(/name="xueli"[^>]*>[\s\S]*?<option[^>]+value="([^"]+)"[^>]+selected[^>]*>/i)
  if (xueliMatch) detail.xueli = xueliMatch[1]

  const xingzhiMatch = html.match(/name="xingzhi"[^>]*>[\s\S]*?<option[^>]+value="([^"]+)"[^>]+selected[^>]*>/i)
  if (xingzhiMatch) detail.xingzhi = xingzhiMatch[1]

  const zhiwei1Match = html.match(/name="zhiwei_level1_id0"[^>]*>[\s\S]*?<option[^>]+value="([^"]+)"[^>]+selected[^>]*>/i)
  if (zhiwei1Match) detail.zhiwei_level1_id0 = zhiwei1Match[1]

  const zhiwei2Match = html.match(/name="zhiwei_level2_id0"[^>]*>[\s\S]*?<option[^>]+value="([^"]+)"[^>]+selected[^>]*>/i)
  if (zhiwei2Match) detail.zhiwei_level2_id0 = zhiwei2Match[1]

  const zhiwei3Match = html.match(/name="zhiwei_id0"[^>]*>[\s\S]*?<option[^>]+value="([^"]+)"[^>]+selected[^>]*>/i)
  if (zhiwei3Match) detail.zhiwei_id0 = zhiwei3Match[1]

  const countryMatch = html.match(/name="country_id0"[^>]*>[\s\S]*?<option[^>]+value="([^"]+)"[^>]+selected[^>]*>/i)
  if (countryMatch) detail.country_id0 = countryMatch[1]

  const provinceMatch = html.match(/name="province_id0"[^>]*>[\s\S]*?<option[^>]+value="([^"]+)"[^>]+selected[^>]*>/i)
  if (provinceMatch) detail.province_id0 = provinceMatch[1]

  const cityMatch = html.match(/name="city_id0"[^>]*>[\s\S]*?<option[^>]+value="([^"]+)"[^>]+selected[^>]*>/i)
  if (cityMatch) detail.city_id0 = cityMatch[1]

  const toudiMatch = html.match(/name="toudi_mode"[^>]*>[\s\S]*?<option[^>]+value="([^"]+)"[^>]+selected[^>]*>/i)
  if (toudiMatch) detail.toudi_mode = toudiMatch[1]

  const contentMatch = html.match(/<textarea[^>]*name="content"[^>]*>([\s\S]*?)<\/textarea>/i)
  if (contentMatch) detail.content = contentMatch[1].trim()

  const content2Match = html.match(/<textarea[^>]*name="content2"[^>]*>([\s\S]*?)<\/textarea>/i)
  if (content2Match) detail.content2 = content2Match[1].trim()

  const content3Match = html.match(/<textarea[^>]*name="content3"[^>]*>([\s\S]*?)<\/textarea>/i)
  if (content3Match) detail.content3 = content3Match[1].trim()

  return detail
}
