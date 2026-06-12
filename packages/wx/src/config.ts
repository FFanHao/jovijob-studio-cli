import fs from 'fs'
import path from 'path'
import os from 'os'
import axios from 'axios'
import type { WechatConfig } from './types.js'

const CONFIG_DIR = path.join(os.homedir(), '.jovijob')
const WECHAT_CONFIG_PATH = path.join(CONFIG_DIR, 'wechat.json')

function readConfig(): WechatConfig | null {
  try {
    if (!fs.existsSync(WECHAT_CONFIG_PATH)) return null
    const raw = fs.readFileSync(WECHAT_CONFIG_PATH, 'utf-8')
    return JSON.parse(raw) as WechatConfig
  } catch {
    return null
  }
}

function writeConfig(config: WechatConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  fs.writeFileSync(WECHAT_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

export function saveWechatConfig(appId: string, appSecret: string): void {
  const existing = readConfig() || { appId: '', appSecret: '' }
  writeConfig({ ...existing, appId, appSecret })
}

export function getWechatConfig(): WechatConfig | null {
  return readConfig()
}

export async function getValidAccessToken(): Promise<string> {
  const config = readConfig()
  if (!config?.appId || !config?.appSecret) {
    throw new Error('微信配置未找到，请先运行: jovipost-wx auth setup --appid <id> --secret <s>')
  }

  // 检查 token 是否有效（提前 5 分钟刷新）
  const now = Math.floor(Date.now() / 1000)
  if (config.accessToken && config.tokenExpire && config.tokenExpire - now > 300) {
    return config.accessToken
  }

  // 刷新 token
  const res = await axios.post('https://api.weixin.qq.com/cgi-bin/stable_token', {
    grant_type: 'client_credential',
    appid: config.appId,
    secret: config.appSecret,
  })

  if (res.data.errcode) {
    throw new Error(`获取微信 Token 失败: ${res.data.errmsg} (code: ${res.data.errcode})`)
  }

  const newToken = res.data.access_token as string
  const expire = now + (res.data.expires_in as number)
  writeConfig({ ...config, accessToken: newToken, tokenExpire: expire })
  return newToken
}
