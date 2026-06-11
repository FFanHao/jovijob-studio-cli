export interface CityInfo {
  city_id0: string
  province_id0: string
  country_id0: string
  name: string
  nameEn?: string
}

export const germanCities: CityInfo[] = [
  { city_id0: '385', province_id0: '409', country_id0: '2', name: '柏林', nameEn: 'Berlin' },
  { city_id0: '390', province_id0: '412', country_id0: '2', name: '汉堡', nameEn: 'Hamburg' },
  { city_id0: '393', province_id0: '447', country_id0: '2', name: '慕尼黑', nameEn: 'Munich' },
  { city_id0: '397', province_id0: '428', country_id0: '2', name: '科隆', nameEn: 'Cologne' },
  { city_id0: '400', province_id0: '413', country_id0: '2', name: '法兰克福', nameEn: 'Frankfurt' },
  { city_id0: '407', province_id0: '429', country_id0: '2', name: '杜塞尔多夫', nameEn: 'Düsseldorf' },
  { city_id0: '420', province_id0: '455', country_id0: '2', name: '斯图加特', nameEn: 'Stuttgart' },
  { city_id0: '437', province_id0: '448', country_id0: '2', name: '纽伦堡', nameEn: 'Nuremberg' },
  { city_id0: '443', province_id0: '446', country_id0: '2', name: '莱比锡', nameEn: 'Leipzig' },
  { city_id0: '450', province_id0: '430', country_id0: '2', name: '多特蒙德', nameEn: 'Dortmund' },
  { city_id0: '456', province_id0: '430', country_id0: '2', name: '埃森', nameEn: 'Essen' },
  { city_id0: '465', province_id0: '410', country_id0: '2', name: '不来梅', nameEn: 'Bremen' },
  { city_id0: '478', province_id0: '446', country_id0: '2', name: '德累斯顿', nameEn: 'Dresden' },
  { city_id0: '488', province_id0: '414', country_id0: '2', name: '汉诺威', nameEn: 'Hannover' },
]

export function matchCity(cityName: string): CityInfo | null {
  if (!cityName) return null
  const normalized = cityName.toLowerCase().trim()

  // 精确匹配（中文或英文）
  for (const city of germanCities) {
    if (city.name.toLowerCase() === normalized || city.nameEn?.toLowerCase() === normalized) {
      return city
    }
  }

  // 模糊匹配
  for (const city of germanCities) {
    if (
      city.name.toLowerCase().includes(normalized) ||
      normalized.includes(city.name.toLowerCase()) ||
      city.nameEn?.toLowerCase().includes(normalized) ||
      normalized.includes(city.nameEn?.toLowerCase() ?? '')
    ) {
      return city
    }
  }

  return null
}
