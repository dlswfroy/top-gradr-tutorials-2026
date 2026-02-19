import type {Metadata} from 'next';
import { Noto_Sans_Bengali, PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AcademicYearProvider } from '@/context/AcademicYearContext';
import { SchoolInfoProvider } from '@/context/SchoolInfoContext';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'School Navigator',
  description: 'A central hub for school management.',
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
          <SchoolInfoProvider>
            <AcademicYearProvider>
              {children}
            </AcademicYearProvider>
          </SchoolInfoProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
