
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { Label } from "@/components/ui/label";


export function Header() {
  const [isClient, setIsClient] = useState(false);
  const { selectedYear, setSelectedYear, availableYears } = useAcademicYear();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const profilePhoto = PlaceHolderImages.find(p => p.id === 'profile-photo');
  const schoolLogo = PlaceHolderImages.find(p => p.id === 'school-logo');

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-primary px-4 text-primary-foreground shadow-sm sm:px-6 md:px-8">
      <div className="flex items-center gap-4">
        {isClient ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 rounded-lg bg-white text-primary hover:bg-gray-100">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0">
            <SheetHeader className="p-4 border-b">
                <SheetTitle className="sr-only">নেভিগেশন মেনু</SheetTitle>
                <SheetDescription className="sr-only">
                    অ্যাপ্লিকেশন নেভিগেট করার জন্য লিঙ্কের একটি তালিকা।
                </SheetDescription>
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold text-foreground"
              >
                {schoolLogo && (
                   <Image src={schoolLogo.imageUrl} alt="School Logo" width={32} height={32} className="rounded-full" />
                )}
                <span className="">বীরগঞ্জ পৌর উচ্চ বিদ্যালয়</span>
              </Link>
            </SheetHeader>
            <div className="p-4 border-b">
                <Label htmlFor="academic-year-select" className="text-sm font-medium text-muted-foreground">শিক্ষাবর্ষ</Label>
                 {isClient && availableYears.length > 0 ? (
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger id="academic-year-select" className="mt-1">
                            <SelectValue placeholder="শিক্ষাবর্ষ" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableYears.map(year => (
                                <SelectItem key={year} value={year}>{year.toLocaleString('bn-BD')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="mt-1 h-10 w-full animate-pulse rounded-md bg-muted" />
                )}
            </div>
            <nav className="flex-1 overflow-y-auto">
              <div className="grid gap-2 p-4 text-base font-medium">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  ড্যাসবোর্ড
                </Link>
                <Link
                  href="/add-student"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  নতুন শিক্ষার্থী যোগ
                </Link>
                <Link
                  href="/student-list"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  শিক্ষার্থী তালিকা
                </Link>
                <Link
                  href="/digital-attendance"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  ডিজিটাল হাজিরা
                </Link>
                <Link
                  href="/attendance-report"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  হাজিরা রিপোর্ট
                </Link>
                 <Link
                  href="/holidays"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  অতিরিক্ত ছুটি
                </Link>
                <Link
                  href="/results"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  ফলাফল ইনপুট
                </Link>
                 <Link
                  href="/view-results"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  ফলাফল দেখুন
                </Link>
                <Link
                  href="/results-upload"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  ফলাফল আপলোড
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  শিক্ষক ও কর্মচারী
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  সেটিং
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        ) : (
          <Button variant="ghost" size="icon" className="shrink-0 rounded-lg bg-white text-primary hover:bg-gray-100" disabled>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        )}
      </div>

      <Link href="/" className="flex items-center gap-2">
          {schoolLogo && (
            <Image src={schoolLogo.imageUrl} alt="School Logo" width={40} height={40} className="rounded-full hidden sm:block" data-ai-hint={schoolLogo.imageHint}/>
          )}
          <h1 className="text-xl font-bold whitespace-nowrap drop-shadow-md">
            বীরগঞ্জ পৌর উচ্চ বিদ্যালয়
          </h1>
      </Link>
      
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10 border-2 border-white">
          {profilePhoto && (
            <AvatarImage
              src={profilePhoto.imageUrl}
              alt="School Representative"
              data-ai-hint={profilePhoto.imageHint}
            />
          )}
          <AvatarFallback>SR</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
