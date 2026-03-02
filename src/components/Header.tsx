
'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Menu,
  LayoutDashboard,
  UserPlus,
  Users,
  CalendarCheck,
  BookMarked,
  Banknote,
  Users2,
  Settings,
  FileText,
  CalendarClock,
  LogOut,
  UserSearch,
  MessageSquare
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { useSchoolInfo } from '@/context/SchoolInfoContext';
import { Label } from "@/components/ui/label";
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { useFirestore } from '@/firebase';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { selectedYear, setSelectedYear, availableYears } = useAcademicYear();
  const { schoolInfo, isLoading: isSchoolInfoLoading } = useSchoolInfo();
  const { user, loading: authLoading, hasPermission } = useAuth();
  const db = useFirestore();
  const [displayPhoto, setDisplayPhoto] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!user || !db) {
        setDisplayPhoto(null);
        setDisplayName(null);
        return;
    }

    let unsubscribe: (() => void) | undefined;
    
    if (user.role === 'teacher' && user.email) {
      const staffQuery = query(collection(db, 'staff'), where('email', '==', user.email.toLowerCase()), limit(1));
      unsubscribe = onSnapshot(staffQuery, (snapshot) => {
        if (!snapshot.empty) {
          const staffData = snapshot.docs[0].data();
          setDisplayPhoto(staffData.photoUrl);
          setDisplayName(staffData.nameBn);
        } else {
          setDisplayPhoto(null);
          setDisplayName(user.displayName || null);
        }
      });
    } else {
      setDisplayPhoto(user.photoUrl || null);
      setDisplayName(user.displayName || 'Admin');
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, db]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-sky-500 px-4 text-white shadow-sm sm:px-6 md:px-8 no-print">
      <div className="flex-shrink-0">
        {user && (
          <>
            {isClient ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 rounded-lg text-white hover:bg-white/20">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0">
                <SheetHeader className="p-4 border-b bg-red-100">
                    <SheetTitle className="sr-only"></SheetTitle>
                    <SheetDescription className="sr-only"></SheetDescription>
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-lg font-semibold text-foreground"
                  >
                    {isSchoolInfoLoading ? <Skeleton className="h-8 w-8 rounded-full" /> : (schoolInfo.logoUrl && (
                       <Image src={schoolInfo.logoUrl} alt="School Logo" width={32} height={32} className="rounded-full" />
                    ))}
                    <span className="">{isSchoolInfoLoading ? <Skeleton className="h-6 w-32" /> : schoolInfo.name}</span>
                  </Link>
                </SheetHeader>
                <div className="p-4 border-b bg-blue-100">
                    <Label htmlFor="academic-year-select" className="text-sm font-medium text-muted-foreground">শিক্ষাবর্ষ</Label>
                     {isClient && availableYears.length > 0 ? (
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger id="academic-year-select" className="mt-1">
                                <SelectValue placeholder="" />
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
                  <div className="grid gap-1 p-2 text-base font-medium">
                    {hasPermission('view:dashboard') && (
                      <Link
                        href="/"
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-all bg-sky-100 text-sky-800 hover:bg-sky-200"
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        ড্যাসবোর্ড
                      </Link>
                    )}
                    {hasPermission('view:student-profile') && (
                      <Link
                        href="/student-profile"
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-all bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                      >
                        <UserSearch className="h-5 w-5" />
                        শিক্ষার্থী প্রোফাইল
                      </Link>
                    )}
                    {hasPermission('manage:students') && (
                      <Link
                        href="/add-student"
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-all bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      >
                        <UserPlus className="h-5 w-5" />
                        নতুন শিক্ষার্থী যোগ
                      </Link>
                    )}
                     {hasPermission('view:students') && (
                      <Link
                        href="/student-list"
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-all bg-rose-100 text-rose-800 hover:bg-rose-200"
                      >
                        <Users className="h-5 w-5" />
                        শিক্ষার্থী তালিকা
                      </Link>
                    )}
                     {hasPermission('manage:attendance') && (
                      <Link
                        href="/attendance"
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-all bg-amber-100 text-amber-800 hover:bg-amber-200"
                      >
                        <CalendarCheck className="h-5 w-5" />
                        হাজিরা
                      </Link>
                    )}
                     {hasPermission('manage:results') && (
                      <Link
                        href="/results"
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-all bg-violet-100 text-violet-800 hover:bg-violet-200"
                      >
                        < BookMarked className="h-5 w-5" />
                        ফলাফল
                      </Link>
                    )}
                    {hasPermission('manage:messaging') && (
                      <Link
                        href="/messaging"
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-all bg-lime-100 text-lime-800 hover:bg-lime-200"
                      >
                        <MessageSquare className="h-5 w-5" />
                        মেসেজ
                      </Link>
                    )}
                    {hasPermission('view:accounts') && (
                      <Link
                        href="/accounts"
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-all bg-teal-100 text-teal-800 hover:bg-teal-200"
                      >
                        <Banknote className="h-5 w-5" />
                        হিসাব শাখা
                      </Link>
                    )}
                    {hasPermission('view:staff') && (
                      <Link
                        href="/staff"
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-all bg-orange-100 text-orange-800 hover:bg-orange-200"
                      >
                        <Users2 className="h-5 w-5" />
                        শিক্ষক ও কর্মচারী
                      </Link>
                    )}
                    {hasPermission('manage:documents') && (
                      <Link
                        href="/documents"
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-all bg-slate-100 text-slate-800 hover:bg-slate-200"
                      >
                        <FileText className="h-5 w-5" />
                        ডকুমেন্ট
                      </Link>
                    )}
                    {hasPermission('view:routines') && (
                      <Link
                        href="/routines"
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-all bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200"
                      >
                        <CalendarClock className="h-5 w-5" />
                        রুটিন
                      </Link>
                    )}
                    {hasPermission('manage:settings') && (
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-all bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        <Settings className="h-5 w-5" />
                        সেটিং
                      </Link>
                    )}
                  </div>
                </nav>
                <div className="p-4 border-t bg-muted/20 text-center text-[10px] text-muted-foreground">
                  <p>© ২০২৬ {schoolInfo.name}।</p>
                  <p>সর্বস্বত্ব সংরক্ষিত।</p>
                </div>
              </SheetContent>
            </Sheet>
            ) : (
              <Button variant="ghost" size="icon" className="shrink-0 rounded-lg bg-white text-primary hover:bg-gray-100" disabled>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            )}
          </>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link href="/" className="flex items-center gap-2">
          {isSchoolInfoLoading ? <Skeleton className="h-[53px] w-[53px] rounded-full flex-shrink-0" /> : (schoolInfo.logoUrl && (
            <Image src={schoolInfo.logoUrl} alt="School Logo" width={53} height={53} className="rounded-full flex-shrink-0" />
          ))}
          <h1 className="text-xl md:text-2xl font-bold whitespace-nowrap drop-shadow-md truncate">
            {isSchoolInfoLoading ? <Skeleton className="h-8 w-56" /> : schoolInfo.name}
          </h1>
        </Link>
      </div>
      
      <div className="flex-shrink-0">
        {authLoading ? <Skeleton className="h-10 w-10 rounded-full" /> : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-10 w-10 border-2 border-white cursor-pointer">
                <AvatarImage src={displayPhoto || undefined} alt={user.email || 'user'} />
                <AvatarFallback>{user.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{displayName || 'Admin'}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>প্রোফাইল সেটিংস</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>লগ আউট</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button variant="secondary">লগইন করুন</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
