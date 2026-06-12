// 13 个编辑器模块的纯字符串渲染函数
// 与 jovijob-studio ModuleRenderer.tsx + ArticleEditor.tsx renderModuleToHtml 保持完全一致

type Config = Record<string, any>

function nl2br(text: string): string {
  return (text || '').replace(/\n/g, '<br/>')
}

// 处理内容中的前导空格缩进（仿 processContentWithIndent）
function processContentWithIndent(content: string): string {
  if (!content) return content
  return content.replace(/<p>( {1,8})/g, (_match, spaces: string) => {
    const paddingLeft = spaces.length * 0.5
    return `<p style="padding-left:${paddingLeft}em;margin:0 0 8px;">`
  })
}

// ─── platform-intro ───────────────────────────────────────────────────────────

export function renderPlatformIntro(config: Config): string {
  const gradientStart = config.gradientStart || '#14B8A6'
  const gradientEnd = config.gradientEnd || '#0D9488'
  return `<div style="background:linear-gradient(135deg,${gradientStart} 0%,${gradientEnd} 100%);border-radius:12px;padding:20px 16px;margin:8px 4px;text-align:center;line-height:1;">${
    config.logoUrl ? `<img src="${config.logoUrl}" alt="logo" style="max-width:67px;max-height:53px;margin-bottom:12px;object-fit:contain;">` : ''
  }${
    config.logoText ? `<div style="font-size:24px;color:#fff;margin:0 0 8px;font-weight:600;line-height:1.4;">${config.logoText}</div>` : ''
  }${
    config.tagline ? `<div style="font-size:14px;color:rgba(255,255,255,0.9);margin:0;line-height:1.4;">${config.tagline}</div>` : ''
  }</div>`
}

// ─── main-content ─────────────────────────────────────────────────────────────

export function renderMainContent(config: Config): string {
  const gradientStart = config.gradientStart || '#14B8A6'
  const gradientEnd = config.gradientEnd || '#0D9488'
  const titleSize = config.titleSize || 22
  const titleColor = config.titleColor || '#fff'
  const tags: any[] = config.tags || []
  const contentBlocks: any[] = config.contentBlocks || []

  const tagsHtml = tags.map((tag: any) =>
    `<span style="background:rgba(255,255,255,0.2);padding:5px 12px;border-radius:5px;font-size:13px;color:#fff;">${tag.icon || ''} ${tag.label || ''}</span>`
  ).join('')

  const blocksHtml = contentBlocks.map((block: any, i: number) => {
    const blockTitleColor = block.titleColor || '#14B8A6'
    const blockFontSize = block.fontSize || 14
    const blockLineHeight = block.lineHeight || 1.8
    const blockTextColor = block.textColor || '#666666'
    return `<div style="margin-top:${i > 0 ? '20px' : '0'};margin-bottom:20px;"><h3 style="font-size:17px;color:${blockTitleColor};margin:0 0 12px;font-weight:600;">${block.sectionTitle || ''}</h3><div class="module-content" style="font-size:${blockFontSize}px;line-height:${blockLineHeight};color:${blockTextColor};">${processContentWithIndent(block.content || '')}</div></div>`
  }).join('')

  return `<div style="background:#fff;border-radius:12px;margin:8px 4px;box-shadow:0 2px 6px rgba(0,0,0,0.1);overflow:hidden;"><div style="background:linear-gradient(135deg,${gradientStart} 0%,${gradientEnd} 100%);padding:18px 16px;margin-bottom:12px;"><h1 style="font-size:${titleSize}px;color:${titleColor};margin:0 0 10px;font-weight:600;">${config.title || '请输入主标题'}</h1><div style="display:flex;flex-wrap:wrap;gap:8px;">${tagsHtml}</div></div><div style="padding:0 16px 16px;">${blocksHtml}</div></div>`
}

// ─── job-card ─────────────────────────────────────────────────────────────────
// 手写 HTML，display:table 兼容微信

