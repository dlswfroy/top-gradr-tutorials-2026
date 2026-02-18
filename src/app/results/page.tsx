
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
import { getStudents, Student } from '@/lib/student-data';
import { getSubjects, Subject as SubjectType } from '@/lib/subjects';
import { saveClassResults, getResultsForClass, getAllResults, deleteClassResult, ClassResult, StudentResult } from '@/lib/results-data';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, FileUp, Download, FilePen } from 'lucide-react';
import * as XLSX from 'xlsx';


type Marks = {
    written?: number;
    mcq?: number;
    practical?: number;
}

export default function ResultsPage() {
    const { toast } = useToast();
    const { selectedYear } = useAcademicYear();
    
    const [className, setClassName] = useState('');
    const [group, setGroup] = useState('');
    const [subject, setSubject] = useState('');
    const [fullMarks, setFullMarks] = useState<number | undefined>(100);
    
    const [availableSubjects, setAvailableSubjects] = useState<SubjectType[]>([]);
    const [selectedSubjectInfo, setSelectedSubjectInfo] = useState<SubjectType | null>(null);

    const [students, setStudents] = useState<Student[]>([]);
    const [marks, setMarks] = useState<Map<number, Marks>>(new Map());

    const [savedResults, setSavedResults] = useState<ClassResult[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateSavedResults = () => {
        const allResults = getAllResults().filter(r => r.academicYear === selectedYear);
        setSavedResults(allResults);
    }
    
    useEffect(() => {
        updateSavedResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    useEffect(() => {
        if (className) {
            const subjects = getSubjects(className, group);
            setAvailableSubjects(subjects);
            setSubject(''); 
            setSelectedSubjectInfo(null);
        } else {
            setAvailableSubjects([]);
        }
    }, [className, group]);

    useEffect(() => {
        if (subject) {
            const subInfo = availableSubjects.find(s => s.name === subject);
            setSelectedSubjectInfo(subInfo || null);
        } else {
            setSelectedSubjectInfo(null);
        }
    }, [subject, availableSubjects]);
    
    const handleLoadStudents = () => {
        if (!className || !subject) {
            toast({
                variant: 'destructive',
                title: 'তথ্য নির্বাচন করুন',
                description: 'অনুগ্রহ করে শ্রেণি এবং বিষয় নির্বাচন করুন।',
            });
            return;
        }

        const allStudents = getStudents();
        const filteredStudents = allStudents.filter(s => 
            s.academicYear === selectedYear && 
            s.className === className &&
            (className < '9' || !group || s.group === group)
        );
        setStudents(filteredStudents);

        const existingResults = getResultsForClass(selectedYear, className, subject, group);
        const initialMarks = new Map<number, Marks>();

        if (existingResults) {
            setFullMarks(existingResults.fullMarks);
            existingResults.results.forEach(res => {
                initialMarks.set(res.studentId, {
                    written: res.written,
                    mcq: res.mcq,
                    practical: res.practical
                });
            });
        }
        
        filteredStudents.forEach(student => {
            if (!initialMarks.has(student.id)) {
                initialMarks.set(student.id, { written: undefined, mcq: undefined, practical: undefined });
            }
        });

        setMarks(initialMarks);
    };

    const handleMarkChange = (studentId: number, field: keyof Marks, value: string) => {
        const numValue = value === '' ? undefined : parseInt(value, 10);
        const newMarks = new Map(marks);
        const studentMarks = newMarks.get(studentId) || {};
        studentMarks[field] = isNaN(numValue!) ? undefined : numValue;
        newMarks.set(studentId, studentMarks);
        setMarks(newMarks);
    };

    const handleSaveResults = () => {
        if (students.length === 0) {
            toast({
                variant: 'destructive',
                title: 'কোনো শিক্ষার্থী নেই',
                description: 'নম্বর সেভ করার জন্য কোনো শিক্ষার্থী পাওয়া যায়নি।',
            });
            return;
        }

        const resultsData: StudentResult[] = Array.from(marks.entries()).map(([studentId, marks]) => ({
            studentId,
            ...marks
        }));

        saveClassResults({
            academicYear: selectedYear,
            className,
            group: group || undefined,
            subject,
            fullMarks: fullMarks || 100,
            results: resultsData
        });
        
        updateSavedResults();

        toast({
            title: 'ফলাফল সেভ হয়েছে',
            description: `${subject} বিষয়ের নম্বর সফলভাবে সেভ করা হয়েছে।`
        });
    };

    const handleDeleteResult = (result: ClassResult) => {
        deleteClassResult(result.academicYear, result.className, result.subject, result.group);
        updateSavedResults();
        toast({
            title: 'ফলাফল মোছা হয়েছে',
            description: `${result.subject} বিষয়ের ফলাফল মুছে ফেলা হয়েছে।`
        });
    }

    const handleEditClick = (resultToEdit: ClassResult) => {
        setClassName(resultToEdit.className);
        setGroup(resultToEdit.group || '');
        setSubject(resultToEdit.subject);
        setFullMarks(resultToEdit.fullMarks);
        setStudents([]);
        setMarks(new Map());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDownloadSample = () => {
        if (!className) {
            toast({
                variant: 'destructive',
                title: 'শ্রেণি নির্বাচন করুন',
                description: 'নমুনা ফাইল ডাউনলোড করার জন্য অনুগ্রহ করে একটি শ্রেণি নির্বাচন করুন।',
            });
            return;
        }

        const isJunior = ['6', '7', '8'].includes(className);
        let headers: string[] = [];

        if (isJunior) {
            headers = ['রোল', 'নাম'];
            const subjects = getSubjects(className);
            subjects.forEach(sub => {
                headers.push(`${sub.name} (লিখিত)`);
                headers.push(`${sub.name} (বহুনির্বাচনী)`);
                if (sub.practical) {
                    headers.push(`${sub.name} (ব্যবহারিক)`);
                }
            });
        } else { // Class 9-10
            headers = [
                'রোল', 'নাম', 'শাখা',
                'বাংলা প্রথম (লিখিত)', 'বাংলা প্রথম (বহুনির্বাচনী)',
                'বাংলা দ্বিতীয় (লিখিত)', 'বাংলা দ্বিতীয় (বহুনির্বাচনী)',
                'ইংরেজি প্রথম (লিখিত)', 'ইংরেজি প্রথম (বহুনির্বাচনী)',
                'ইংরেজি দ্বিতীয় (লিখিত)', 'ইংরেজি দ্বিতীয় (বহুনির্বাচনী)',
                'গণিত (লিখিত)', 'গণিত (বহুনির্বাচনী)',
                'ধর্ম ও নৈতিক শিক্ষা (লিখিত)', 'ধর্ম ও নৈতিক শিক্ষা (বহুনির্বাচনী)',
                'তথ্য ও যোগাযোগ প্রযুক্তি (লিখিত)', 'তথ্য ও যোগাযোগ প্রযুক্তি (বহুনির্বাচনী)',
                'কৃষি শিক্ষা (লিখিত)', 'কৃষি শিক্ষা (বহুনির্বাচনী)', 'কৃষি শিক্ষা (ব্যবহারিক)',
                'সাধারণ বিজ্ঞান/বাংলাদেশ ও বিশ্ব পরিচয় (লিখিত)', 'সাধারণ বিজ্ঞান/বাংলাদেশ ও বিশ্ব পরিচয় (বহুনির্বাচনী)',
                'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা/পদার্থ (লিখিত)', 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা/পদার্থ (বহুনির্বাচনী)', 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা/পদার্থ (ব্যবহারিক)',
                'ভূগোল ও পরিবেশ/রসায়ন (লিখিত)', 'ভূগোল ও পরিবেশ/রসায়ন (বহুনির্বাচনী)', 'ভূগোল ও পরিবেশ/রসায়ন (ব্যবহারিক)',
                'পৌরনীতি ও নাগরিকতা/জীব বিজ্ঞান (লিখিত)', 'পৌরনীতি ও নাগরিকতা/জীব বিজ্ঞান (বহুনির্বাচনী)', 'পৌরনীতি ও নাগরিকতা/জীব বিজ্ঞান (ব্যবহারিক)',
                'হিসাব বিজ্ঞান (লিখিত)', 'হিসাব বিজ্ঞান (বহুনির্বাচনী)',
                'ফিন্যান্স ও ব্যাংকিং (লিখিত)', 'ফিন্যান্স ও ব্যাংকিং (বহুনির্বাচনী)',
                'ব্যবসায় উদ্যোগ (লিখিত)', 'ব্যবসায় উদ্যোগ (বহুনির্বাচনী)',
            ];
        }

        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'ফলাফল');
        XLSX.writeFile(wb, `results_sample_class_${className}.xlsx`);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!className) {
            toast({
                variant: "destructive",
                title: "প্রথমে শ্রেণি নির্বাচন করুন",
                description: "ফাইল আপলোড করার আগে একটি শ্রেণি নির্বাচন করতে হবে।",
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
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

                const allStudentsForYear = getStudents().filter(s => s.academicYear === selectedYear);
                const showGroupSelector = ['9', '10'].includes(className);
                
                const resultsByGroupAndSubject = new Map<string, Map<string, { fullMarks: number, results: StudentResult[] }>>();

                const markTypeMap: { [key: string]: keyof Marks } = { 'লিখিত': 'written', 'written': 'written', 'বহুনির্বাচনী': 'mcq', 'mcq': 'mcq', 'ব্যবহারিক': 'practical', 'practical': 'practical' };
                const bengaliToGroup: { [key: string]: string } = { 'বিজ্ঞান': 'science', 'মানবিক': 'arts', 'ব্যবসায় শিক্ষা': 'commerce' };

                const subjectNameMap: { [key: string]: string } = {
                    'বাংলা প্রথম': 'বাংলা প্রথম', 'bangla 1st': 'বাংলা প্রথম', 'bangla first': 'বাংলা প্রথম',
                    'বাংলা দ্বিতীয়': 'বাংলা দ্বিতীয়', 'bangla 2nd': 'বাংলা দ্বিতীয়', 'bangla second': 'বাংলা দ্বিতীয়',
                    'ইংরেজি প্রথম': 'ইংরেজি প্রথম', 'english 1st': 'ইংরেজি প্রথম', 'english first': 'ইংরেজি প্রথম',
                    'ইংরেজি দ্বিতীয়': 'ইংরেজি দ্বিতীয়', 'english 2nd': 'ইংরেজি দ্বিতীয়', 'english second': 'ইংরেজি দ্বিতীয়',
                    'গণিত': 'গণিত', 'math': 'গণিত', 'mathematics': 'গণিত',
                    'ধর্ম ও নৈতিক শিক্ষা': 'ধর্ম ও নৈতিক শিক্ষা', 'religion': 'ধর্ম ও নৈতিক শিক্ষা', 'ধর্ম শিক্ষা': 'ধর্ম ও নৈতিক শিক্ষা',
                    'তথ্য ও যোগাযোগ প্রযুক্তি': 'তথ্য ও যোগাযোগ প্রযুক্তি', 'ict': 'তথ্য ও যোগাযোগ প্রযুক্তি',
                    'সাধারণ বিজ্ঞান': 'সাধারণ বিজ্ঞান', 'general science': 'সাধারণ বিজ্ঞান',
                    'বাংলাদেশ ও বিশ্ব পরিচয়': 'বাংলাদেশ ও বিশ্ব পরিচয়', 'bangladesh and global studies': 'বাংলাদেশ ও বিশ্ব পরিচয়', 'bgs': 'বাংলাদেশ ও বিশ্ব পরিচয়',
                    'কৃষি শিক্ষা': 'কৃষি শিক্ষা', 'agriculture studies': 'কৃষি শিক্ষা', 'agriculture': 'কৃষি শিক্ষা',
                    'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা': 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', 'history and world civilization': 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', 'history': 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা',
                    'ভূগোল ও পরিবেশ': 'ভূগোল ও পরিবেশ', 'geography and environment': 'ভূগোল ও পরিবেশ', 'geography': 'ভূগোল ও পরিবেশ',
                    'পৌরনীতি ও নাগরিকতা': 'পৌরনীতি ও নাগরিকতা', 'civics and citizenship': 'পৌরনীতি ও নাগরিকতা', 'civics': 'পৌরনীতি ও নাগরিকতা',
                    'পদার্থ': 'পদার্থ', 'physics': 'পদার্থ',
                    'রসায়ন': 'রসায়ন', 'chemistry': 'রসায়ন',
                    'জীব বিজ্ঞান': 'জীব বিজ্ঞান', 'biology': 'জীব বিজ্ঞান',
                    'হিসাব বিজ্ঞান': 'হিসাব বিজ্ঞান', 'accounting': 'হিসাব বিজ্ঞান',
                    'ফিন্যান্স ও ব্যাংকিং': 'ফিন্যান্স ও ব্যাংকিং', 'finance and banking': 'ফিন্যান্স ও ব্যাংকিং',
                    'ব্যবসায় উদ্যোগ': 'ব্যবসায় উদ্যোগ', 'business entrepreneurship': 'ব্যবসায় উদ্যোগ',
                };
                
                const combinedHeaderMap: { [key: string]: { [key: string]: string } } = {
                    'সাধারণ বিজ্ঞান/বাংলাদেশ ও বিশ্ব পরিচয়': { science: 'বাংলাদেশ ও বিশ্ব পরিচয়', arts: 'সাধারণ বিজ্ঞান', commerce: 'সাধারণ বিজ্ঞান' },
                    'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা/পদার্থ': { science: 'পদার্থ', arts: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা' },
                    'ভূগোল ও পরিবেশ/রসায়ন': { science: 'রসায়ন', arts: 'ভূগোল ও পরিবেশ' },
                    'পৌরনীতি ও নাগরিকতা/জীব বিজ্ঞান': { science: 'জীব বিজ্ঞান', arts: 'পৌরনীতি ও নাগরিকতা' },
                };

                const processingErrors: string[] = [];

                json.forEach((row: any, rowIndex: number) => {
                    try {
                        const roll = row['রোল'];
                        if (roll === undefined) {
                            processingErrors.push(`সারি ${rowIndex + 2}: রোল নম্বর অনুপস্থিত।`);
                            return;
                        }
                        
                        const studentGroupBengali = row['শাখা'];
                        const studentGroup = showGroupSelector ? (bengaliToGroup[studentGroupBengali] || group) : '';

                        const student = allStudentsForYear.find(s => 
                            s.roll === Number(roll) && 
                            s.className === className && 
                            (!showGroupSelector || s.group === studentGroup)
                        );

                        if (!student) {
                            processingErrors.push(`সারি ${rowIndex + 2}: রোল ${roll} এবং শাখা '${studentGroupBengali || 'N/A'}' এর শিক্ষার্থীকে পাওয়া যায়নি।`);
                            return;
                        }
                        
                        const studentActualGroup = student.group || '';
                        let resultsBySubject = resultsByGroupAndSubject.get(studentActualGroup);
                        if (!resultsBySubject) {
                            resultsBySubject = new Map();
                            resultsByGroupAndSubject.set(studentActualGroup, resultsBySubject);
                        }

                        Object.entries(row).forEach(([header, value]) => {
                            if (header === 'রোল' || header === 'নাম' || header === 'শাখা') return;
                            
                            const match = header.match(/(.+) \((.+)\)/);
                            if (!match) return;

                            let subjectNamePart = match[1].trim();
                            const markTypeRaw = match[2].trim();
                            const markType = markTypeMap[markTypeRaw.toLowerCase()];

                            if (!markType) return;
                            
                            let finalSubjectName : string | undefined = subjectNameMap[subjectNamePart.toLowerCase()];
                            
                            if (!finalSubjectName && subjectNamePart.includes('/')) {
                                const combinedName = Object.keys(combinedHeaderMap).find(k => k.toLowerCase().includes(subjectNamePart.split('/')[0].toLowerCase()) && k.toLowerCase().includes(subjectNamePart.split('/')[1].toLowerCase()));
                                if(combinedName) {
                                    const mapping = combinedHeaderMap[combinedName];
                                    if (mapping && student.group && mapping[student.group]) {
                                        finalSubjectName = mapping[student.group];
                                    } else {
                                        return;
                                    }
                                }
                            }

                            if (!finalSubjectName) return;

                            const markValue = value === '' || value === undefined || isNaN(Number(value)) ? undefined : Number(value);

                            let subjectData = resultsBySubject.get(finalSubjectName);
                            if (!subjectData) {
                                subjectData = { fullMarks: fullMarks || 100, results: [] };
                                resultsBySubject.set(finalSubjectName, subjectData);
                            }

                            let studentResult = subjectData.results.find(r => r.studentId === student.id);
                            if (!studentResult) {
                                studentResult = { studentId: student.id };
                                subjectData.results.push(studentResult);
                            }
                            
                            studentResult[markType] = markValue;
                        });
                    } catch(rowError: any) {
                        processingErrors.push(`সারি ${rowIndex + 2} প্রক্রিয়াকরণে সমস্যা: ${rowError.message}`);
                    }
                });

                if (processingErrors.length > 0) {
                    throw new Error(processingErrors.join('\n'));
                }
                
                let updatedSubjectsCount = 0;
                resultsByGroupAndSubject.forEach((subjectDataMap, studentGroup) => {
                    subjectDataMap.forEach((data, subjectName) => {
                        const existingData = getResultsForClass(selectedYear, className, subjectName, studentGroup || undefined);
                        const mergedResults = new Map<number, StudentResult>();

                        if (existingData) {
                            existingData.results.forEach(res => mergedResults.set(res.studentId, res));
                        }
                        
                        data.results.forEach(res => {
                            const existingRes = mergedResults.get(res.studentId) || { studentId: res.studentId };
                            mergedResults.set(res.studentId, {...existingRes, ...res});
                        });
                        
                        saveClassResults({
                            academicYear: selectedYear,
                            className,
                            group: studentGroup || undefined,
                            subject: subjectName,
                            fullMarks: data.fullMarks,
                            results: Array.from(mergedResults.values()),
                        });
                        updatedSubjectsCount++;
                    });
                });
                
                toast({
                    title: "ফলাফল আপলোড সম্পন্ন",
                    description: `${updatedSubjectsCount}টি বিষয়ের ফলাফল সফলভাবে আপলোড/আপডেট করা হয়েছে।`
                });

                updateSavedResults();

            } catch (error: any) {
                console.error("File upload error:", error);
                toast({
                    variant: "destructive",
                    title: "ফাইল আপলোড ব্যর্থ হয়েছে",
                    description: error.message || "ফাইল ফরম্যাট পরীক্ষা করুন।",
                    duration: 10000,
                });
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };


    const showGroupSelector = className === '9' || className === '10';
    
    const classNamesMap: { [key: string]: string } = { '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম' };
    const groupMap: { [key: string]: string } = { 'science': 'বিজ্ঞান', 'arts': 'মানবিক', 'commerce': 'ব্যবসায় শিক্ষা' };

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
                            <div className="flex items-center gap-2">
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
                            
                            <Button onClick={handleLoadStudents} className="w-full">শিক্ষার্থী লোড করুন</Button>
                        </div>
                        
                        {students.length > 0 && (
                            <div className="border rounded-md">
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
                                        {students.map(student => (
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
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>শ্রেণি</TableHead>
                                            <TableHead>শাখা</TableHead>
                                            <TableHead>বিষয়</TableHead>
                                            <TableHead className="text-right">কার্যক্রম</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {savedResults.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                    এই শিক্ষাবর্ষে কোনো ফলাফল সেভ করা হয়নি।
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            savedResults.map((res, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{classNamesMap[res.className] || res.className}</TableCell>
                                                    <TableCell>{res.group ? groupMap[res.group] : '-'}</TableCell>
                                                    <TableCell>{res.subject}</TableCell>
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
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
