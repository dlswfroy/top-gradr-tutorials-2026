
import type {Metadata} from 'next';
import { Noto_Sans_Bengali, PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AcademicYearProvider } from '@/context/AcademicYearContext';
import { SchoolInfoProvider } from '@/context/SchoolInfoContext';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';

const APP_NAME = 'টপ গ্রেড টিউটোরিয়ালস';
const APP_ICON_URL = 'https://i.postimg.cc/9Q6mY71p/logo.png';

export const metadata: Metadata = {
  title: `${APP_NAME} - ম্যানেজমেন্ট সিস্টেম`,
  description: 'টপ গ্রেড টিউটোরিয়ালস এর একটি কেন্দ্রীয় শিক্ষা ব্যবস্থাপনা পোর্টাল।',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: APP_ICON_URL,
    shortcut: APP_ICON_URL,
    apple: APP_ICON_URL,
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
      <body className={cn("font-body antialiased pb-16 md:pb-0", noto_sans_bengali.variable, pt_sans.variable)}>
        <FirebaseClientProvider>
          <AuthProvider>
            <SchoolInfoProvider>
              <AcademicYearProvider>
                {children}
                <Toaster />
                <BottomNav />
              </AcademicYearProvider>
            </SchoolInfoProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
