'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Upload } from 'lucide-react';
import { format } from "date-fns";
import { bn } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { addHoliday, getHolidays, deleteHoliday, Holiday, NewHolidayData } from '@/lib/holiday-data';
import { useSchoolInfo } from '@/context/SchoolInfoContext';
import type { SchoolInfo } from '@/lib/school-info';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, FirestoreError, where, getDocs } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { DatePicker } from '@/components/ui/date-picker';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { studentFromDoc, addStudent, NewStudentData } from '@/lib/student-data';
import { getSubjects } from '@/lib/subjects';
import { ClassResult } from '@/lib/results-data';
import { processStudentResults } from '@/lib/results-calculation';


function SchoolInfoSettings() {
    const { schoolInfo, updateSchoolInfo, isLoading } = useSchoolInfo();
    const { toast } = useToast();
    const [info, setInfo] = useState(schoolInfo);
    const [logoPreview, setLogoPreview] = useState<string | null>(schoolInfo.logoUrl);

    useEffect(() => {
        setInfo(schoolInfo);
        setLogoPreview(schoolInfo.logoUrl);
    }, [schoolInfo]);

    const handleInputChange = (field: keyof SchoolInfo, value: string) => {
        setInfo(prev => ({...prev, [field]: value}));
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setLogoPreview(result);
                handleInputChange('logoUrl', result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = () => {
        updateSchoolInfo(info).then(() => {
            toast({
                title: 'তথ্য সংরক্ষিতক্ষিত হয়েছে',
            });
        }).catch(() => {
            // Error handled by listener
        });
    };
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10" /></div>
                        </div>
                    </div>
                        <div className="space-y-4">
                        <Skeleton className="h-5 w-16" />
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-24 h-24 rounded-md" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t mt-4">
                        <Skeleton className="h-10 w-36" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>প্রতিষ্ঠানের সাধারণ তথ্য</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="schoolName">প্রতিষ্ঠানের নাম (বাংলা)</Label>
                            <Input id="schoolName" value={info.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolNameEn">School Name (English)</Label>
                            <Input id="schoolNameEn" value={info.nameEn || ''} onChange={(e) => handleInputChange('nameEn', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="eiin">EIIN</Label>
                            <Input id="eiin" value={info.eiin} onChange={(e) => handleInputChange('eiin', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolCode">স্কুল কোড</Label>
                            <Input id="schoolCode" value={info.code} onChange={(e) => handleInputChange('code', e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">ঠিকানা</Label>
                            <Textarea id="address" value={info.address} onChange={(e) => handleInputChange('address', e.target.value)} />
                        </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">লোগো</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-md border flex items-center justify-center bg-muted overflow-hidden">
                                {logoPreview ? (
                                    <Image src={logoPreview} alt="School Logo" width={96} height={96} className="object-contain w-full h-full" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
                                        <Upload className="h-8 w-8" />
                                        <span>লোগো</span>
                                    </div>
                                )}
                            </div>
                            <Input id="logo" name="logo" type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
                            <Button type="button" variant="outline" onClick={() => document.getElementById('logo')?.click()}>
                                লোগো আপলোড করুন
                            </Button>
                        </div>
                    </div>
              </div>

              <div className="flex justify-end pt-4 border-t mt-4">
                <Button onClick={handleSaveChanges}>পরিবর্তন সেভ করুন</Button>
              </div>

            </CardContent>
        </Card>
    );
}

function HolidaySettings() {
    const db = useFirestore();
    const { toast } = useToast();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newHolidayDate, setNewHolidayDate] = useState<Date | undefined>(undefined);
    const [newHolidayDescription, setNewHolidayDescription] = useState('');

    useEffect(() => {
        if (!db) return;
        setIsLoading(true);
        const holidaysQuery = query(collection(db, 'holidays'), orderBy('date'));
        const unsubscribe = onSnapshot(holidaysQuery, (snapshot) => {
            const holidaysData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday));
            setHolidays(holidaysData);
            setIsLoading(false);
        }, async (error: FirestoreError) => {
            const permissionError = new FirestorePermissionError({
                path: 'holidays',
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const handleAddHoliday = () => {
        if (!db) return;
        if (!newHolidayDate || !newHolidayDescription) {
            toast({
                variant: 'destructive',
                title: 'তথ্য অসম্পূর্ণ',
            });
            return;
        }

        const holidayData: NewHolidayData = {
            date: format(newHolidayDate, 'yyyy-MM-dd'),
            description: newHolidayDescription,
        };

        addHoliday(db, holidayData).then((result) => {
            if (result) {
                toast({
                    title: 'ছুটি যোগ হয়েছে',
                });
                setNewHolidayDate(undefined);
                setNewHolidayDescription('');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'ছুটি যোগ করা যায়নি',
                    description: 'এই তারিখে ইতিমধ্যে একটি ছুটি রয়েছে।',
                });
            }
        }).catch(() => {
            // Error handled by listener
        });
    };

    const handleDeleteHoliday = (id: string) => {
        if (!db) return;
        deleteHoliday(db, id).then(() => {
            toast({
                title: 'ছুটি মুছে ফেলা হয়েছে',
            });
        }).catch(() => {
            // Error handled by listener
        });
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>অতিরিক্ত ছুটির দিন</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex flex-col sm:flex-row items-end gap-4 p-4 border rounded-lg">
                    <div className="w-full space-y-2">
                        <Label htmlFor="holiday-date">তারিখ</Label>
                        <DatePicker value={newHolidayDate} onChange={setNewHolidayDate} />
                    </div>
                    <div className="w-full space-y-2">
                        <Label htmlFor="holiday-description">ছুটির কারণ</Label>
                        <Input
                            id="holiday-description"
                            value={newHolidayDescription}
                            onChange={(e) => setNewHolidayDescription(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleAddHoliday} className="w-full sm:w-auto">যোগ করুন</Button>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-4">ছুটির তালিকা</h3>
                    <div className="border rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>তারিখ</TableHead>
                                    <TableHead>কারণ</TableHead>
                                    <TableHead className="text-right">কার্যক্রম</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">লোড হচ্ছে...</TableCell>
                                    </TableRow>
                                ) : holidays.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            কোনো অতিরিক্ত ছুটি যোগ করা হয়নি।
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    holidays.map((holiday) => (
                                        <TableRow key={holiday.id}>
                                            <TableCell>{format(new Date(holiday.date), "d MMMM yyyy", { locale: bn })}</TableCell>
                                            <TableCell>{holiday.description}</TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                এই ছুটিটি তালিকা থেকে স্থায়ীভাবে মুছে যাবে।
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteHoliday(holiday.id)}>
                                                                মুছে ফেলুন
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StudentMigrationSettings() {
    const db = useFirestore();
    const { toast } = useToast();
    const { selectedYear } = useAcademicYear();
    const [isMigrating, setIsMigrating] = useState(false);

    const handleMigration = async () => {
        if (!db) return;
        setIsMigrating(true);
        toast({ title: "মাইগ্রেশন প্রক্রিয়া শুরু হয়েছে...", description: "এটি সম্পন্ন হতে কয়েক মুহূর্ত সময় লাগতে পারে।" });

        const fromYear = selectedYear;
        const toYear = String(parseInt(fromYear, 10) + 1);

        try {
            const studentsQuery = query(collection(db, "students"), where("academicYear", "==", fromYear));
            const resultsQuery = query(collection(db, "results"), where("academicYear", "==", fromYear));

            const [studentsSnapshot, resultsSnapshot] = await Promise.all([getDocs(studentsQuery), getDocs(resultsQuery)]);

            const allStudentsFromYear = studentsSnapshot.docs.map(doc => studentFromDoc(doc));
            const allResultsFromYear = resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassResult));
            
            if (allStudentsFromYear.length === 0) {
                toast({ variant: "destructive", title: "কোনো শিক্ষার্থী পাওয়া যায়নি", description: `${fromYear} শিক্ষাবর্ষে মাইগ্রেট করার জন্য কোনো শিক্ষার্থী নেই।` });
                setIsMigrating(false);
                return;
            }

            const classes = ['6', '7', '8', '9', '10'];
            const groups = ['science', 'arts', 'commerce'];

            let totalPromoted = 0;
            let totalFailed = 0;
            let totalGraduated = 0;
            
            const newStudentPromises: Promise<any>[] = [];

            for (const className of classes) {
                const classGroups = (className === '9' || className === '10') ? groups : [undefined];

                for (const group of classGroups) {
                    const studentsInGroup = allStudentsFromYear.filter(s =>
                        s.className === className && (group ? s.group === group : !s.group)
                    );

                    if (studentsInGroup.length === 0) continue;

                    const subjectsForGroup = getSubjects(className, group);
                    const resultsForGroup = allResultsFromYear.filter(r =>
                        r.className === className && (group ? r.group === group : !r.group)
                    );
                    
                    const finalResults = processStudentResults(studentsInGroup, resultsForGroup, subjectsForGroup);

                    const passedStudents = finalResults.filter(r => r.isPass).sort((a,b) => (a.meritPosition || 999) - (b.meritPosition || 999));
                    const failedStudents = finalResults.filter(r => !r.isPass).sort((a, b) => a.student.roll - b.student.roll);

                    if (className === '10') {
                        totalGraduated += passedStudents.length;
                    } else {
                        passedStudents.forEach((result, index) => {
                            const { id, createdAt, updatedAt, ...currentData } = result.student;
                            const nextClass = String(parseInt(className) + 1);
                            const newStudentData: NewStudentData = {
                                ...currentData,
                                academicYear: toYear,
                                className: nextClass,
                                roll: index + 1,
                                group: (nextClass === '9' || nextClass === '10') ? currentData.group : '',
                                optionalSubject: (nextClass === '9' || nextClass === '10') ? currentData.optionalSubject : '',
                            };
                            newStudentPromises.push(addStudent(db, newStudentData));
                            totalPromoted++;
                        });
                    }
                    
                    failedStudents.forEach((result, index) => {
                        const { id, createdAt, updatedAt, ...currentData } = result.student;
                        const newStudentData: NewStudentData = {
                            ...currentData,
                            academicYear: toYear,
                            className: className,
                            roll: index + 1,
                        };
                        newStudentPromises.push(addStudent(db, newStudentData));
                        totalFailed++;
                    });
                }
            }

            if (newStudentPromises.length === 0 && totalGraduated === 0) {
                 toast({
                    variant: "destructive",
                    title: "মাইগ্রেশন করার জন্য কোনো শিক্ষার্থী নেই",
                    description: "সকল শিক্ষার্থীর ফলাফল প্রক্রিয়া করা যায়নি অথবা কোনো পাশ করা শিক্ষার্থী নেই।",
                 });
                 setIsMigrating(false);
                 return;
            }

            await Promise.all(newStudentPromises);
            
            toast({
                title: "মাইগ্রেশন সম্পন্ন হয়েছে",
                description: `${totalPromoted} জন শিক্ষার্থী পরবর্তী শ্রেণিতে উত্তীর্ণ হয়েছে, ${totalFailed} জন ফেল করেছে এবং ${totalGraduated} জন গ্র্যাজুয়েট হয়েছে।`,
                duration: 9000,
            });

        } catch (error) {
            console.error("Migration failed:", error);
            toast({
                variant: "destructive",
                title: "মাইগ্রেশন ব্যর্থ হয়েছে",
                description: "একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
            });
        } finally {
            setIsMigrating(false);
        }
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>শিক্ষার্থী মাইগ্রেশন</CardTitle>
                <CardDescription>
                    নির্বাচিত শিক্ষাবর্ষ ({selectedYear.toLocaleString('bn-BD')}) থেকে পরবর্তী শিক্ষাবর্ষে ({String(parseInt(selectedYear, 10) + 1).toLocaleString('bn-BD')}) শিক্ষার্থীদের উত্তীর্ণ করুন।
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                    <h4 className="font-semibold text-destructive">সতর্কবাণী</h4>
                    <p className="text-sm text-muted-foreground">
                        এই প্রক্রিয়াটি необратиযোগ্য। এটি বার্ষিক পরীক্ষার ফলাফলের উপর ভিত্তি করে শিক্ষার্থীদের নতুন শিক্ষাবর্ষে নতুন ক্লাসে এবং নতুন রোল নম্বরে নথিভুক্ত করবে।
                        পূর্ববর্তী শিক্ষাবর্ষের সকল শিক্ষার্থীর রেকর্ড অক্ষত থাকবে। নিশ্চিত করুন যে সকল শ্রেণীর বার্ষিক পরীক্ষার ফলাফল সঠিকভাবে ইনপুট করা হয়েছে।
                    </p>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isMigrating}>
                            {isMigrating ? 'মাইগ্রেট করা হচ্ছে...' : `মাইগ্রেশন শুরু করুন (${selectedYear.toLocaleString('bn-BD')} → ${String(parseInt(selectedYear, 10) + 1).toLocaleString('bn-BD')})`}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                            <AlertDialogDescription>
                                এই কাজটি ফিরিয়ে আনা যাবে না। এটি {selectedYear.toLocaleString('bn-BD')} শিক্ষাবর্ষের সকল শিক্ষার্থীর জন্য চূড়ান্ত ফলাফল গণনা করবে এবং তাদের {String(parseInt(selectedYear, 10) + 1).toLocaleString('bn-BD')} শিক্ষাবর্ষে নতুন রেকর্ড তৈরি করবে। আপনি কি এগিয়ে যেতে চান?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>বাতিল</AlertDialogCancel>
                            <AlertDialogAction onClick={handleMigration}>চালিয়ে যান</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}


export default function SettingsPage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="flex min-h-screen w-full flex-col bg-indigo-50">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>সেটিংস</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isClient ? (
                            <Tabs defaultValue="school-info">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="school-info">প্রতিষ্ঠানের তথ্য</TabsTrigger>
                                    <TabsTrigger value="holidays">অতিরিক্ত ছুটি</TabsTrigger>
                                    <TabsTrigger value="migration">শিক্ষার্থী মাইগ্রেশন</TabsTrigger>
                                </TabsList>
                                <TabsContent value="school-info" className="pt-4">
                                    <SchoolInfoSettings />
                                </TabsContent>
                                <TabsContent value="holidays" className="pt-4">
                                   <HolidaySettings />
                                </TabsContent>
                                <TabsContent value="migration" className="pt-4">
                                   <StudentMigrationSettings />
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid w-full grid-cols-3 h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                                    <div className="inline-flex items-center justify-center rounded-sm bg-background shadow-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
                                    <div className="inline-flex items-center justify-center rounded-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
                                    <div className="inline-flex items-center justify-center rounded-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
                                </div>
                                <SchoolInfoSettings />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
