import { MetadataRoute } from 'next'
import { defaultSchoolInfo, APP_ICON_URL } from '@/lib/school-info'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: defaultSchoolInfo.name,
    short_name: 'My School',
    description: 'A central hub for school management.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0FAF9',
    theme_color: '#2f2a8a',
    icons: [
      {
        src: APP_ICON_URL,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: APP_ICON_URL,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
