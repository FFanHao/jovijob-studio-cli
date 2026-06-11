import type { JobData } from '../api/joviJob.js'

/** 将 JobData 序列化为 application/x-www-form-urlencoded 字符串 */
export function buildFormData(job: JobData): string {
  const params = new URLSearchParams()

  params.append('id', job.id || '')
  params.append('act', 'do_echo')
  params.append('fan', 'https://www.jovijob.com/adminIsAdmin/php_job.php')

  params.append('gongsi_id', job.gongsi_id || '650')
  params.append('member_id_title', job.member_id_title || '')
  params.append('member_id', job.member_id || '153')
  params.append('states', job.states || '2')
  params.append('states_txt', '')

  params.append('jia_txt', '')
  params.append('ban_txt', '')
  params.append('ding_index_px', '0')
  params.append('ding_index_end_time', '')
  params.append('hot_px', '0')

  params.append('title', job.title || '')
  params.append('xingzhi', job.xingzhi || '1')

  params.append('xinzi_currency', job.xinzi_currency || '2')
  params.append('xinzi_types', job.xinzi_types || '6')
  params.append('xinzi_min', job.xinzi_min || '')
  params.append('xinzi_max', job.xinzi_max || '')

  params.append('jingyan', job.jingyan || '')
  params.append('xueli', job.xueli || '')

  // 职位分类（数组字段）
  params.append('zhiwei_index[]', '0')
  params.append('zhiwei_index[]', 'CopyIndex')
  if (job.zhiwei_level2_id0) params.append('zhiwei_level2_id0', job.zhiwei_level2_id0)
  if (job.zhiwei_level1_id0) params.append('zhiwei_level1_id0', job.zhiwei_level1_id0)
  if (job.zhiwei_id0) params.append('zhiwei_id0', job.zhiwei_id0)
  params.append('zhiwei_level2_idCopyIndex', '')
  params.append('zhiwei_level1_idCopyIndex', '')
  params.append('zhiwei_idCopyIndex', '')

  // 标签（数组字段）
  params.append('label_index[]', '0')
  params.append('label_index[]', 'CopyIndex')
  if (job.label_id0) params.append('label_id0', job.label_id0)
  params.append('label_idCopyIndex', '')

  // 工作城市（数组字段）
  params.append('city_index[]', '0')
  params.append('city_index[]', 'CopyIndex')
  params.append('country_id0', job.country_id0 || '2')
  params.append('province_id0', job.province_id0 || '')
  params.append('city_id0', job.city_id0 || '')
  params.append('country_idCopyIndex', '')
  params.append('province_idCopyIndex', '')
  params.append('city_idCopyIndex', '')

  params.append('content', job.content || '')
  params.append('content2', job.content2 || '')
  params.append('content3', job.content3 || '')

  params.append('toudi_mode', job.toudi_mode || '2')
  params.append('from_url', job.from_url || '')

  params.append('country_id', '')
  params.append('province_id', '')
  params.append('city_id', '')
  params.append('addr', '')

  return params.toString()
}
