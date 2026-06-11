import fs from 'fs'
import path from 'path'
import os from 'os'

const SESSION_DIR = path.join(os.homedir(), '.jovijob')
const SESSION_FILE = path.join(SESSION_DIR, 'session.json')

export interface SessionData {
  cookie: string
  savedAt: string
}

/** 加载 Cookie，优先级：环境变量 > session.json > null */
export function loadCookie(): string | null {
  // 1. 环境变量
  if (process.env.JOVIJOB_COOKIE) {
    return process.env.JOVIJOB_COOKIE
  }

  // 2. session.json
  if (fs.existsSync(SESSION_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8')) as SessionData
      if (data.cookie) return data.cookie
    } catch {
      // 忽略解析错误
    }
  }

  return null
}

/** 将 cookie 字符串保存到 session.json */
export function saveCookie(cookie: string): void {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true })
  }
  const data: SessionData = { cookie, savedAt: new Date().toISOString() }
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

/** 从 Electron App 的 jovijob-state.json 导入 Cookie */
export function importCookieFromElectronState(filePath: string): string {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const authData = JSON.parse(raw)
  if (!authData.cookies || !Array.isArray(authData.cookies)) {
    throw new Error('无效的 jovijob-state.json：缺少 cookies 字段')
  }
  return authData.cookies.map((c: { name: string; value: string }) => `${c.name}=${c.value}`).join('; ')
}

/** 获取 Cookie，不存在时抛出错误（含指引） */
export function requireCookie(): string {
  const cookie = loadCookie()
  if (!cookie) {
    throw new Error(
      '未找到登录 Cookie。请通过以下方式配置：\n' +
      '  方式 A：jovipost auth import ~/Library/Application\\ Support/JoviJob\\ Studio/jovijob-state.json\n' +
      '  方式 B：jovipost auth set-cookie "PHPSESSID=xxx; ..."\n' +
      '  方式 C：设置环境变量 JOVIJOB_COOKIE="..."'
    )
  }
  return cookie
}
