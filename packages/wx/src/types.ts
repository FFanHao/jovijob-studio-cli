export interface Tag {
  label: string
  icon: string
}

export interface ContentBlock {
  id: number
  sectionTitle: string
  content: string
  titleColor: string
  fontSize: number
  lineHeight: number
  textColor: string
}

export interface ModuleConfig {
  [key: string]: any
}

export interface EditorModule {
  id: string
  type: string
  name: string
  visible: boolean
  order: number
  config: ModuleConfig
}

export interface ArticleDraft {
  id?: string
  title: string
  modules?: any[]
  content?: string
  author?: string
  summary?: string
  cover_image_url?: string
  cover_title?: string
  cover_background_image?: string
  cover_preview_url?: string
  wechat_media_id?: string
  wechat_preview_url?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface WechatConfig {
  appId: string
  appSecret: string
  accessToken?: string
  tokenExpire?: number
}

export interface WechatArticle {
  title: string
  author?: string
  digest?: string
  content: string
  thumb_media_id?: string
  need_open_comment?: number
  only_fans_can_comment?: number
}
