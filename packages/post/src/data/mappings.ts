/** 经验要求：文本 → ID */
export const EXP_MAPPING: Record<string, string> = {
  '在校生': '1', '应届生': '2', '毕业生': '2',
  '1年以下': '3', '不到1年': '3', '少于1年': '3',
  '1-3年': '4', '1到3年': '4', '一年到三年': '4',
  '3-5年': '5', '3到5年': '5', '三年到五年': '5',
  '5-10年': '6', '5到10年': '6', '五年到十年': '6',
  '10年以上': '7', '十年以上': '7',
  '不限': '8', '经验不限': '8', '无需经验': '8', '无经验要求': '8',
  'any': '8', 'none': '8', 'no experience': '8',
}

/** 学历要求：文本 → ID */
export const EDU_MAPPING: Record<string, string> = {
  '高中': '3', '中专': '4', '职高': '4',
  '大专': '5', '大学': '6', '本科': '6', '学士': '6',
  '硕士': '7', '研究生': '7', 'MBA': '7',
  '博士': '8', '博士生': '8', 'PhD': '8',
  '无要求': '10', '学历不限': '10', '不限学历': '10', '学历无要求': '10',
  'any': '10', 'no requirement': '10', 'not required': '10',
}

/** 职位类型：文本 → ID */
export const XINGZHI_MAP: Record<string, string> = {
  '全职': '1', 'full-time': '1', 'fulltime': '1', 'full time': '1',
  '兼职': '2', 'part-time': '2', 'parttime': '2', 'part time': '2',
  '实习': '3', 'intern': '3', 'internship': '3',
}

/** 薪资货币：文本/符号 → ID */
export const CURRENCY_MAP: Record<string, string> = {
  'CNY': '1', '人民币': '1', '¥': '1', 'RMB': '1',
  'EUR': '2', '欧元': '2', '€': '2',
  'USD': '3', '美元': '3', '$': '3',
  'GBP': '4', '英镑': '4', '£': '4',
  'CHF': '5', '瑞郎': '5', '瑞士法郎': '5',
}

/** 薪资类型：文本 → ID */
export const SALARY_TYPE_MAP: Record<string, string> = {
  '时薪': '2', 'hourly': '2', 'per hour': '2',
  '周薪': '3', 'weekly': '3', 'per week': '3',
  '月薪': '4', 'monthly': '4', 'per month': '4',
  '年薪': '6', 'yearly': '6', 'annual': '6', 'per year': '6',
}

/** xingzhi ID → 文本 */
export const XINGZHI_LABELS: Record<string, string> = {
  '1': '全职', '2': '兼职', '3': '实习',
}

/** jingyan ID → 文本 */
export const JINGYAN_LABELS: Record<string, string> = {
  '1': '在校生', '2': '应届生', '3': '1年以下',
  '4': '1-3年', '5': '3-5年', '6': '5-10年',
  '7': '10年以上', '8': '不限',
}

/** xueli ID → 文本 */
export const XUELI_LABELS: Record<string, string> = {
  '3': '高中', '4': '中专', '5': '大专',
  '6': '本科', '7': '硕士', '8': '博士', '10': '不限',
}

/** xinzi_currency ID → 符号 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  '1': '¥', '2': '€', '3': '$', '4': '£', '5': 'CHF',
}

/** xinzi_types ID → 文本 */
export const SALARY_TYPE_LABELS: Record<string, string> = {
  '2': '时薪', '3': '周薪', '4': '月薪', '6': '年薪',
}
