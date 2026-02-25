
import type {Metadata} from 'next';
import { Noto_Sans_Bengali, PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AcademicYearProvider } from '@/context/AcademicYearContext';
import { SchoolInfoProvider } from '@/context/SchoolInfoContext';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const iconUrlWithVersion = 'https://storage.googleapis.com/project-spark-348216.appspot.com/2024-08-01T17:09:41.979Z/user_uploads/7d89617a-59c4-4b9e-9d29-c89b37c04118/school-logo.png?v=16';

export const metadata: Metadata = {
  title: 'My School',
  description: 'A central hub for school management.',
  manifest: '/manifest.webmanifest?v=16',
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
