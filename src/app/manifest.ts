
import { MetadataRoute } from 'next'
import { defaultSchoolInfo } from '@/lib/school-info'

// Base URL without width/height params from the defaultSchoolInfo
const baseIconUrl = defaultSchoolInfo.logoUrl.split('&w=')[0];
 
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
        src: `${baseIconUrl}&w=192&h=192`,
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any maskable',
      },
      {
        src: `${baseIconUrl}&w=512&h=512`,
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any maskable',
      }
    ],
  }
}
