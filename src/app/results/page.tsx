
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { useAcademicYear } from '@/context/AcademicYearContext';
import { Student } from '@/lib/student-data';
import { getSubjects, Subject as SubjectType } from '@/lib/subjects';
import { saveClassResults, getResultsForClass, getAllResults, deleteClassResult, ClassResult, StudentResult } from '@/lib/results-data';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, FileUp, Download, FilePen } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


type Marks = {
    written?: number;
    mcq?: number;
    practical?: number;
}

export default function ResultsPage() {
    const { toast } = useToast();
    const { selectedYear } = useAcademicYear();
    const db = useFirestore();
    
    const [className, setClassName] = useState('');
    const [group, setGroup] = useState('');
    const [subject, setSubject] = useState('');
    const [fullMarks, setFullMarks] = useState<number | undefined>(100);
    
    const [availableSubjects, setAvailableSubjects] = useState<SubjectType[]>([]);
    const [selectedSubjectInfo, setSelectedSubjectInfo] = useState<SubjectType | null>(null);

    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [studentsForClass, setStudentsForClass] = useState<Student[]>([]);
    const [marks, setMarks] = useState<Map<string, Marks>>(new Map());
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    const [savedResults, setSavedResults] = useState<ClassResult[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const classNamesMap: { [key: string]: string } = { '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম' };
    const groupMap: { [key: string]: string } = { 'science': 'বিজ্ঞান', 'arts': 'মানবিক', 'commerce': 'ব্যবসায় শিক্ষা' };

    useEffect(() => {
      if (!db) return;
      const studentsQuery = query(collection(db, "students"));
      const unsubscribe = onSnapshot(studentsQuery, (querySnapshot) => {
        const studentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dob: doc.data().dob?.toDate(),
        })) as Student[];
        setAllStudents(studentsData);
      });
      return () => unsubscribe();
    }, [db]);


    const updateSavedResults = async () => {
        if (!db) return;
        const allResults = await getAllResults(db, selectedYear);
        setSavedResults(allResults);
    }
    
    useEffect(() => {
        updateSavedResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, db]);

    const groupedResults = useMemo(() => {
        if (savedResults.length === 0) return {};

        const groups: { [key: string]: ClassResult[] } = {};
        savedResults.forEach(res => {
            const key = res.className; // Use numeric class name as key for sorting
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(res);
        });

        // Sort results within each group
        for (const key in groups) {
            groups[key].sort((a, b) => {
                const groupA = a.group || '';
                const groupB = b.group || '';
                if (groupA !== groupB) {
                    return groupA.localeCompare(groupB);
                }
                return a.subject.localeCompare(b.subject, 'bn');
            });
        }
        return groups;
    }, [savedResults]);

    const sortedClassKeys = useMemo(() => {
        return Object.keys(groupedResults).sort((a, b) => parseInt(a) - parseInt(b));
    }, [groupedResults]);


    useEffect(() => {
        if (className) {
            const newSubjects = getSubjects(className, group);
            setAvailableSubjects(newSubjects);
            if (subject && !newSubjects.some(s => s.name === subject)) {
                setSubject('');
                setSelectedSubjectInfo(null);
            }
        } else {
            setAvailableSubjects([]);
            setSubject('');
            setSelectedSubjectInfo(null);
        }
    }, [className, group, subject]);

    useEffect(() => {
        if (subject) {
            const subInfo = availableSubjects.find(s => s.name === subject);
            setSelectedSubjectInfo(subInfo || null);
            if (subInfo) {
                if (studentsForClass.length === 0) {
                    setFullMarks(subInfo.fullMarks);
                }
            }
        } else {
            setSelectedSubjectInfo(null);
        }
    }, [subject, availableSubjects, studentsForClass.length]);
    
    const handleLoadStudents = async () => {
        if (!className || !subject || !db) {
            toast({ variant: 'destructive', title: 'তথ্য নির্বাচন করুন' });
            return;
        }

        setIsLoadingStudents(true);
        const filteredStudents = allStudents.filter(s => 
            s.academicYear === selectedYear && 
            s.className === className &&
            (className < '9' || !group || s.group === group)
        ).sort((a,b) => a.roll - b.roll);
        setStudentsForClass(filteredStudents);

        const existingResults = await getResultsForClass(db, selectedYear, className, subject, group);
        const initialMarks = new Map<string, Marks>();

        if (existingResults) {
            setFullMarks(existingResults.fullMarks);
            existingResults.results.forEach(res => {
                initialMarks.set(res.studentId, {
                    written: res.written,
                    mcq: res.mcq,
                    practical: res.practical
                });
            });
        } else {
            const subInfo = availableSubjects.find(s => s.name === subject);
            setFullMarks(subInfo?.fullMarks || 100);
        }
        
        filteredStudents.forEach(student => {
            if (!initialMarks.has(student.id)) {
                initialMarks.set(student.id, { written: undefined, mcq: undefined, practical: undefined });
            }
        });

        setMarks(initialMarks);
        setIsLoadingStudents(false);
    };

    const handleMarkChange = (studentId: string, field: keyof Marks, value: string) => {
        const numValue = value === '' ? undefined : parseInt(value, 10);
        const newMarks = new Map(marks);
        const studentMarks = newMarks.get(studentId) || {};
        studentMarks[field] = isNaN(numValue!) ? undefined : numValue;
        newMarks.set(studentId, studentMarks);
        setMarks(newMarks);
    };

    const handleSaveResults = async () => {
        if (!db) return;
        if (studentsForClass.length === 0) {
            toast({ variant: 'destructive', title: 'কোনো শিক্ষার্থী নেই' });
            return;
        }

        const resultsData: StudentResult[] = Array.from(marks.entries()).map(([studentId, marks]) => ({
            studentId,
            ...marks
        }));

        await saveClassResults(db, {
            academicYear: selectedYear,
            className,
            group: group || undefined,
            subject,
            fullMarks: fullMarks || selectedSubjectInfo?.fullMarks || 100,
            results: resultsData
        });
        
        await updateSavedResults();
        toast({ title: 'ফলাফল সেভ হয়েছে' });
    };

    const handleDeleteResult = async (result: ClassResult) => {
        if (!db || !result.id) return;
        await deleteClassResult(db, result.id);
        await updateSavedResults();
        toast({ title: 'ফলাফল মোছা হয়েছে' });
    }

    const handleEditClick = (resultToEdit: ClassResult) => {
        setClassName(resultToEdit.className);
        setGroup(resultToEdit.group || '');
        setFullMarks(resultToEdit.fullMarks);
        setTimeout(() => {
            setSubject(resultToEdit.subject);
            setStudentsForClass([]);
            setMarks(new Map());
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 0);
    };

    const handleDownloadSample = () => {
       const headers = [
            ['রোল', 'লিখিত', 'বহুনির্বাচনী', 'ব্যবহারিক']
        ];
        const ws = XLSX.utils.aoa_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'নম্বর নমুনা');
        XLSX.writeFile(wb, 'marks_sample.xlsx');
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!db || !className || !subject) {
            toast({
                variant: "destructive",
                title: "প্রথমে শ্রেণি ও বিষয় নির্বাচন করুন",
                description: "Excel ফাইল আপলোড করার আগে অনুগ্রহ করে শ্রেণি এবং বিষয় নির্বাচন করুন।",
            });
            return;
        }

        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    toast({ variant: "destructive", title: "ফাইল খালি" });
                    return;
                }
                
                if (studentsForClass.length === 0) {
                    toast({ variant: "destructive", title: "শিক্ষার্থী লোড করা হয়নি", description: "ফাইল আপলোড করার আগে 'শিক্ষার্থী লোড করুন' বাটনে ক্লিক করুন।" });
                    return;
                }

                const headerMapping: { [key: string]: keyof Marks } = {
                    'written': 'written', 'লিখিত': 'written',
                    'mcq': 'mcq', 'বহুনির্বাচনী': 'mcq',
                    'practical': 'practical', 'ব্যবহারিক': 'practical',
                };
                
                const bengaliToEnglishDigit: { [key: string]: string } = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
                const convertToNumber = (value: any): number | undefined => {
                    if (value === undefined || value === null || String(value).trim() === '') return undefined;
                    let strValue = String(value).trim();
                    strValue = strValue.replace(/[০-৯]/g, d => bengaliToEnglishDigit[d]);
                    const num = parseInt(strValue, 10);
                    return isNaN(num) ? undefined : num;
                };

                const newMarks = new Map(marks);
                let updatedCount = 0;
                const processingErrors: string[] = [];

                for (const [index, row] of json.entries()) {
                    const rollValue = (Object.keys(row as any).find(k => k.toLowerCase() === 'roll' || k === 'রোল') as any);
                    const roll = convertToNumber((row as any)[rollValue]);

                    if (roll === undefined) {
                        processingErrors.push(`সারি ${index + 2}: রোল নম্বর পাওয়া যায়নি।`);
                        continue;
                    }

                    const student = studentsForClass.find(s => s.roll === roll);
                    if (!student) {
                        processingErrors.push(`সারি ${index + 2}: রোল ${roll} এর জন্য কোনো শিক্ষার্থী পাওয়া যায়নি।`);
                        continue;
                    }

                    const studentMarks = newMarks.get(student.id) || {};
                    let rowUpdated = false;

                    for (const excelHeader of Object.keys(row as any)) {
                        const markKey = headerMapping[excelHeader.trim().toLowerCase()];
                        if (markKey) {
                            const markValue = convertToNumber((row as any)[excelHeader]);
                            if (markValue !== undefined) {
                                studentMarks[markKey] = markValue;
                                rowUpdated = true;
                            }
                        }
                    }
                    
                    if (rowUpdated) {
                        newMarks.set(student.id, studentMarks);
                        updatedCount++;
                    }
                }

                if (processingErrors.length > 0) {
                    throw new Error(processingErrors.join('\n'));
                }

                setMarks(newMarks);

                toast({
                    title: "নম্বর লোড হয়েছে",
                    description: `${updatedCount} জন শিক্ষার্থীর নম্বর Excel ফাইল থেকে লোড করা হয়েছে। পরিবর্তনগুলো সেভ করতে 'ফলাফল সেভ করুন' বাটনে ক্লিক করুন।`,
                });

            } catch (error: any) {
                console.error("File upload error:", error);
                toast({
                    variant: "destructive",
                    title: "ফাইল আপলোড ব্যর্থ হয়েছে",
                    description: error.message || "দয়া করে ফাইলের ফরম্যাট এবং আবশ্যকীয় তথ্য ঠিক আছে কিনা তা পরীক্ষা করুন।",
                    duration: 10000,
                });
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const showGroupSelector = className === '9' || className === '10';

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <CardTitle>ফলাফল ও নম্বর ব্যবস্থাপনা</CardTitle>
                                <CardDescription>শ্রেণি, বিষয় ও শাখা অনুযায়ী শিক্ষার্থীদের পরীক্ষার নম্বর ইনপুট করুন।</CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
                                <Button variant="outline" onClick={handleDownloadSample}>
                                    <Download className="mr-2 h-4 w-4" />
                                    নমুনা ফাইল
                                </Button>
                                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <FileUp className="mr-2 h-4 w-4" />
                                    Excel আপলোড
                                </Button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                                <Link href="/view-results">
                                    <Button variant="outline">ফলাফল শিট দেখুন</Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end p-4 border rounded-lg">
                             {!isClient ? (
                                <>
                                    <div className="space-y-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-10 w-full" /></div>
                                    {showGroupSelector && <div className="space-y-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-10 w-full" /></div>}
                                    <div className="space-y-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-10 w-full" /></div>
                                    <div className="space-y-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-10 w-full" /></div>
                                    <Skeleton className="h-10 w-full" />
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="class">শ্রেণি</Label>
                                        <Select value={className} onValueChange={setClassName}>
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

                                    {showGroupSelector && (
                                        <div className="space-y-2">
                                            <Label htmlFor="group">শাখা/গ্রুপ</Label>
                                            <Select value={group} onValueChange={setGroup}>
                                                <SelectTrigger id="group"><SelectValue placeholder="শাখা নির্বাচন" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="science">বিজ্ঞান</SelectItem>
                                                    <SelectItem value="arts">মানবিক</SelectItem>
                                                    <SelectItem value="commerce">ব্যবসায় শিক্ষা</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">বিষয়</Label>
                                        <Select value={subject} onValueChange={setSubject} disabled={!className}>
                                            <SelectTrigger id="subject"><SelectValue placeholder="বিষয় নির্বাচন" /></SelectTrigger>
                                            <SelectContent>
                                                {availableSubjects.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="full-marks">পূর্ণমান</Label>
                                        <Input 
                                            id="full-marks" 
                                            type="number" 
                                            placeholder="পূর্ণমান"
                                            value={fullMarks || ''}
                                            onChange={(e) => setFullMarks(e.target.value === '' ? undefined : parseInt(e.target.value))} 
                                        />
                                    </div>
                                    
                                    <Button onClick={handleLoadStudents} disabled={isLoadingStudents} className="w-full">
                                        {isLoadingStudents ? 'লোড হচ্ছে...' : 'শিক্ষার্থী লোড করুন'}
                                    </Button>
                                </>
                            )}
                        </div>
                        
                        {studentsForClass.length > 0 && (
                            <div className="overflow-x-auto border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>রোল</TableHead>
                                            <TableHead>শিক্ষার্থীর নাম</TableHead>
                                            <TableHead>লিখিত</TableHead>
                                            <TableHead>বহুনির্বাচনী</TableHead>
                                            {selectedSubjectInfo?.practical && <TableHead>ব্যবহারিক</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentsForClass.map(student => (
                                            <TableRow key={student.id}>
                                                <TableCell>{student.roll.toLocaleString('bn-BD')}</TableCell>
                                                <TableCell>{student.studentNameBn}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        placeholder="নম্বর"
                                                        value={marks.get(student.id)?.written || ''}
                                                        onChange={(e) => handleMarkChange(student.id, 'written', e.target.value)}
                                                        className="w-24"
                                                    />
                                                </TableCell>
                                                 <TableCell>
                                                    <Input
                                                        type="number"
                                                        placeholder="নম্বর"
                                                        value={marks.get(student.id)?.mcq || ''}
                                                        onChange={(e) => handleMarkChange(student.id, 'mcq', e.target.value)}
                                                        className="w-24"
                                                    />
                                                </TableCell>
                                                {selectedSubjectInfo?.practical && (
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            placeholder="নম্বর"
                                                            value={marks.get(student.id)?.practical || ''}
                                                            onChange={(e) => handleMarkChange(student.id, 'practical', e.target.value)}
                                                            className="w-24"
                                                        />
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="flex justify-end p-4 mt-4 border-t">
                                    <Button onClick={handleSaveResults}>ফলাফল সেভ করুন</Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">সংরক্ষিত ফলাফল (শিক্ষাবর্ষ {selectedYear.toLocaleString('bn-BD')})</h3>
                            {savedResults.length === 0 ? (
                                <div className="border rounded-md text-center text-muted-foreground py-8">
                                    এই শিক্ষাবর্ষে কোনো ফলাফল সেভ করা হয়নি।
                                </div>
                            ) : (
                                <Accordion type="multiple" className="w-full">
                                    {sortedClassKeys.map(classNameKey => (
                                        <AccordionItem value={classNameKey} key={classNameKey}>
                                            <AccordionTrigger>শ্রেণি {classNamesMap[classNameKey] || classNameKey}</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="border rounded-md overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>শাখা</TableHead>
                                                                <TableHead>বিষয়</TableHead>
                                                                <TableHead>পূর্ণমান</TableHead>
                                                                <TableHead className="text-right">কার্যক্রম</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {groupedResults[classNameKey].map((res, i) => (
                                                                <TableRow key={`${res.id}-${i}`}>
                                                                    <TableCell>{res.group ? groupMap[res.group] : '-'}</TableCell>
                                                                    <TableCell>{res.subject}</TableCell>
                                                                    <TableCell>{res.fullMarks.toLocaleString('bn-BD')}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex justify-end gap-2">
                                                                            <Button variant="outline" size="icon" onClick={() => handleEditClick(res)}>
                                                                                <FilePen className="h-4 w-4" />
                                                                            </Button>
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
                                                                                            এই বিষয়ের ফলাফল স্থায়ীভাবে মুছে যাবে।
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                                                                        <AlertDialogAction onClick={() => handleDeleteResult(res)}>
                                                                                            মুছে ফেলুন
                                                                                        </AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </div>

                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

    
