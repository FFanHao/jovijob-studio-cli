import { createClient } from '@supabase/supabase-js'
import type { ArticleDraft } from '../types.js'

const SUPABASE_URL = 'https://qalkhkirjtfpyrbozyxh.supabase.co'
const SUPABASE_KEY = 'sb_publishable_4NRhzQA6rFjN6A5Vk8zK_A_UjxH9MI9'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function listDrafts(): Promise<ArticleDraft[]> {
  const { data, error } = await supabase
    .from('article_drafts')
    .select('id, title, author, summary, cover_image_url, wechat_media_id, wechat_preview_url, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`获取草稿列表失败: ${error.message}`)
  return (data || []) as ArticleDraft[]
}

export async function getDraft(id: string): Promise<ArticleDraft> {
  const { data, error } = await supabase
    .from('article_drafts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(`获取草稿失败: ${error.message}`)
  return data as ArticleDraft
}

export async function saveDraft(draft: ArticleDraft): Promise<ArticleDraft> {
  if (draft.id) {
    // 更新
    const { id, created_at, ...updateData } = draft
    const { data, error } = await supabase
      .from('article_drafts')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`更新草稿失败: ${error.message}`)
    return data as ArticleDraft
  } else {
    // 新建
    const { id, ...insertData } = draft
    const { data, error } = await supabase
      .from('article_drafts')
      .insert({ ...insertData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single()

    if (error) throw new Error(`创建草稿失败: ${error.message}`)
    return data as ArticleDraft
  }
}

export async function deleteDraft(id: string): Promise<void> {
  const { error } = await supabase
    .from('article_drafts')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`删除草稿失败: ${error.message}`)
}
