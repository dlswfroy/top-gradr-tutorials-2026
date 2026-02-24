
import { MetadataRoute } from 'next'
import { defaultSchoolInfo } from '@/lib/school-info'
 
export default function manifest(): MetadataRoute.Manifest {
  const iconUrl = 'https://storage.googleapis.com/project-spark-348216.appspot.com/2024-07-27T08:12:08.571Z/user_uploads/b7b9f36b-d897-40f4-8092-dbe1197779de/image.png?v=9';
  
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
