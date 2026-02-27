'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Student, studentFromDoc } from '@/lib/student-data';
import { DailyAttendance } from '@/lib/attendance-data';
import { FeeCollection, feeCollectionFromDoc } from '@/lib/fees-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, CheckCircle2, XCircle, User, Banknote, CalendarCheck, AlertTriangle, Printer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const BENGALI_MONTHS = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export default function StudentProfileSearchPage() {
    const db = useFirestore();
    const { selectedYear } = useAcademicYear();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [isMounted, setIsMounted] = useState(false);
    const [roll, setRoll] = useState<string>('');
    const [className, setClassName] = useState<string>('');
    const [startMonth, setStartMonth] = useState<string>(BENGALI_MONTHS[0]);
    const [endMonth, setEndMonth] = useState<string>(BENGALI_MONTHS[new Date().getMonth()]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [studentData, setStudentData] = useState<Student | null>(null);
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, total: 0 });
    const [paidMonths, setPaidMonths] = useState<string[]>([]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && !authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router, isMounted]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !roll || !className || !user) {
            toast({ variant: 'destructive', title: 'অনুগ্রহ করে রোল এবং শ্রেণি পূরণ করুন।' });
            return;
        }

        setIsLoading(true);
        try {
            // 1. Find Student
            const studentQuery = query(
                collection(db, 'students'),
                where('academicYear', '==', selectedYear),
                where('className', '==', className),
                where('roll', '==', parseInt(roll, 10))
            );
            const studentSnap = await getDocs(studentQuery);

            if (studentSnap.empty) {
                toast({ variant: 'destructive', title: 'শিক্ষার্থী পাওয়া যায়নি।', description: 'অনুগ্রহ করে রোল ও শ্রেণি পরীক্ষা করুন।' });
                setIsLoading(false);
                return;
            }

            const foundStudent = studentFromDoc(studentSnap.docs[0]);
            setStudentData(foundStudent);

            // 2. Attendance Stats
            const startIdx = BENGALI_MONTHS.indexOf(startMonth);
            const endIdx = BENGALI_MONTHS.indexOf(endMonth);
            
            const startDate = `${selectedYear}-${String(startIdx + 1).padStart(2, '0')}-01`;
            const endDate = `${selectedYear}-${String(endIdx + 1).padStart(2, '0')}-31`;

            const attQuery = query(
                collection(db, 'attendance'),
                where('academicYear', '==', selectedYear),
                where('className', '==', className),
                where('date', '>=', startDate),
                where('date', '<=', endDate)
            );
            
            const attSnap = await getDocs(attQuery);
            const attRecords = attSnap.docs.map(doc => doc.data() as DailyAttendance);

            let presentCount = 0;
            let totalCount = 0;

            attRecords.forEach(record => {
                const studentAtt = record.attendance?.find(a => a.studentId === foundStudent.id);
                if (studentAtt) {
                    totalCount++;
                    if (studentAtt.status === 'present') presentCount++;
                }
            });

            setAttendanceStats({
                present: presentCount,
                absent: totalCount - presentCount,
                total: totalCount
            });

            // 3. Fee Status
            const feeQuery = query(
                collection(db, 'feeCollections'),
                where('studentId', '==', foundStudent.id),
                where('academicYear', '==', selectedYear)
            );
            const feeSnap = await getDocs(feeQuery);
            const feeRecords = feeSnap.docs.map(feeCollectionFromDoc).filter((f): f is FeeCollection => f !== null);
            
            const monthsPaid = new Set<string>();
            feeRecords.forEach(record => {
                BENGALI_MONTHS.forEach(m => {
                    if (record.description && record.description.includes(m)) {
                        monthsPaid.add(m);
                    }
                });
            });
            setPaidMonths(Array.from(monthsPaid));

            setShowProfile(true);
        } catch (error: any) {
            console.error("Search Error:", error);
            if (error.message?.includes('building')) {
                toast({
                    variant: 'default',
                    className: 'bg-amber-50 border-amber-200 text-amber-900',
                    title: 'ইন্ডেক্স তৈরি হচ্ছে',
                    description: 'প্রয়োজনীয় ইনডেক্সটি বর্তমানে ফায়ারবেসে তৈরি হচ্ছে। এটি সক্রিয় হতে সাধারণত ৩-৫ মিনিট সময় লাগে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
                    duration: 8000,
                });
            } else if (error.code === 'failed-precondition' || error.message?.includes('index')) {
                toast({
                    variant: 'destructive',
                    title: 'ইন্ডেক্স তৈরি করা প্রয়োজন',
                    description: 'এই ফিচারের জন্য ফায়ারবেসে একটি ইনডেক্স প্রয়োজন। অনুগ্রহ করে চ্যাট হিস্টোরিতে দেওয়া লিঙ্কে ক্লিক করে ইনডেক্সটি তৈরি করুন।',
                    duration: 10000,
                });
            } else {
                toast({ variant: 'destructive', title: 'অনুসন্ধান ব্যর্থ হয়েছে', description: 'সার্ভারে সংযোগ করতে সমস্যা হচ্ছে, আবার চেষ্টা করুন।' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const attendancePercentage = useMemo(() => {
        if (attendanceStats.total === 0) return 0;
        return (attendanceStats.present / attendanceStats.total) * 100;
    }, [attendanceStats]);

    if (!isMounted || authLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col bg-indigo-50">
                <Header />
                <main className="flex flex-1 flex-col items-center justify-center p-4">
                    <Card className="w-full max-w-lg shadow-xl">
                        <CardHeader><Skeleton className="h-8 w-3/4 mx-auto mb-2" /><Skeleton className="h-4 w-1/2 mx-auto" /></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                            <div className="grid grid-cols-2 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-indigo-50">
            <Header />
            <main className="flex flex-1 flex-col items-center justify-center p-4">
                <Card className="w-full max-w-lg shadow-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl text-primary font-bold">শিক্ষার্থী প্রোফাইল অনুসন্ধান</CardTitle>
                        <CardDescription>রোল এবং শ্রেণি দিয়ে শিক্ষার্থীর বিস্তারিত তথ্য দেখুন</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="roll">রোল নম্বর</Label>
                                    <Input id="roll" placeholder="উদা: ১" type="number" value={roll} onChange={e => setRoll(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="class">শ্রেণি</Label>
                                    <Select value={className} onValueChange={setClassName} required>
                                        <SelectTrigger id="class"><SelectValue placeholder="শ্রেণি নির্বাচন" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="6">৬ষ্ঠ</SelectItem>
                                            <SelectItem value="7">৭ম</SelectItem>
                                            <SelectItem value="8">৮ম</SelectItem>
                                            <SelectItem value="9">৯ম</SelectItem>
                                            <SelectItem value="10">১০ম</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-month">শুরুর মাস</Label>
                                    <Select value={startMonth} onValueChange={setStartMonth}>
                                        <SelectTrigger id="start-month"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {BENGALI_MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-month">শেষের মাস</Label>
                                    <Select value={endMonth} onValueChange={setEndMonth}>
                                        <SelectTrigger id="end-month"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {BENGALI_MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg shadow-md" disabled={isLoading}>
                                {isLoading ? 'অনুসন্ধান করা হচ্ছে...' : <><Search className="mr-2 h-5 w-5" /> তথ্য দেখুন</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>

            <Dialog open={showProfile} onOpenChange={setShowProfile}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    {studentData && (
                        <>
                            <DialogHeader className="no-print">
                                <div className="flex flex-col md:flex-row items-center gap-6 pb-4 border-b">
                                    <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-primary/20 shadow-lg">
                                        {studentData.photoUrl ? (
                                            <Image src={studentData.photoUrl} alt={studentData.studentNameBn} fill className="object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-muted">
                                                <User className="h-16 w-16 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center md:text-left space-y-1">
                                        <DialogTitle className="text-3xl font-bold text-primary">{studentData.studentNameBn}</DialogTitle>
                                        <p className="text-lg font-medium text-muted-foreground">
                                            রোল: {studentData.roll.toLocaleString('bn-BD')} | শ্রেণি: {studentData.className}-য়
                                        </p>
                                        <DialogDescription className="text-md">
                                            শিক্ষাবর্ষ: {studentData.academicYear.toLocaleString('bn-BD')}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-8 pt-4">
                                <section className="space-y-4">
                                    <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2 text-primary">
                                        <CalendarCheck className="h-5 w-5" /> হাজিরা রিপোর্ট ({startMonth} - {endMonth})
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-3 bg-green-50 rounded-lg border border-green-100 shadow-sm">
                                            <p className="text-sm text-green-600 font-medium">উপস্থিত</p>
                                            <p className="text-2xl font-bold">{attendanceStats.present.toLocaleString('bn-BD')} দিন</p>
                                        </div>
                                        <div className="p-3 bg-red-50 rounded-lg border border-red-100 shadow-sm">
                                            <p className="text-sm text-red-600 font-medium">অনুপস্থিত</p>
                                            <p className="text-2xl font-bold">{attendanceStats.absent.toLocaleString('bn-BD')} দিন</p>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
                                            <p className="text-sm text-blue-600 font-medium">মোট দিন</p>
                                            <p className="text-2xl font-bold">{attendanceStats.total.toLocaleString('bn-BD')} দিন</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>উপস্থিতির হার</span>
                                            <span className={cn("font-bold", attendancePercentage < 75 ? "text-red-600" : "text-green-600")}>
                                                {attendancePercentage.toFixed(2).toLocaleString('bn-BD')}%
                                            </span>
                                        </div>
                                        <Progress value={attendancePercentage} className="h-3" />
                                        {attendancePercentage < 75 && (
                                            <p className="text-[10px] text-red-500 flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" /> উপস্থিতির হার ৭৫% এর নিচে।
                                            </p>
                                        )}
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2 text-primary">
                                        <Banknote className="h-5 w-5" /> বেতন পরিশোধের অবস্থা
                                    </h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                        {BENGALI_MONTHS.map(month => {
                                            const isPaid = paidMonths.includes(month);
                                            return (
                                                <div 
                                                    key={month}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center p-2 rounded-md border text-center transition-all",
                                                        isPaid ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" : "bg-gray-50 border-gray-200 text-gray-400 opacity-60"
                                                    )}
                                                >
                                                    {isPaid ? <CheckCircle2 className="h-4 w-4 mb-1" /> : <XCircle className="h-4 w-4 mb-1" />}
                                                    <span className="text-xs font-bold">{month}</span>
                                                    <span className="text-[10px]">{isPaid ? 'পরিশোধিত' : 'বাকি'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                                
                                <div className="flex justify-end pt-4 no-print border-t">
                                    <Button variant="outline" onClick={() => window.print()} className="gap-2">
                                        <Printer className="h-4 w-4" /> প্রিন্ট করুন
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