export function renderJobCard(config: Config, enableLinks: boolean): string {
  const titleColor = config.titleColor || '#14B8A6'
  const tags: any[] = config.tags || []

  const tagsHtml = tags.length > 0
    ? `<div style="margin-bottom:12px;">${tags.map((tag: any) => `<span style="display:inline-block;background:#f5f5f5;padding:3px 8px;border-radius:4px;font-size:12px;color:#666;margin:0 4px 4px 0;">${tag.icon || ''} ${tag.label || ''}</span>`).join('')}</div>`
    : ''

  const detailHtml = config.detailUrl
    ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #f0f0f0;color:${titleColor};font-size:13px;">${enableLinks ? `<a href="${config.detailUrl}" target="_blank" style="color:${titleColor};text-decoration:none;">查看详情/申请职位 → ${config.detailUrl.replace(/^https?:\/\//, '')}</a>` : `查看详情/申请职位 → ${config.detailUrl.replace(/^https?:\/\//, '')}`}</div>`
    : ''

  return `<div style="background:#fff;border-radius:12px;padding:16px;margin:8px 4px;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
<div style="font-size:17px;color:${titleColor};margin:0 0 12px;font-weight:600;line-height:1.3;">${config.title || '职位名称'}</div>
<div style="margin-bottom:10px;"><div style="display:table;width:100%;table-layout:fixed;">${
  config.gongsi_picurl ? `<div style="display:table-cell;width:50px;padding-right:10px;vertical-align:middle;"><img src="${config.gongsi_picurl}" alt="公司Logo" style="width:40px;height:40px;border-radius:6px;border:1px solid #f0f0f0;"></div>` : ''
}<div style="display:table-cell;vertical-align:middle;"><span style="font-size:14px;color:#666;line-height:1.2;">${config.gongsi_title || '公司名称'}</span></div><div style="display:table-cell;vertical-align:middle;text-align:right;white-space:nowrap;"><span style="font-size:14px;color:${titleColor};font-weight:500;">${config.xinzi_txt || '薪资面议'}</span></div></div></div>
<div style="margin-bottom:12px;">${
  config.city_label ? `<span style="display:inline-block;background:#f5f5f5;padding:4px 10px;border-radius:4px;font-size:12px;color:#666;margin:0 4px 4px 0;">📍 ${config.city_label}</span>` : ''
}${
  config.xingzhi_title ? `<span style="display:inline-block;background:#f5f5f5;padding:4px 10px;border-radius:4px;font-size:12px;color:#666;margin:0 4px 4px 0;">${config.xingzhi_title}</span>` : ''
}${
  config.xueli_title ? `<span style="display:inline-block;background:#f5f5f5;padding:4px 10px;border-radius:4px;font-size:12px;color:#666;margin:0 4px 4px 0;">${config.xueli_title}</span>` : ''
}${
  config.jingyan_title ? `<span style="display:inline-block;background:#f5f5f5;padding:4px 10px;border-radius:4px;font-size:12px;color:#666;margin:0 4px 4px 0;">${config.jingyan_title}</span>` : ''
}</div>
${tagsHtml}${
  config.content ? `<div style="font-size:13px;color:#666;line-height:1.6;margin-bottom:8px;"><div style="font-weight:500;color:#333;margin-bottom:4px;">岗位职责：</div><div style="color:#666;">${nl2br(config.content)}</div></div>` : ''
}${
  config.content2 ? `<div style="font-size:13px;color:#666;line-height:1.6;margin-bottom:8px;"><div style="font-weight:500;color:#333;margin-bottom:4px;">任职要求：</div><div style="color:#666;">${nl2br(config.content2)}</div></div>` : ''
}${
  config.content3 ? `<div style="font-size:13px;color:#666;line-height:1.6;margin-bottom:12px;"><div style="font-weight:500;color:#333;margin-bottom:4px;">福利待遇：</div><div style="color:#666;">${nl2br(config.content3)}</div></div>` : ''
}${detailHtml}</div>`
}

// ─── job-list ─────────────────────────────────────────────────────────────────

