import { MetadataRoute } from 'next'
import { defaultSchoolInfo, APP_ICON_URL } from '@/lib/school-info'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: defaultSchoolInfo.name,
    short_name: 'বিপৌউবি',
    description: 'বীরগঞ্জ পৌর উচ্চ বিদ্যালয়ের কেন্দ্রীয় শিক্ষা ব্যবস্থাপনা পোর্টাল।',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0FAF9',
    theme_color: '#2f2a8a',
    icons: [
      {
        src: `${APP_ICON_URL}?v=22`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${APP_ICON_URL}?v=22`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
