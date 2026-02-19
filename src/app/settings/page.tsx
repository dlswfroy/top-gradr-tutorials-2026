'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Trash2, Upload } from 'lucide-react';
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
import { collection, onSnapshot, query, orderBy, FirestoreError } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { DatePicker } from '@/components/ui/date-picker';


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
                description: 'প্রতিষ্ঠানের তথ্য সফলভাবে আপডেট করা হয়েছে।',
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
                    <Skeleton className="h-4 w-2/3" />
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
                <CardDescription>স্কুলের নাম, ঠিকানা, লোগো এবং অন্যান্য তথ্য এখানে পরিবর্তন করুন।</CardDescription>
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
                description: 'অনুগ্রহ করে তারিখ এবং ছুটির কারণ উল্লেখ করুন।',
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
                    description: `${format(newHolidayDate, "d MMMM yyyy", { locale: bn })} তারিখটি ছুটির তালিকাভুক্ত হয়েছে।`,
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
                description: 'নির্বাচিত ছুটিটি তালিকা থেকে মুছে ফেলা হয়েছে।',
            });
        }).catch(() => {
            // Error handled by listener
        });
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>অতিরিক্ত ছুটির দিন</CardTitle>
                <CardDescription>বিশেষ কারণে স্কুল বন্ধ থাকলে সেই দিনগুলো এখানে যোগ করুন।</CardDescription>
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
                            placeholder="যেমন: বিশেষ উৎসব"
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

export default function SettingsPage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>সেটিংস</CardTitle>
                        <CardDescription>অ্যাপ্লিকেশনের বিভিন্ন সেটিংস এখানে পরিচালনা করুন।</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isClient ? (
                            <Tabs defaultValue="school-info">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="school-info">প্রতিষ্ঠানের তথ্য</TabsTrigger>
                                    <TabsTrigger value="holidays">অতিরিক্ত ছুটি</TabsTrigger>
                                </TabsList>
                                <TabsContent value="school-info" className="pt-4">
                                    <SchoolInfoSettings />
                                </TabsContent>
                                <TabsContent value="holidays" className="pt-4">
                                   <HolidaySettings />
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid w-full grid-cols-2 h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                                    <div className="inline-flex items-center justify-center rounded-sm bg-background shadow-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
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
