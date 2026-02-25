
import { MetadataRoute } from 'next'
import { defaultSchoolInfo } from '@/lib/school-info'
 
export default function manifest(): MetadataRoute.Manifest {
  const iconUrl = 'https://storage.googleapis.com/project-spark-348216.appspot.com/2024-08-02T19:39:10.570Z/user_uploads/c9e99a77-400e-4363-9562-b13c321484f9/school-logo.png?v=17';
  
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
        src: iconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: iconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
