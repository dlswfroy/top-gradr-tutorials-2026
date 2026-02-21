'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { useAcademicYear } from '@/context/AcademicYearContext';
import { Student, NewStudentData, addStudent } from '@/lib/student-data';
import { getSubjects, Subject as SubjectType } from '@/lib/subjects';
import { saveClassResults, getResultsForClass, getAllResults, deleteClassResult, ClassResult, StudentResult } from '@/lib/results-data';
import { processStudentResults, StudentProcessedResult } from '@/lib/results-calculation';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, FileUp, Download, FilePen, BookOpen } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, orderBy, FirestoreError } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type Marks = {
    written?: number;
    mcq?: number;
    practical?: number;
}

const MarkManagementTab = ({ allStudents }: { allStudents: Student[] }) => {
    const { toast } = useToast();
    const { selectedYear } = useAcademicYear();
    const db = useFirestore();
    
    const [className, setClassName] = useState('');
    const [group, setGroup] = useState('');
    const [subject, setSubject] = useState('');
    const [fullMarks, setFullMarks] = useState<number | undefined>(100);
    
    const [availableSubjects, setAvailableSubjects] = useState<SubjectType[]>([]);
    const [selectedSubjectInfo, setSelectedSubjectInfo] = useState<SubjectType | null>(null);

    const [studentsForClass, setStudentsForClass] = useState<Student[]>([]);
    const [marks, setMarks] = useState<Map<string, Marks>>(new Map());
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    const [savedResults, setSavedResults] = useState<ClassResult[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const classNamesMap: { [key: string]: string } = { '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম' };
    const groupMap: { [key: string]: string } = { 'science': 'বিজ্ঞান', 'arts': 'মানবিক', 'commerce': 'ব্যবসায় শিক্ষা' };

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
            const key = res.className;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(res);
        });

        const subjectOrder = [
            'বাংলা প্রথম', 'বাংলা দ্বিতীয়', 'ইংরেজি প্রথম', 'ইংরেজি দ্বিতীয়', 'গণিত', 'ধর্ম ও নৈতিক শিক্ষা',
            'তথ্য ও যোগাযোগ প্রযুক্তি', 'সাধারণ বিজ্ঞান', 'বিজ্ঞান', 'বাংলাদেশ ও বিশ্ব পরিচয়', 'কৃষি শিক্ষা',
            'শারীরিক শিক্ষা', 'পদার্থ', 'রসায়ন', 'জীব বিজ্ঞান', 'উচ্চতর গণিত', 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা',
            'ভূগোল ও পরিবেশ', 'পৌরনীতি ও নাগরিকতা', 'ব্যবসায় উদ্যোগ', 'হিসাব বিজ্ঞান', 'ফিন্যান্স ও ব্যাংকিং'
        ];

        for (const key in groups) {
            groups[key].sort((a, b) => {
                const groupA = a.group || '';
                const groupB = b.group || '';
                if (groupA !== groupB) {
                    return groupA.localeCompare(groupB, 'bn');
                }
                
                const indexA = subjectOrder.indexOf(a.subject);
                const indexB = subjectOrder.indexOf(b.subject);

                if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                }
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;

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

    const handleSaveResults = () => {
        if (!db) return;
        if (studentsForClass.length === 0) {
            toast({ variant: 'destructive', title: 'কোনো শিক্ষার্থী নেই' });
            return;
        }

        const resultsData: StudentResult[] = Array.from(marks.entries()).map(([studentId, marks]) => ({
            studentId,
            ...marks
        }));

        saveClassResults(db, {
            academicYear: selectedYear,
            className,
            group: group || undefined,
            subject,
            fullMarks: fullMarks || selectedSubjectInfo?.fullMarks || 100,
            results: resultsData
        }).then(() => {
            updateSavedResults();
            toast({ title: 'ফলাফল সেভ হয়েছে' });
        }).catch(() => {
            // Error handled by listener
        });
    };

    const handleDeleteResult = (result: ClassResult) => {
        if (!db || !result.id) return;
        deleteClassResult(db, result.id).then(() => {
            updateSavedResults();
            toast({ title: 'ফলাফল মোছা হয়েছে' });
        }).catch(() => {
            // Error handled by listener
        });
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
                    toast({ variant: "destructive", title: "শিক্ষার্থী লোড করা হয়নি" });
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
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end p-4 border rounded-lg">
                <div className="space-y-2">
                    <Label htmlFor="class"/>
                    <Select value={className} onValueChange={setClassName}>
                        <SelectTrigger id="class"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="6">৬ষ্ঠ</SelectItem>
                            <SelectItem value="7">৭ম</SelectItem>
                            <SelectItem value="8">৮ম</SelectItem>
                            <SelectItem value="9">৯ম</SelectItem>
                            <SelectItem value="10">১০ম</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {showGroupSelector ? (
                    <div className="space-y-2">
                        <Label htmlFor="group"/>
                        <Select value={group} onValueChange={setGroup}>
                            <SelectTrigger id="group"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="science">বিজ্ঞান</SelectItem>
                                <SelectItem value="arts">মানবিক</SelectItem>
                                <SelectItem value="commerce">ব্যবসায় শিক্ষা</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="hidden lg:block" />
                )}
                
                <div className="space-y-2">
                    <Label htmlFor="subject"/>
                    <Select value={subject} onValueChange={setSubject} disabled={!className}>
                        <SelectTrigger id="subject"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {availableSubjects.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="full-marks"/>
                    <Input 
                        id="full-marks" 
                        type="number" 
                        value={fullMarks || ''}
                        onChange={(e) => setFullMarks(e.target.value === '' ? undefined : parseInt(e.target.value))} 
                    />
                </div>
                
                <Button onClick={handleLoadStudents} disabled={isLoadingStudents} className="w-full">
                    {isLoadingStudents ? 'লোড হচ্ছে...' : 'শিক্ষার্থী লোড করুন'}
                </Button>
            </div>
            
            {studentsForClass.length > 0 && (
                <div className="overflow-x-auto border rounded-md">
                    <div className="flex justify-end p-2 gap-2">
                         <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                            <Download className="mr-2 h-4 w-4" />
                            নমুনা
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <FileUp className="mr-2 h-4 w-4" />
                            আপলোড
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                    </div>
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
                                            value={marks.get(student.id)?.written || ''}
                                            onChange={(e) => handleMarkChange(student.id, 'written', e.target.value)}
                                            className="w-24"
                                        />
                                    </TableCell>
                                     <TableCell>
                                        <Input
                                            type="number"
                                            value={marks.get(student.id)?.mcq || ''}
                                            onChange={(e) => handleMarkChange(student.id, 'mcq', e.target.value)}
                                            className="w-24"
                                        />
                                    </TableCell>
                                    {selectedSubjectInfo?.practical && (
                                        <TableCell>
                                            <Input
                                                type="number"
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
                                                    <TableHead>ক্রমিক নং</TableHead>
                                                    <TableHead>শাখা</TableHead>
                                                    <TableHead>বিষয়</TableHead>
                                                    <TableHead>পূর্ণমান</TableHead>
                                                    <TableHead className="text-right">কার্যক্রম</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {groupedResults[classNameKey].map((res, i) => (
                                                    <TableRow key={`${res.id}-${i}`}>
                                                        <TableCell>{(i + 1).toLocaleString('bn-BD')}</TableCell>
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

        </div>
    );
};

const ResultSheetTab = ({ allStudents }: { allStudents: Student[] }) => {
    const { toast } = useToast();
    const { selectedYear } = useAcademicYear();
    const db = useFirestore();
    
    const [className, setClassName] = useState('');
    const [group, setGroup] = useState('');
    
    const [processedResults, setProcessedResults] = useState<StudentProcessedResult[]>([]);
    const [subjects, setSubjects] = useState<SubjectType[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleViewResults = async () => {
        if (!className || !db) {
            toast({
                variant: 'destructive',
                title: 'শ্রেণি নির্বাচন করুন',
            });
            return;
        }

        setIsLoading(true);

        const studentsInClass = allStudents.filter(s => 
            s.academicYear === selectedYear && 
            s.className === className &&
            (className < '9' || !group || s.group === group)
        ).sort((a,b) => a.roll - b.roll);

        if (studentsInClass.length === 0) {
            toast({ title: 'এই শ্রেণিতে কোনো শিক্ষার্থী নেই।'});
            setProcessedResults([]);
            setSubjects([]);
            setIsLoading(false);
            return;
        }

        const allSubjectsForGroup = getSubjects(className, group);
        setSubjects(allSubjectsForGroup);
        
        const resultsBySubjectPromises = allSubjectsForGroup.map(subject => {
            return getResultsForClass(db, selectedYear, className, subject.name, group);
        });
        const resultsBySubject = (await Promise.all(resultsBySubjectPromises)).filter((result): result is ClassResult => result !== undefined);


        const finalResults = processStudentResults(studentsInClass, resultsBySubject, allSubjectsForGroup);
        setProcessedResults(finalResults);

        setIsLoading(false);
    };

    const handlePromoteStudents = async () => {
        if (!db) return;
        if (processedResults.length === 0) {
            toast({
                variant: 'destructive',
                title: 'কোনো ফলাফল নেই',
            });
            return;
        }
    
        const nextYear = String(parseInt(selectedYear, 10) + 1);
    
        const passedStudentsToPromote = processedResults
            .filter(r => r.isPass && r.student.className !== '10')
            .sort((a, b) => (a.meritPosition || 999) - (b.meritPosition || 999));
        
        const promotionPromises: Promise<any>[] = [];
    
        passedStudentsToPromote.forEach((result, index) => {
            const nextClass = String(parseInt(result.student.className, 10) + 1);
            const { id, createdAt, updatedAt, ...currentData } = result.student;
            
            const newStudentData: NewStudentData = {
                ...currentData,
                academicYear: nextYear,
                className: nextClass,
                roll: index + 1, 
                group: (nextClass === '9' || nextClass === '10') ? currentData.group : undefined,
            };
    
            promotionPromises.push(addStudent(db, newStudentData));
        });
        
        await Promise.all(promotionPromises);
    
        const promotedCount = passedStudentsToPromote.length;
        const graduatedCount = processedResults.filter(r => r.isPass && r.student.className === '10').length;
        const failedCount = processedResults.filter(r => !r.isPass).length;
    
        toast({
            title: 'শিক্ষার্থী উত্তীর্ণ করা সম্পন্ন',
            description: `${promotedCount} জন শিক্ষার্থী পরবর্তী শ্রেণিতে (${nextYear}) উত্তীর্ণ হয়েছে। ${graduatedCount} জন গ্র্যাজুয়েট হয়েছে। ${failedCount} জন ফেল করেছে।`,
            duration: 8000,
        });
    
        setProcessedResults([]); 
        setSubjects([]);
    };

    const showGroupSelector = className === '9' || className === '10';

    const renderMeritPosition = (position?: number) => {
        if (!position) return '-';
        const bnPosition = position.toLocaleString('bn-BD');
        if (position === 1) return `${bnPosition}ম`;
        if (position === 2) return `${bnPosition}য়`;
        if (position === 3) return `${bnPosition}য়`;
        if ([4, 5, 6, 7, 8, 9, 10].includes(position)) {
             if (position === 4) return `${bnPosition}র্থ`;
             if (position === 5) return `${bnPosition}ম`;
             if (position === 6) return `${bnPosition}ষ্ঠ`;
             if (position === 7) return `${bnPosition}ম`;
             if (position === 8) return `${bnPosition}ম`;
             if (position === 9) return `${bnPosition}ম`;
             if (position === 10) return `${bnPosition}ম`;
        }
        return `${bnPosition}তম`;
    }

    const tableHeaders = useMemo(() => {
        if (subjects.length === 0) return null;

        return (
            <TableHeader>
                <TableRow>
                    <TableHead rowSpan={2} className="align-middle text-center bg-background sticky left-0 z-10 md:min-w-[80px]">রোল</TableHead>
                    <TableHead rowSpan={2} className="align-middle text-center min-w-[200px] bg-background md:sticky md:left-[80px] md:z-10">শিক্ষার্থীর নাম</TableHead>
                    {subjects.map(subject => (
                        <TableHead key={subject.name} colSpan={3} className={cn("text-center border-x")}>
                            {subject.name}
                        </TableHead>
                    ))}
                    <TableHead rowSpan={2} className="align-middle text-center">মোট নম্বর</TableHead>
                    <TableHead rowSpan={2} className="align-middle text-center">জি.পি.এ</TableHead>
                    <TableHead rowSpan={2} className="align-middle text-center">গ্রেড</TableHead>
                    <TableHead rowSpan={2} className="align-middle text-center">মেধাস্থান</TableHead>
                    <TableHead rowSpan={2} className="align-middle text-center">মার্কশিট</TableHead>
                </TableRow>
                <TableRow>
                    {subjects.map(subject => (
                        <React.Fragment key={`${subject.name}-cols`}>
                            <TableHead className="text-center border-l">মোট</TableHead>
                            <TableHead className="text-center border-l">গ্রেড</TableHead>
                            <TableHead className="text-center border-l border-r">পয়েন্ট</TableHead>
                        </React.Fragment>
                    ))}
                </TableRow>
            </TableHeader>
        );
    }, [subjects]);


    return (
         <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4 border rounded-lg w-full">
                    <div className="space-y-2">
                        <Label htmlFor="class-sheet"/>
                        <Select value={className} onValueChange={c => { setClassName(c); setGroup(''); }}>
                            <SelectTrigger id="class-sheet"><SelectValue /></SelectTrigger>
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
                            <Label htmlFor="group-sheet"/>
                            <Select value={group} onValueChange={g => { setGroup(g); }}>
                                <SelectTrigger id="group-sheet"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="science">বিজ্ঞান</SelectItem>
                                    <SelectItem value="arts">মানবিক</SelectItem>
                                    <SelectItem value="commerce">ব্যবসায় শিক্ষা</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    
                    <Button onClick={handleViewResults} disabled={isLoading} className="w-full lg:col-span-2 lg:col-start-3">
                        {isLoading ? 'লোড হচ্ছে...' : 'ফলাফল দেখুন'}
                    </Button>
                </div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button disabled={isLoading || processedResults.filter(r => r.isPass).length === 0}>
                            পরবর্তী সেশনে উত্তীর্ণ করুন
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                        <AlertDialogDescription>
                            এটি উত্তীর্ণ শিক্ষার্থীদের পরবর্তী শিক্ষাবর্ষ ({String(parseInt(selectedYear, 10) + 1)}) এবং পরবর্তী শ্রেণিতে পাঠাবে। এই কাজটি ফিরিয়ে আনা যাবে না।
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePromoteStudents}>উত্তীর্ণ করুন</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            
            {isLoading && <p>ফলাফল লোড হচ্ছে...</p>}

            {processedResults.length > 0 && subjects.length > 0 && (
                <div className="border rounded-md overflow-x-auto relative">
                    <Table className="min-w-max">
                        {tableHeaders}
                        <TableBody>
                            {processedResults.map(res => (
                                <TableRow key={res.student.id}>
                                    <TableCell className="text-center bg-background sticky left-0 z-10 md:min-w-[80px]">{res.student.roll.toLocaleString('bn-BD')}</TableCell>
                                    <TableCell className="whitespace-nowrap bg-background md:sticky md:left-[80px] md:z-10">{res.student.studentNameBn}</TableCell>
                                    {subjects.map(subject => {
                                        const subjectRes = res.subjectResults.get(subject.name);
                                        return (
                                            <React.Fragment key={`${res.student.id}-${subject.name}`}>
                                                <TableCell className="text-center border-l font-semibold">{subjectRes?.marks?.toLocaleString('bn-BD') ?? '-'}</TableCell>
                                                <TableCell className={cn("text-center border-l", {"text-destructive font-bold": subjectRes && !subjectRes.isPass})}>{subjectRes?.grade ?? '-'}</TableCell>
                                                <TableCell className="text-center border-l border-r">{subjectRes?.point?.toFixed(2).toLocaleString('bn-BD') ?? '-'}</TableCell>
                                            </React.Fragment>
                                        )
                                    })}
                                    <TableCell className="text-center font-bold">{res.totalMarks.toLocaleString('bn-BD')}</TableCell>
                                    <TableCell className="text-center font-bold">{res.gpa.toFixed(2).toLocaleString('bn-BD')}</TableCell>
                                    <TableCell className="text-center font-bold">{res.finalGrade}</TableCell>
                                    <TableCell className={cn("text-center font-bold", {"text-destructive": !res.isPass})}>
                                        {res.isPass ? renderMeritPosition(res.meritPosition) : `ফেল (${res.failedSubjectsCount.toLocaleString('bn-BD')})`}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Link href={`/marksheet/${res.student.id}?academicYear=${selectedYear}&className=${className}&group=${group || ''}&optionalSubject=${res.student.optionalSubject || ''}`} target="_blank">
                                            <Button variant="outline" size="icon">
                                                <BookOpen className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};

const BulkUploadTab = ({ allStudents }: { allStudents: Student[] }) => {
    const { toast } = useToast();
    const { selectedYear } = useAcademicYear();
    const db = useFirestore();
    
    const [className, setClassName] = useState('');
    const [group, setGroup] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadSample = () => {
        if (!className) {
            toast({ variant: 'destructive', title: 'শ্রেণি নির্বাচন করুন' });
            return;
        }
    
        const headers: string[] = ['রোল', 'নাম'];
    
        const addHeader = (header: string, hasPractical: boolean) => {
            headers.push(`${header} (লিখিত)`);
            headers.push(`${header} (বহুনির্বাচনী)`);
            if (hasPractical) {
                headers.push(`${header} (ব্যবহারিক)`);
            }
        };
    
        if (className === '9' || className === '10') {
            if (!group) { 
                addHeader('বাংলা প্রথম', false);
                addHeader('বাংলা দ্বিতীয়', false);
                addHeader('ইংরেজি প্রথম', false);
                addHeader('ইংরেজি দ্বিতীয়', false);
                addHeader('গণিত', false);
                addHeader('ধর্ম ও নৈতিক শিক্ষা', false);
                addHeader('তথ্য ও যোগাযোগ প্রযুক্তি', false);
                addHeader('সাধারণ বিজ্ঞান/বাংলাদেশ ও বিশ্ব পরিচয়', false);
                addHeader('বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা/পদার্থ', true);
                addHeader('ভূগোল ও পরিবেশ/রসায়ন', true);
                addHeader('পৌরনীতি ও নাগরিকতা/জীব বিজ্ঞান', true);
                addHeader('কৃষি শিক্ষা/উচ্চতর গণিত', true);
    
            } else {
                const groupSubjects = getSubjects(className, group);
                groupSubjects.forEach(sub => addHeader(sub.name, sub.practical));
            }
        } else { 
            const subjectsForTemplate = getSubjects(className);
            subjectsForTemplate.forEach(subject => {
                addHeader(subject.name, subject.practical);
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
                        
                        const { subjectNameNormalization } = await import('@/lib/subjects');
                        subjectName = subjectNameNormalization[subjectName] || subjectName;

                        if (subjectName.includes('/')) {
                            const applicableSubject = subjectName.split('/').map(p => p.trim()).find(p => studentSubjects.map(s => s.name).includes(subjectNameNormalization[p] || p));
                            if (applicableSubject) {
                                subjectName = subjectNameNormalization[applicableSubject] || applicableSubject;
                            } else {
                                continue;
                            }
                        }

                        const subjectInfo = studentSubjects.find(s => s.name === subjectName);
                        if (!subjectInfo) continue;

                        const { getDocumentId } = await import('@/lib/results-data');
                        const docId = getDocumentId({
                            academicYear: selectedYear,
                            className: student.className,
                            subject: subjectName,
                            group: student.group
                        });

                        if (!resultsToSave.has(docId)) {
                            resultsToSave.set(docId, {
                                academicYear: selectedYear,
                                className: student.className,
                                group: student.group,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4 border rounded-lg">
            <div className="space-y-2">
                <Label htmlFor="class-upload"/>
                <Select value={className} onValueChange={setClassName}>
                    <SelectTrigger id="class-upload"><SelectValue /></SelectTrigger>
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
                <Label htmlFor="group-upload"/>
                 <Select value={group || 'all'} onValueChange={(val) => setGroup(val === 'all' ? '' : val)} disabled={!showGroupSelector}>
                    <SelectTrigger id="group-upload"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">সকল গ্রুপ</SelectItem>
                        <SelectItem value="science">বিজ্ঞান</SelectItem>
                        <SelectItem value="arts">মানবিক</SelectItem>
                        <SelectItem value="commerce">ব্যবসায় শিক্ষা</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div className="hidden lg:block"></div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:col-span-2">
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
    );
};


export default function ResultsPage() {
    const [isClient, setIsClient] = useState(false);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const db = useFirestore();
    const { selectedYear } = useAcademicYear();

    useEffect(() => {
        setIsClient(true);
        if (!db) return;
        
        const studentsQuery = query(collection(db, "students"));
        const unsubscribe = onSnapshot(studentsQuery, (querySnapshot) => {
            const studentsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dob: doc.data().dob?.toDate(),
            })) as Student[];
            setAllStudents(studentsData);
            setIsLoading(false);
        }, async (error: FirestoreError) => {
            const permissionError = new FirestorePermissionError({ path: 'students', operation: 'list' });
            errorEmitter.emit('permission-error', permissionError);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    return (
        <div className="flex min-h-screen w-full flex-col bg-violet-50">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>ফলাফল</CardTitle>
                        {isClient && <p className="text-sm text-muted-foreground">শিক্ষাবর্ষ: {selectedYear.toLocaleString('bn-BD')}</p>}
                    </CardHeader>
                    <CardContent>
                        {isClient ? (
                            <Tabs defaultValue="management">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="management">নম্বর ব্যবস্থাপনা</TabsTrigger>
                                    <TabsTrigger value="sheet">ফলাফল শিট</TabsTrigger>
                                    <TabsTrigger value="upload">এক্সেল আপলোড</TabsTrigger>
                                </TabsList>
                                <TabsContent value="management" className="mt-4">
                                     {isLoading ? <p>লোড হচ্ছে...</p> : <MarkManagementTab allStudents={allStudents} />}
                                </TabsContent>
                                <TabsContent value="sheet" className="mt-4">
                                    {isLoading ? <p>লোড হচ্ছে...</p> : <ResultSheetTab allStudents={allStudents} />}
                                </TabsContent>
                                <TabsContent value="upload" className="mt-4">
                                     {isLoading ? <p>লোড হচ্ছে...</p> : <BulkUploadTab allStudents={allStudents} />}
                                </TabsContent>
                            </Tabs>
                        ) : (
                           <div className="space-y-4">
                               <div className="grid w-full grid-cols-3 h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                                    <div className="inline-flex items-center justify-center rounded-sm bg-background shadow-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
                                    <div className="inline-flex items-center justify-center rounded-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
                                    <div className="inline-flex items-center justify-center rounded-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <Skeleton className="h-24 w-full" />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
