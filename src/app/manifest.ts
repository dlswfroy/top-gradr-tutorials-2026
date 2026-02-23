
import { MetadataRoute } from 'next'
import { defaultSchoolInfo } from '@/lib/school-info'

const baseIconUrl = defaultSchoolInfo.logoUrl;
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: defaultSchoolInfo.name,
    short_name: 'School Navigator',
    description: 'A central hub for school management.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0FAF9',
    theme_color: '#2f2a8a',
    icons: [
      {
        src: baseIconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: baseIconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
       {
        src: baseIconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      }
    ],
  }
}
