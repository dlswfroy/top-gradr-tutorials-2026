
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { Student, studentFromDoc } from '@/lib/student-data';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Users, User, Clock, History, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logMessage, getMessageLogs, MessageLog } from '@/lib/messaging-data';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function MessagingPage() {
    const db = useFirestore();
    const { selectedYear } = useAcademicYear();
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);

    const [messageContent, setMessageContent] = useState('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

    const classNamesMap: { [key: string]: string } = { '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম' };

    const fetchLogs = useCallback(async () => {
        if (!db) return;
        setIsLoadingLogs(true);
        const logs = await getMessageLogs(db);
        setMessageLogs(logs);
        setIsLoadingLogs(false);
    }, [db]);

    const fetchStudents = useCallback(async () => {
        if (!db) return;
        const q = query(collection(db, 'students'), where('academicYear', '==', selectedYear));
        const snap = await getDocs(q);
        setAllStudents(snap.docs.map(studentFromDoc));
    }, [db, selectedYear]);

    useEffect(() => {
        setIsClient(true);
        if (db) {
            fetchLogs();
            fetchStudents();
        }
    }, [db, fetchLogs, fetchStudents]);

    const studentsInClass = useMemo(() => {
        return allStudents.filter(s => s.className === selectedClass).sort((a,b) => a.roll - b.roll);
    }, [allStudents, selectedClass]);

    const handleToggleStudent = (id: string) => {
        const next = new Set(selectedStudentIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedStudentIds(next);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudentIds(new Set(studentsInClass.map(s => s.id)));
        } else {
            setSelectedStudentIds(new Set());
        }
    };

    const handleSendDirectSMS = (mobile: string, content: string) => {
        if (!mobile) {
            toast({ variant: 'destructive', title: 'মোবাইল নম্বর নেই' });
            return;
        }
        if (!content.trim()) {
            toast({ variant: 'destructive', title: 'মেসেজ লিখুন' });
            return;
        }
        const encodedContent = encodeURIComponent(content);
        window.location.href = `sms:${mobile}?body=${encodedContent}`;
    };

    const handleLogAndSimulateMessage = async (type: 'all' | 'class' | 'individual' | 'absent', recipientsCount: number) => {
        if (!db || !user) return;
        if (!messageContent.trim()) {
            toast({ variant: 'destructive', title: 'মেসেজ লিখুন' });
            return;
        }

        setIsLoading(true);
        try {
            await logMessage(db, {
                recipientsCount,
                type,
                className: selectedClass || undefined,
                content: messageContent,
                senderUid: user.uid,
                senderName: user.displayName || user.email || 'Admin'
            });

            toast({ title: 'মেসেজ রেকর্ড করা হয়েছে', description: `মোট ${recipientsCount.toLocaleString('bn-BD')} জনের জন্য মেসেজ লগ তৈরি করা হয়েছে।` });
            
            // For individual, if only one selected, offer direct send
            if (type === 'individual' && selectedStudentIds.size === 1) {
                const studentId = Array.from(selectedStudentIds)[0];
                const student = allStudents.find(s => s.id === studentId);
                if (student?.guardianMobile || student?.studentMobile) {
                    handleSendDirectSMS(student.guardianMobile || student.studentMobile || '', messageContent);
                }
            }

            setMessageContent('');
            setSelectedStudentIds(new Set());
            fetchLogs();
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'মেসেজ সেভ করা যায়নি', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAbsentStudents = async () => {
        if (!db || !selectedClass) {
            toast({ variant: 'destructive', title: 'শ্রেণি নির্বাচন করুন' });
            return;
        }
        setIsLoading(true);
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const q = query(
                collection(db, 'attendance'),
                where('date', '==', todayStr),
                where('className', '==', selectedClass),
                where('academicYear', '==', selectedYear)
            );
            const snap = await getDocs(q);
            if (snap.empty) {
                toast({ variant: 'destructive', title: 'আজকের হাজিরা এখনও নেওয়া হয়নি।' });
                setIsLoading(false);
                return;
            }
            const attData = snap.docs[0].data();
            const absentIds = attData.attendance.filter((a: any) => a.status === 'absent').map((a: any) => a.studentId);
            setSelectedStudentIds(new Set(absentIds));
            
            if (absentIds.length === 0) {
                toast({ title: 'সবাই উপস্থিত আছে!' });
            } else {
                toast({ title: `${absentIds.length.toLocaleString('bn-BD')} জন অনুপস্থিত পাওয়া গেছে।` });
            }
        } catch (e: any) {
            if (e.message?.includes('index')) {
                toast({ variant: 'destructive', title: 'ইনডেক্স তৈরি করা হয়নি', description: 'দয়া করে অনুপস্থিত শিক্ষার্থী খোঁজার জন্য ইনডেক্স তৈরি করুন।' });
            } else {
                toast({ variant: 'destructive', title: 'তথ্য আনা সম্ভব হয়নি' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isClient) return null;

    return (
        <div className="flex min-h-screen w-full flex-col bg-lime-50">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                    <Card className="md:col-span-2 lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                                <MessageSquare className="h-6 w-6 text-primary" /> মেসেজ সেন্টার
                            </CardTitle>
                            <CardDescription>শিক্ষার্থী ও অভিভাবকদের কাছে সরাসরি মেসেজ পাঠান</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="bulk" onValueChange={() => { setSelectedStudentIds(new Set()); setMessageContent(''); setSelectedClass(''); }}>
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="bulk">সকলকে</TabsTrigger>
                                    <TabsTrigger value="class">শ্রেণিভিত্তিক</TabsTrigger>
                                    <TabsTrigger value="individual">একক</TabsTrigger>
                                    <TabsTrigger value="absent">অনুপস্থিত</TabsTrigger>
                                </TabsList>

                                <div className="mt-6 space-y-6">
                                    <TabsContent value="bulk" className="space-y-4">
                                        <div className="p-4 bg-lime-100 border border-lime-200 rounded-lg flex items-center gap-4">
                                            <Users className="h-10 w-10 text-lime-700" />
                                            <div>
                                                <p className="font-bold text-lime-900">সকল শিক্ষার্থী</p>
                                                <p className="text-sm text-lime-700">পুরো স্কুলের {allStudents.length.toLocaleString('bn-BD')} জন শিক্ষার্থীর জন্য লগ তৈরি হবে।</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>বার্তার বিষয়বস্তু</Label>
                                            <Textarea 
                                                placeholder="আপনার বার্তা এখানে লিখুন..." 
                                                className="min-h-[150px]"
                                                value={messageContent}
                                                onChange={e => setMessageContent(e.target.value)}
                                            />
                                        </div>
                                        <Button 
                                            className="w-full h-12 text-lg" 
                                            disabled={isLoading || allStudents.length === 0}
                                            onClick={() => handleLogAndSimulateMessage('all', allStudents.length)}
                                        >
                                            <Send className="mr-2 h-5 w-5" /> রেকর্ড করুন ও পাঠান (Simulation)
                                        </Button>
                                        <p className="text-[10px] text-muted-foreground text-center italic">বাল্ক মেসেজ পাঠানোর জন্য গেটওয়ে প্রয়োজন। বর্তমানে এটি শুধুমাত্র সিস্টেমে রেকর্ড রাখবে।</p>
                                    </TabsContent>

                                    <TabsContent value="class" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>শ্রেণি নির্বাচন করুন</Label>
                                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                                <SelectTrigger><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
                                                <SelectContent>
                                                    {['6', '7', '8', '9', '10'].map(c => (
                                                        <SelectItem key={c} value={c}>{classNamesMap[c]} শ্রেণি</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {selectedClass && (
                                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                                <p className="font-bold text-blue-900">{classNamesMap[selectedClass]} শ্রেণি</p>
                                                <p className="text-sm text-blue-700">মোট {studentsInClass.length.toLocaleString('bn-BD')} জন শিক্ষার্থী।</p>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label>বার্তার বিষয়বস্তু</Label>
                                            <Textarea 
                                                placeholder="শ্রেণির জন্য বার্তা লিখুন..." 
                                                className="min-h-[150px]"
                                                value={messageContent}
                                                onChange={e => setMessageContent(e.target.value)}
                                            />
                                        </div>
                                        <Button 
                                            className="w-full h-12 text-lg" 
                                            disabled={isLoading || !selectedClass || studentsInClass.length === 0}
                                            onClick={() => handleLogAndSimulateMessage('class', studentsInClass.length)}
                                        >
                                            <Send className="mr-2 h-5 w-5" /> রেকর্ড করুন ও পাঠান
                                        </Button>
                                    </TabsContent>

                                    <TabsContent value="individual" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>শ্রেণি নির্বাচন করুন</Label>
                                            <Select value={selectedClass} onValueChange={c => { setSelectedClass(c); setSelectedStudentIds(new Set()); }}>
                                                <SelectTrigger><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
                                                <SelectContent>
                                                    {['6', '7', '8', '9', '10'].map(c => (
                                                        <SelectItem key={c} value={c}>{classNamesMap[c]} শ্রেণি</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {selectedClass && (
                                            <div className="border rounded-md max-h-[300px] overflow-y-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-12">
                                                                <Checkbox 
                                                                    checked={selectedStudentIds.size === studentsInClass.length && studentsInClass.length > 0}
                                                                    onCheckedChange={handleSelectAll}
                                                                />
                                                            </TableHead>
                                                            <TableHead>রোল</TableHead>
                                                            <TableHead>নাম</TableHead>
                                                            <TableHead>মোবাইল</TableHead>
                                                            <TableHead className="text-right">সরাসরি</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {studentsInClass.map(s => (
                                                            <TableRow key={s.id} className="cursor-pointer" onClick={() => handleToggleStudent(s.id)}>
                                                                <TableCell onClick={e => e.stopPropagation()}>
                                                                    <Checkbox 
                                                                        checked={selectedStudentIds.has(s.id)}
                                                                        onCheckedChange={() => handleToggleStudent(s.id)}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>{s.roll.toLocaleString('bn-BD')}</TableCell>
                                                                <TableCell>{s.studentNameBn}</TableCell>
                                                                <TableCell className="text-xs text-muted-foreground">{s.guardianMobile || '-'}</TableCell>
                                                                <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        title="নিজের সিম থেকে পাঠান"
                                                                        onClick={() => handleSendDirectSMS(s.guardianMobile || s.studentMobile || '', messageContent)}
                                                                        disabled={!messageContent.trim() || (!s.guardianMobile && !s.studentMobile)}
                                                                    >
                                                                        <Smartphone className="h-4 w-4 text-blue-600" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label>বার্তার বিষয়বস্তু</Label>
                                            <Textarea 
                                                placeholder="ব্যক্তিগত বার্তা লিখুন..." 
                                                value={messageContent}
                                                onChange={e => setMessageContent(e.target.value)}
                                            />
                                        </div>
                                        <Button 
                                            className="w-full h-12 text-lg" 
                                            disabled={isLoading || selectedStudentIds.size === 0}
                                            onClick={() => handleLogAndSimulateMessage('individual', selectedStudentIds.size)}
                                        >
                                            <Send className="mr-2 h-5 w-5" /> লগে সেভ করুন {selectedStudentIds.size > 0 && `(${selectedStudentIds.size.toLocaleString('bn-BD')} জন)`}
                                        </Button>
                                    </TabsContent>

                                    <TabsContent value="absent" className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                                            <div className="space-y-2">
                                                <Label>শ্রেণি</Label>
                                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                                    <SelectTrigger><SelectValue placeholder="শ্রেণি নির্বাচন" /></SelectTrigger>
                                                    <SelectContent>
                                                        {['6', '7', '8', '9', '10'].map(c => (
                                                            <SelectItem key={c} value={c}>{classNamesMap[c]} শ্রেণি</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button variant="outline" onClick={fetchAbsentStudents} disabled={!selectedClass || isLoading} className="h-10">
                                                আজকের অনুপস্থিত শিক্ষার্থী খুঁজুন
                                            </Button>
                                        </div>
                                        {selectedStudentIds.size > 0 && (
                                            <div className="border rounded-md max-h-[250px] overflow-y-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>রোল</TableHead>
                                                            <TableHead>নাম</TableHead>
                                                            <TableHead>মোবাইল</TableHead>
                                                            <TableHead className="text-right">একশন</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {studentsInClass.filter(s => selectedStudentIds.has(s.id)).map(s => (
                                                            <TableRow key={s.id}>
                                                                <TableCell>{s.roll.toLocaleString('bn-BD')}</TableCell>
                                                                <TableCell>{s.studentNameBn}</TableCell>
                                                                <TableCell className="text-xs">{s.guardianMobile || '-'}</TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm" 
                                                                        className="h-7 px-2 text-[10px]"
                                                                        onClick={() => handleSendDirectSMS(s.guardianMobile || s.studentMobile || '', messageContent)}
                                                                        disabled={!messageContent.trim() || (!s.guardianMobile && !s.studentMobile)}
                                                                    >
                                                                        <Smartphone className="h-3 w-3 mr-1" /> সিম থেকে পাঠান
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label>সতর্কবার্তা</Label>
                                            <Textarea 
                                                placeholder="সম্মানিত অভিভাবক, আপনার সন্তান আজ বিদ্যালয়ে অনুপস্থিত..." 
                                                value={messageContent}
                                                onChange={e => setMessageContent(e.target.value)}
                                            />
                                        </div>
                                        <Button 
                                            className="w-full h-12 text-lg" 
                                            variant="destructive"
                                            disabled={isLoading || selectedStudentIds.size === 0}
                                            onClick={() => handleLogAndSimulateMessage('absent', selectedStudentIds.size)}
                                        >
                                            <Send className="mr-2 h-5 w-5" /> লগে সেভ করুন (অনুপস্থিত {selectedStudentIds.size.toLocaleString('bn-BD')} জন)
                                        </Button>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-1 lg:col-span-1 border-primary/20 shadow-lg">
                        <CardHeader className="bg-primary/5 rounded-t-lg">
                            <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                <History className="h-5 w-5 text-primary" /> মেসেজ হিস্ট্রি
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[650px] overflow-y-auto">
                                {isLoadingLogs ? (
                                    <div className="p-4 space-y-4">
                                        <Skeleton className="h-20 w-full" />
                                        <Skeleton className="h-20 w-full" />
                                        <Skeleton className="h-20 w-full" />
                                    </div>
                                ) : messageLogs.length === 0 ? (
                                    <p className="p-8 text-center text-sm text-muted-foreground italic">এখনও কোনো মেসেজ পাঠানো হয়নি।</p>
                                ) : (
                                    <div className="divide-y">
                                        {messageLogs.map(log => (
                                            <div key={log.id} className="p-4 hover:bg-primary/5 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5">
                                                        {log.type === 'all' ? 'সকল' : log.type === 'class' ? 'শ্রেণি' : log.type === 'individual' ? 'একক' : 'অনুপস্থিত'}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground flex items-center bg-muted px-1.5 py-0.5 rounded">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {format(log.sentAt, 'PPp', { locale: bn })}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium line-clamp-3 mb-2 text-foreground">{log.content}</p>
                                                <div className="flex justify-between text-[10px] font-semibold text-muted-foreground pt-2 border-t border-dashed">
                                                    <span>প্রাপক: {log.recipientsCount.toLocaleString('bn-BD')} জন</span>
                                                    <span>প্রেরক: {log.senderName}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