export function renderJobList(config: Config, enableLinks: boolean): string {
  const titleColor = config.titleColor || '#14B8A6'
  const jobs: any[] = config.jobs || []

  const jobsHtml = jobs.map((job: any, i: number) => {
    const linkHtml = job.detailUrl
      ? (enableLinks
        ? `<a href="${job.detailUrl}" target="_blank" style="color:${titleColor};text-decoration:none;">查看详情 → ${job.detailUrl.replace(/^https?:\/\//, '')}</a>`
        : `查看详情 → ${job.detailUrl.replace(/^https?:\/\//, '')}`)
      : ''
    return `<div style="padding:8px 0;border-bottom:${i < jobs.length - 1 ? '1px solid #f5f5f5' : 'none'};"><div style="font-size:14px;color:#333;font-weight:600;">${job.title || '职位名称'}</div><div style="margin:4px 0;font-size:12px;color:#666;">${job.xinzi_txt ? `<span style="color:${titleColor};font-weight:600;">${job.xinzi_txt}</span>` : '薪资面议'}${job.gongsi_title ? ` | ${job.gongsi_title}` : ''}</div><div style="margin:4px 0;font-size:11px;color:#999;">${job.city_label ? `📍 ${job.city_label}` : ''}${job.xueli_title ? ` | ${job.xueli_title}` : ''}${job.jingyan_title ? ` | ${job.jingyan_title}` : ''}</div>${linkHtml ? `<div style="margin-top:8px;font-size:11px;color:${titleColor};">${linkHtml}</div>` : ''}</div>`
  }).join('')

  return `<div style="background:#fff;border-radius:12px;margin:0 4px 12px;padding:12px 16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);border:1px solid #f0f0f0;"><div style="font-size:14px;color:${titleColor};margin:0 0 10px;font-weight:600;">${config.title || '职位列表'}</div>${jobsHtml}</div>`
}

// ─── reading ──────────────────────────────────────────────────────────────────

