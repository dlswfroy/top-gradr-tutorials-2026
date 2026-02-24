import type {Metadata} from 'next';
import { Noto_Sans_Bengali, PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AcademicYearProvider } from '@/context/AcademicYearContext';
import { SchoolInfoProvider } from '@/context/SchoolInfoContext';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { defaultSchoolInfo } from '@/lib/school-info';

const iconUrlWithVersion = 'https://storage.googleapis.com/project-spark-348216.appspot.com/2024-07-27T08:12:08.571Z/user_uploads/b7b9f36b-d897-40f4-8092-dbe1197779de/image.png?v=9';

export const metadata: Metadata = {
  title: 'School Navigator',
  description: 'A central hub for school management.',
  manifest: '/manifest.webmanifest?v=9',
  icons: {
    icon: iconUrlWithVersion,
    shortcut: iconUrlWithVersion,
    apple: iconUrlWithVersion,
  }
};

const noto_sans_bengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '700'],
  variable: '--font-noto-sans-bengali',
});

const pt_sans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className={cn("font-body antialiased", noto_sans_bengali.variable, pt_sans.variable)}>
        <FirebaseClientProvider>
          <AuthProvider>
            <SchoolInfoProvider>
              <AcademicYearProvider>
                {children}
              </AcademicYearProvider>
            </SchoolInfoProvider>
          </AuthProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
