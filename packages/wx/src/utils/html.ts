import type { EditorModule } from '../types.js'
import { renderModule } from './modules.js'

// 清理 HTML 模板：移除多余空白和换行（与 ArticleEditor.tsx trimHtmlTemplate 一致）
function trimHtmlTemplate(html: string): string {
  return html
    .split('\n')
    .map(line => line.trimStart())
    .join('')
    .trim()
}

// 将 HTML 后处理为微信兼容格式（9 步，与 ArticleEditor.tsx processForWechat 完全一致）
export function processForWechat(html: string): string {
  let result = html

  // 1. 删除 <style> 标签
  result = result.replace(/<style[\s\S]*?<\/style>/gi, '')

  // 2. ql-indent-N 段落/列表项 → inline padding-left
  const OL_LIST_STYLES: Record<number, string> = {
    1: 'lower-alpha', 2: 'lower-roman', 3: 'lower-alpha', 4: 'lower-roman',
    5: 'lower-alpha', 6: 'lower-roman', 7: 'lower-alpha', 8: 'lower-roman',
  }
  for (let n = 1; n <= 8; n++) {
    const paddingStyle = `padding-left:${n * 3}em;`
    result = result.replace(
      new RegExp(`<(p|li)([^>]*)\\bql-indent-${n}\\b([^>]*)>`, 'gi'),
      (match) => {
        let cleaned = match
          .replace(new RegExp(`\\s*\\bql-indent-${n}\\b\\s*`), ' ')
          .replace(/class="\s*"/, '')
        if (/style="/.test(cleaned)) {
          return cleaned.replace(/style="/, `style="${paddingStyle}`)
        }
        return cleaned.replace(/>$/, ` style="${paddingStyle}">`)
      }
    )
    result = result.replace(
      new RegExp(`(<ol[^>]*>[\\s\\S]*?)<li([^>]*)style="padding-left:${n * 3}em;([^"]*)"`, 'gi'),
      `$1<li$2style="padding-left:${n * 3}em;list-style-type:${OL_LIST_STYLES[n]};$3"`
    )
  }

  // 3. <ul>/<ol> 补全 inline style，按嵌套深度设置 list-style-type
  const UL_STYLES = ['disc', 'circle', 'square']
  const OL_STYLES = ['decimal', 'lower-alpha', 'lower-roman']
  let ulDepth = 0, olDepth = 0
  const parts = result.split(/(<\/?(?:ul|ol)[^>]*>)/gi)
  result = parts.map(part => {
    const lower = part.toLowerCase().trimStart()
    if (/^<ul/.test(lower)) {
      ulDepth++
      const lstype = UL_STYLES[Math.min(ulDepth - 1, 2)]
      const paddingLeft = ulDepth * 12
      const baseStyle = `padding-left:${paddingLeft}px;margin:8px 0;list-style-type:${lstype};`
      if (/padding-left/.test(part)) {
        return /list-style-type/.test(part)
          ? part.replace(/list-style-type:[^;"]*/i, `list-style-type:${lstype}`)
          : part.replace(/style="/, `style="list-style-type:${lstype};`)
      }
      return /style="/.test(part)
        ? part.replace(/style="/, `style="${baseStyle}`)
        : part.replace(/>$/, ` style="${baseStyle}">`)
    } else if (/^<\/ul/.test(lower)) {
      ulDepth = Math.max(0, ulDepth - 1)
      return part
    } else if (/^<ol/.test(lower)) {
      olDepth++
      const lstype = OL_STYLES[Math.min(olDepth - 1, 2)]
      const paddingLeft = olDepth * 12
      const baseStyle = `padding-left:${paddingLeft}px;margin:8px 0;list-style-type:${lstype};`
      if (/padding-left/.test(part)) {
        return /list-style-type/.test(part)
          ? part.replace(/list-style-type:[^;"]*/i, `list-style-type:${lstype}`)
          : part.replace(/style="/, `style="list-style-type:${lstype};`)
      }
      return /style="/.test(part)
        ? part.replace(/style="/, `style="${baseStyle}`)
        : part.replace(/>$/, ` style="${baseStyle}">`)
    } else if (/^<\/ol/.test(lower)) {
      olDepth = Math.max(0, olDepth - 1)
      return part
    }
    return part
  }).join('')

  // 4. 给 <p> 补 margin:0 0 12px 0
  result = result.replace(/<p([^>]*)>/gi, (match, attrs) => {
    if (/margin/.test(attrs)) return match
    if (/style="/.test(attrs)) {
      return match.replace(/style="/, 'style="margin:0 0 12px 0;')
    }
    return `<p${attrs} style="margin:0 0 12px 0;">`
  })

  // 5. 图片：max-width:100% → width:100%，删除 height:auto
  result = result.replace(/max-width:\s*100%/gi, 'width:100%')
  result = result.replace(/;\s*height:\s*auto/gi, '')
  result = result.replace(/height:\s*auto\s*;?\s*/gi, '')

  // 6. 拆分「图片+文字」混排的 <p>
  result = result.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, content) => {
    if (!/<img\b/i.test(content)) return match
    const plainText = content.replace(/<[^>]*>/g, '').trim()
    if (!plainText) return match

    const tokens = content.split(/(<img\b[^>]*>)/gi)
    const pieces: string[] = []
    for (const token of tokens) {
      if (!token) continue
      if (/<img\b/i.test(token)) {
        pieces.push(`<p style="text-align:center;margin:0 0 12px 0;">${token}</p>`)
      } else if (token.replace(/<[^>]*>/g, '').trim()) {
        pieces.push(`<p${attrs}>${token}</p>`)
      }
    }
    return pieces.length > 1 ? pieces.join('') : match
  })

  // 7a. 独立图片段落加 text-align:center
  result = result.replace(
    /<p([^>]*)>(\s*<img[^>]*>\s*)<\/p>/gi,
    (match, attrs, imgContent) => {
      if (/text-align/.test(attrs)) return match
      if (/style="/.test(attrs)) {
        return match.replace(/style="/, 'style="text-align:center;')
      }
      return `<p${attrs} style="text-align:center;">${imgContent}</p>`
    }
  )
  // 7b. img 添加 display:inline-block
  result = result.replace(/<img([^>]*)>/gi, (match, attrs) => {
    if (/display/.test(attrs)) return match
    if (/style="/.test(attrs)) {
      return match.replace(/style="/, 'style="display:inline-block;')
    }
    return `<img${attrs} style="display:inline-block;">`
  })

  // 8. 移除 text-decoration:none
  result = result.replace(/\s*text-decoration:\s*none\s*;?/gi, '')
  result = result.replace(/\s*style="\s*"/gi, '')

  // 9. 去掉 font-family 中的单引号
  result = result.replace(/font-family:[^;"]+/gi, (match) => match.replace(/'/g, ''))

  return result
}

// 生成模块 HTML（与 ArticleEditor.tsx generateHtmlForModules 一致）
export function generateHtmlForModules(
  modules: EditorModule[],
  enableLinks: boolean = true,
  enhanceSpacing: boolean = false
): string {
  const modulesHtml = modules
    .filter(m => m.visible)
    .map(m => trimHtmlTemplate(renderModule(m.type, m.config, enableLinks)))
    .join('')

  const listStyles = `
    <style>
      div.module-content { font-size: 14px !important; line-height: 1.8 !important; white-space: pre-wrap; tab-size: 4; -moz-tab-size: 4; }
      div.module-content img { max-width: 100%; height: auto; display: block; margin: 8px auto; }
      div.module-content p { margin: 0 0 12px 0 !important; }
      div.module-content p:last-child { margin-bottom: 0 !important; }
      div.module-content h1, div.module-content h2, div.module-content h3, div.module-content h4, div.module-content h5, div.module-content h6 { margin: 12px 0 10px 0 !important; }
      div.module-content > * + * { margin-top: 12px; }
      div.module-content br { display: block; content: ""; margin: 12px 0 !important; line-height: 1.8; }
      div.module-content ul, div.module-content ol { padding-left: 12px; margin: 8px 0; }
      div.module-content ul ul, div.module-content ol ol, div.module-content ul ol, div.module-content ol ul { padding-left: 24px; margin: 8px 0; }
      div.module-content ul { list-style-type: disc; }
      div.module-content ol { list-style-type: decimal; }
      div.module-content li { margin-bottom: 4px; }
      div.module-content li > ol, div.module-content li > ul { margin: 4px 0; }
      div.module-content ol > li > ol { list-style-type: lower-alpha; }
      div.module-content ol > li > ol > li > ol { list-style-type: lower-roman; }
      div.module-content ol li.ql-indent-1 { list-style-type: lower-alpha; }
      div.module-content ol li.ql-indent-2 { list-style-type: lower-roman; }
      div.module-content ol li.ql-indent-3 { list-style-type: lower-alpha; }
      div.module-content ol li.ql-indent-4 { list-style-type: lower-roman; }
      div.module-content ol li.ql-indent-5 { list-style-type: lower-alpha; }
      div.module-content ol li.ql-indent-6 { list-style-type: lower-roman; }
      div.module-content ol li.ql-indent-7 { list-style-type: lower-alpha; }
      div.module-content ol li.ql-indent-8 { list-style-type: lower-roman; }
      div.module-content ul ul { list-style-type: circle; }
      div.module-content ul ul ul { list-style-type: square; }
      div.module-content ol li.ql-indent-1 { padding-left: 3em !important; }
      div.module-content ol li.ql-indent-2 { padding-left: 6em !important; }
      div.module-content ol li.ql-indent-3 { padding-left: 9em !important; }
      div.module-content ol li.ql-indent-4 { padding-left: 12em !important; }
      div.module-content ol li.ql-indent-5 { padding-left: 15em !important; }
      div.module-content ol li.ql-indent-6 { padding-left: 18em !important; }
      div.module-content ol li.ql-indent-7 { padding-left: 21em !important; }
      div.module-content ol li.ql-indent-8 { padding-left: 24em !important; }
      div.module-content > p.ql-indent-1, div.module-content p.ql-indent-1 { padding-left: 3em !important; }
      div.module-content > p.ql-indent-2, div.module-content p.ql-indent-2 { padding-left: 6em !important; }
      div.module-content > p.ql-indent-3, div.module-content p.ql-indent-3 { padding-left: 9em !important; }
      div.module-content > p.ql-indent-4, div.module-content p.ql-indent-4 { padding-left: 12em !important; }
      div.module-content > p.ql-indent-5, div.module-content p.ql-indent-5 { padding-left: 15em !important; }
      div.module-content > p.ql-indent-6, div.module-content p.ql-indent-6 { padding-left: 18em !important; }
      div.module-content > p.ql-indent-7, div.module-content p.ql-indent-7 { padding-left: 21em !important; }
      div.module-content > p.ql-indent-8, div.module-content p.ql-indent-8 { padding-left: 24em !important; }
    </style>
  `

  if (enhanceSpacing) {
    return processForWechat(
      `<div style="width:100%;max-width:700px;margin:0 auto;background:#fff;font-family:-apple-system,BlinkMacSystemFont,PingFang SC,Microsoft YaHei,sans-serif;">${modulesHtml}</div>`
    )
  }

  return `<div style="width:100%;max-width:700px;margin:0 auto;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;">${listStyles}${modulesHtml}</div>`
}

// 从 modules[] 生成微信可用的 HTML（不带链接，inline style）
export function htmlToWechat(modules: EditorModule[]): string {
  return generateHtmlForModules(modules, false, true)
}

// 从原始 HTML 字符串生成微信可用格式
export function rawHtmlToWechat(html: string): string {
  return processForWechat(html)
}
