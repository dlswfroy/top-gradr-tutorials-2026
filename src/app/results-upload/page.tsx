
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { useAcademicYear } from '@/context/AcademicYearContext';
import { getSubjects, Subject as SubjectType, subjectNameNormalization } from '@/lib/subjects';
import { saveClassResults, getResultsForClass, getDocumentId, ClassResult, StudentResult } from '@/lib/results-data';
import { Student } from '@/lib/student-data';
import * as XLSX from 'xlsx';
import { Download, FileUp } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResultsBulkUploadPage() {
    const { toast } = useToast();
    const { selectedYear } = useAcademicYear();
    const db = useFirestore();
    
    const [className, setClassName] = useState('');
    const [group, setGroup] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

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

    const handleDownloadSample = () => {
        if (!className) {
            toast({ variant: 'destructive', title: 'শ্রেণি নির্বাচন করুন' });
            return;
        }
    
        const headers: string[] = ['রোল', 'নাম'];
        const allPossibleSubjects = getSubjects(className, group || undefined);
    
        const addHeader = (header: string, sub: SubjectType) => {
            headers.push(`${header} (লিখিত)`);
            headers.push(`${header} (বহুনির্বাচনী)`);
            if (sub.practical) {
                headers.push(`${header} (ব্যবহারিক)`);
            }
        };
    
        if (className === '9' || className === '10') {
            if (!group) { // Master template for all groups
                 const allGroupSubjects = getSubjects(className);
                 const addedHeaders = new Set<string>();
                 allGroupSubjects.forEach(sub => {
                    if(!addedHeaders.has(sub.name)){
                        addHeader(sub.name, sub);
                        addedHeaders.add(sub.name);
                    }
                });
            } else { // Template for a specific group
                const groupSubjects = getSubjects(className, group);
                groupSubjects.forEach(sub => addHeader(sub.name, sub));
            }
        } else { // For class 6-8
            const subjectsForTemplate = getSubjects(className);
            subjectsForTemplate.forEach(subject => {
                addHeader(subject.name, subject);
            });
        }
    
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'ফলাফল নমুনা');
        XLSX.writeFile(wb, `results_sample_${className}_${group || 'all'}.xlsx`);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!db || !className) {
            toast({
                variant: "destructive",
                title: "প্রথমে শ্রেণি নির্বাচন করুন",
            });
            return;
        }
        setIsLoading(true);

        const file = event.target.files?.[0];
        if (!file) {
            setIsLoading(false);
            return;
        }

        const studentsForClass = allStudents.filter(s => 
            s.academicYear === selectedYear && 
            s.className === className
        );

        if (studentsForClass.length === 0) {
            toast({ variant: 'destructive', title: 'এই শ্রেণিতে কোনো শিক্ষার্থী নেই।'});
            setIsLoading(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];

                const resultsToSave = new Map<string, ClassResult>();

                for (const row of json) {
                    const bengaliToEnglishDigit: { [key: string]: string } = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
                    const rollStr = String(row['রোল'] || '').replace(/[০-৯]/g, d => bengaliToEnglishDigit[d]);
                    const roll = parseInt(rollStr, 10);
                    if (isNaN(roll)) continue;

                    const student = studentsForClass.find(s => s.roll === roll);
                    if (!student) continue;

                    const studentSubjects = getSubjects(student.className, student.group);

                    for (const header of Object.keys(row)) {
                        const match = header.match(/(.+?) \((.+)\)/);
                        if (!match) continue;

                        let subjectName = match[1].trim();
                        const markType = match[2].trim();
                        
                        subjectName = subjectNameNormalization[subjectName] || subjectName;

                        if (subjectName.includes('/')) {
                            const subjectParts = subjectName.split('/').map(p => {
                                const trimmed = p.trim();
                                return subjectNameNormalization[trimmed] || trimmed;
                            });
                            const applicableSubject = subjectParts.find(p => studentSubjects.map(s => s.name).includes(p));
                            if (applicableSubject) {
                                subjectName = applicableSubject;
                            } else {
                                continue;
                            }
                        }

                        const subjectInfo = studentSubjects.find(s => s.name === subjectName);
                        if (!subjectInfo) continue;

                        const docId = getDocumentId({
                            academicYear: selectedYear,
                            className: student.className,
                            subject: subjectName,
                            group: student.group || undefined
                        });

                        if (!resultsToSave.has(docId)) {
                            resultsToSave.set(docId, {
                                academicYear: selectedYear,
                                className: student.className,
                                group: student.group || undefined,
                                subject: subjectName,
                                fullMarks: subjectInfo.fullMarks,
                                results: []
                            });
                        }

                        const classResult = resultsToSave.get(docId)!;
                        let studentResult = classResult.results.find(r => r.studentId === student.id);
                        if (!studentResult) {
                            studentResult = { studentId: student.id };
                            classResult.results.push(studentResult);
                        }
                        
                        const markStr = String(row[header] || '').replace(/[০-৯]/g, d => bengaliToEnglishDigit[d]);
                        const markValue = (row[header] !== undefined && row[header] !== null && row[header] !== '') ? parseInt(markStr, 10) : undefined;

                        if (markValue === undefined || isNaN(markValue)) continue;

                        if (markType === 'লিখিত') studentResult.written = markValue;
                        else if (markType === 'বহুনির্বাচনী') studentResult.mcq = markValue;
                        else if (markType === 'ব্যবহারিক') studentResult.practical = markValue;
                    }
                }
                
                const subjectsToUpdate = Array.from(resultsToSave.values());

                if (subjectsToUpdate.length === 0) {
                     toast({
                        variant: 'destructive',
                        title: "কোনো শিক্ষার্থীর নম্বর পাওয়া যায়নি",
                        description: "আপনার আপলোড করা ফাইলে রোল নম্বর এবং নির্বাচিত শ্রেণির শিক্ষার্থীদের মধ্যে কোনো মিল পাওয়া যায়নি।",
                    });
                    setIsLoading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

                const promises = subjectsToUpdate.map(async (newClassResult) => {
                    const existingResult = await getResultsForClass(db, newClassResult.academicYear, newClassResult.className, newClassResult.subject, newClassResult.group);
                    
                    if (existingResult) {
                        const studentResultsMap = new Map(existingResult.results.map(r => [r.studentId, r]));
                        newClassResult.results.forEach(newRes => {
                            studentResultsMap.set(newRes.studentId, { ...studentResultsMap.get(newRes.studentId), ...newRes });
                        });
                        newClassResult.results = Array.from(studentResultsMap.values());
                    }

                    return saveClassResults(db, newClassResult);
                });

                await Promise.all(promises);

                toast({
                    title: "ফলাফল আপলোড সম্পন্ন",
                    description: `${promises.length} টি বিষয়ের ফলাফল সফলভাবে সেভ/আপডেট হয়েছে।`,
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
                setIsLoading(false);
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
                        <CardTitle>ফলাফল বাল্ক আপলোড</CardTitle>
                        <CardDescription>
                            এক্সেল ফাইল ব্যবহার করে একসাথে একাধিক বিষয়ের ও শিক্ষার্থীর ফলাফল আপলোড করুন। 
                            প্রথমে শ্রেণি ও গ্রুপ (প্রযোজ্য ক্ষেত্রে) নির্বাচন করে নমুনা ফাইল ডাউনলোড করুন।
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {isClient ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4 border rounded-lg">
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

                                <div className={`space-y-2 ${showGroupSelector ? '' : 'lg:hidden'}`}>
                                    <Label htmlFor="group">শাখা/গ্রুপ</Label>
                                     <Select value={group || 'all'} onValueChange={(val) => setGroup(val === 'all' ? '' : val)} disabled={!showGroupSelector}>
                                        <SelectTrigger id="group"><SelectValue placeholder="সকল গ্রুপ" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">সকল গ্রুপ</SelectItem>
                                            <SelectItem value="science">বিজ্ঞান</SelectItem>
                                            <SelectItem value="arts">মানবিক</SelectItem>
                                            <SelectItem value="commerce">ব্যবসায় শিক্ষা</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="hidden lg:block"></div>

                                <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                                    <Button variant="outline" onClick={handleDownloadSample} className="w-full">
                                        <Download className="mr-2 h-4 w-4" />
                                        নমুনা ফাইল
                                    </Button>
                                    <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full">
                                        <FileUp className="mr-2 h-4 w-4" />
                                        {isLoading ? 'আপলোড হচ্ছে...' : 'ফাইল আপলোড করুন'}
                                    </Button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                                </div>
                            </div>
                        ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4 border rounded-lg">
                                <div className="space-y-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-10 w-full" /></div>
                                <div className="space-y-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-10 w-full" /></div>
                                 <div className="hidden lg:block"></div>
                                <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