export function renderReading(config: Config, enableLinks: boolean): string {
  const titleColor = config.titleColor || '#14B8A5'
  const readings: any[] = config.readings || []

  const itemsHtml = readings.map((item: any, i: number) => {
    const url = enableLinks ? (item.websiteUrl || item.wechatUrl) : (item.wechatUrl || item.websiteUrl)
    const urlHtml = url
      ? (enableLinks
        ? `<a href="${url}" target="_blank" style="color:${titleColor};text-decoration:none;">${url.replace(/^https?:\/\//, '')}</a>`
        : url.replace(/^https?:\/\//, ''))
      : ''
    return `<div style="padding:12px 0;border-bottom:${i < readings.length - 1 ? '1px solid #f0f0f0' : 'none'};"><div style="font-size:15px;color:#333;margin-bottom:4px;">${item.title || '文章标题'}</div><div style="font-size:12px;color:#999;">${item.date || ''}</div>${urlHtml ? `<div style="font-size:11px;color:${titleColor};margin-top:4px;">${urlHtml}</div>` : ''}</div>`
  }).join('')

  return `<div style="background:#fff;border-radius:12px;margin:0 4px 15px;padding:15px 16px;box-shadow:0 2px 6px rgba(0,0,0,0.1);"><div style="font-size:16px;color:${titleColor};margin:0 0 15px;font-weight:600;">${config.title || '推荐阅读'}</div>${itemsHtml}</div>`
}

// ─── cta ──────────────────────────────────────────────────────────────────────

export function renderCta(config: Config, enableLinks: boolean): string {
  const titleColor = config.titleColor || '#14B8A5'

  const qr3Html = config.qrCodeUrl3 ? `<div style="padding:16px;background:#f9f9f9;border-radius:8px;margin-bottom:15px;"><img src="${config.qrCodeUrl3}" alt="二维码" style="width:100px;height:100px;margin-bottom:8px;border-radius:4px;"><div style="font-size:14px;font-weight:600;color:${titleColor};text-align:center;">${config.qrCodeLabel3 || '投递简历'}</div>${config.qrCodeSubLabel3 ? `<div style="font-size:11px;color:#999;margin-top:4px;text-align:center;">${config.qrCodeSubLabel3}</div>` : ''}</div>` : ''

  const qr1Html = config.qrCodeUrl1 ? `<div style="flex:1;width:50%;padding:12px;background:#f9f9f9;border-radius:8px;"><img src="${config.qrCodeUrl1}" alt="二维码" style="width:80px;height:80px;margin-bottom:8px;border-radius:4px;"><div style="font-size:13px;font-weight:500;color:#333;text-align:center;">${config.qrCodeLabel1 || '扫码加入求职群'}</div>${config.qrCodeSubLabel1 ? `<div style="font-size:11px;color:#999;margin-top:4px;text-align:center;">${config.qrCodeSubLabel1}</div>` : ''}</div>` : ''

  const qr2Html = config.qrCodeUrl2 ? `<div style="flex:1;width:50%;padding:12px;background:#f9f9f9;border-radius:8px;"><img src="${config.qrCodeUrl2}" alt="二维码" style="width:80px;height:80px;margin-bottom:8px;border-radius:4px;"><div style="font-size:13px;font-weight:500;color:#333;text-align:center;">${config.qrCodeLabel2 || '企业招聘合作'}</div>${config.qrCodeSubLabel2 ? `<div style="font-size:11px;color:#999;margin-top:4px;text-align:center;">${config.qrCodeSubLabel2}</div>` : ''}</div>` : ''

  const contactHtml = (config.contactEmail || config.contactWechat || config.website) ? `<div style="margin-top:20px;padding-top:20px;border-top:1px solid #f0f0f0;">${config.contactEmail ? `<div style="font-size:13px;color:#666;margin-bottom:6px;">邮箱: ${config.contactEmail}</div>` : ''}${config.contactWechat ? `<div style="font-size:13px;color:#666;margin-bottom:6px;">微信: ${config.contactWechat}</div>` : ''}${config.website ? `<div style="font-size:13px;color:#666;">网站: ${enableLinks ? `<a href="${config.website}" target="_blank" style="color:${titleColor};text-decoration:none;">${config.website.replace(/^https?:\/\//, '')}</a>` : config.website.replace(/^https?:\/\//, '')}</div>` : ''}</div>` : ''

  const introHtml = config.companyIntro ? `<div style="margin-top:20px;padding:15px;background:#f9f9f9;border-radius:8px;font-size:13px;color:#666;line-height:1.6;text-align:left;">${nl2br(config.companyIntro)}</div>` : ''

  return `<div style="background:#fff;border-radius:12px;padding:20px 16px;margin:8px 4px;box-shadow:0 2px 6px rgba(0,0,0,0.1);text-align:center;"><div style="font-size:16px;color:#333;font-weight:600;margin-bottom:15px;">联系我们</div>${qr3Html}<div style="display:flex;flex-direction:row;gap:12px;justify-content:center;">${qr1Html}${qr2Html}</div>${contactHtml}${introHtml}</div>`
}

// ─── text-content ─────────────────────────────────────────────────────────────

export function renderTextContent(config: Config): string {
  const padding = typeof config.padding === 'number' ? `${config.padding}px` : (config.padding || '16px')
  const fontSize = config.fontSize || 14
  const lineHeight = config.lineHeight || 1.8
  const textColor = config.textColor || '#666666'
  const bg = config.backgroundColor || '#ffffff'
  const textAlign = config.textAlign || 'left'

  return `<div style="padding:${padding};margin:8px 4px;background:${bg};font-size:${fontSize}px;color:${textColor};line-height:${lineHeight};text-align:${textAlign};"><div class="module-content">${config.content || ''}</div></div>`
}

// ─── divider ──────────────────────────────────────────────────────────────────

export function renderDivider(config: Config): string {
  const marginTop = config.marginTop || 15
  const marginBottom = config.marginBottom || 15
  const height = config.height || 1
  const color = config.color || '#eeeeee'
  const extraBottom = marginBottom - marginTop

  return `<div style="padding:${marginTop}px 16px;margin:0 4px;margin-bottom:${extraBottom}px;"><hr style="border:none;border-top:${height}px solid ${color};"></div>`
}

// ─── footer ───────────────────────────────────────────────────────────────────

export function renderFooter(config: Config): string {
  const bg = config.backgroundColor || '#f8f9fa'
  const textColor = config.textColor || '#666666'

  return `<div style="background:${bg};padding:20px 16px;margin:0 4px;text-align:center;"><div style="font-size:15px;font-weight:600;color:${textColor};margin-bottom:4px;">${config.brandName || '就位招聘 · Jovijob'}</div>${config.tagline ? `<div style="font-size:12px;color:#999;">${config.tagline}</div>` : ''}</div>`
}

// ─── title-card ───────────────────────────────────────────────────────────────

export function renderTitleCard(config: Config): string {
  const gradientStart = config.gradientStart || '#14B8A6'
  const gradientEnd = config.gradientEnd || '#0D9488'
  const titleColor = config.titleColor || '#fff'
  const tags: any[] = config.tags || []

  const tagsHtml = tags.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:15px;">${tags.map((tag: any) => `<span style="background:rgba(255,255,255,0.2);padding:5px 12px;border-radius:5px;font-size:13px;color:#fff;">${tag.icon || ''} ${tag.label || ''}</span>`).join('')}</div>`
    : ''

  return `<div style="background:linear-gradient(135deg,${gradientStart} 0%,${gradientEnd} 100%);padding:25px 16px;margin:0 4px;border-radius:0;"><h1 style="font-size:22px;color:${titleColor};margin:0;font-weight:600;">${config.title || '请输入标题'}</h1>${config.subtitle ? `<p style="font-size:14px;color:${config.subtitleColor || 'rgba(255,255,255,0.9)'};margin:10px 0 0;">${config.subtitle}</p>` : ''}${tagsHtml}</div>`
}

// ─── info-card ────────────────────────────────────────────────────────────────

export function renderInfoCard(config: Config): string {
  const bg = config.backgroundColor || '#fff'
  const titleColor = config.titleColor || '#333333'
  const textColor = config.textColor || '#666666'

  return `<div style="background:${bg};border-radius:12px;padding:16px;margin:8px 4px;box-shadow:0 2px 6px rgba(0,0,0,0.1);"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><span style="font-size:20px;">${config.icon || '📌'}</span><h3 style="font-size:16px;color:${titleColor};margin:0;font-weight:600;">${config.title || '信息标题'}</h3></div><div class="module-content" style="font-size:14px;color:${textColor};line-height:1.6;">${config.content || ''}</div></div>`
}

// ─── content-block ────────────────────────────────────────────────────────────

export function renderContentBlock(config: Config): string {
  const bg = config.backgroundColor || '#fff'
  const titleColor = config.titleColor || '#14B8A6'
  const textColor = config.textColor || '#666666'

  return `<div style="background:${bg};border-radius:12px;padding:16px;margin:8px 4px;box-shadow:0 2px 6px rgba(0,0,0,0.1);"><h3 style="font-size:16px;color:${titleColor};margin:0 0 12px;font-weight:600;">${config.title || '内容块标题'}</h3><div class="module-content" style="font-size:14px;color:${textColor};line-height:1.8;">${config.content || ''}</div></div>`
}

// ─── image-qrcode ─────────────────────────────────────────────────────────────

export function renderImageQrcode(config: Config): string {
  const bg = config.backgroundColor || '#fff'

  return `<div style="background:${bg};border-radius:12px;padding:20px 16px;margin:8px 4px;box-shadow:0 2px 6px rgba(0,0,0,0.1);text-align:center;">${
    config.imageUrl ? `<img src="${config.imageUrl}" alt="" style="max-width:100%;margin-bottom:15px;border-radius:8px;">` : ''
  }${config.qrCodeUrl ? `<div><img src="${config.qrCodeUrl}" alt="二维码" style="width:150px;height:150px;margin-bottom:10px;">${config.label ? `<div style="font-size:14px;color:#666;">${config.label}</div>` : ''}</div>` : ''}</div>`
}

// ─── 统一调度函数 ─────────────────────────────────────────────────────────────

export function renderModule(type: string, config: Config, enableLinks: boolean): string {
  switch (type) {
    case 'platform-intro':  return renderPlatformIntro(config)
    case 'main-content':    return renderMainContent(config)
    case 'job-card':        return renderJobCard(config, enableLinks)
    case 'job-list':        return renderJobList(config, enableLinks)
    case 'reading':         return renderReading(config, enableLinks)
    case 'cta':             return renderCta(config, enableLinks)
    case 'text-content':    return renderTextContent(config)
    case 'divider':         return renderDivider(config)
    case 'footer':          return renderFooter(config)
    case 'title-card':      return renderTitleCard(config)
    case 'info-card':       return renderInfoCard(config)
    case 'content-block':   return renderContentBlock(config)
    case 'image-qrcode':    return renderImageQrcode(config)
    default:                return ''
  }
}
