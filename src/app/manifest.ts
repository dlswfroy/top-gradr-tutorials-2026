
import { MetadataRoute } from 'next'
import { defaultSchoolInfo, APP_ICON_URL } from '@/lib/school-info'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: defaultSchoolInfo.name,
    short_name: 'টপ গ্রেড',
    description: 'টপ গ্রেড টিউটোরিয়ালস এর কেন্দ্রীয় শিক্ষা ব্যবস্থাপনা পোর্টাল।',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0FAF9',
    theme_color: '#2f2a8a',
    icons: [
      {
        src: APP_ICON_URL,
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: APP_ICON_URL,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: APP_ICON_URL,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
