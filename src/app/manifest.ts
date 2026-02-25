
import { MetadataRoute } from 'next'
import { defaultSchoolInfo } from '@/lib/school-info'
 
export default function manifest(): MetadataRoute.Manifest {
  const iconUrl = 'https://storage.googleapis.com/project-spark-348216.appspot.com/2024-08-01T17:09:41.979Z/user_uploads/7d89617a-59c4-4b9e-9d29-c89b37c04118/school-logo.png?v=16';
  
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
