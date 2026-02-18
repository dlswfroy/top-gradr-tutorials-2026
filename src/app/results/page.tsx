
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Trash2 } from 'lucide-react';

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

    const updateSavedResults = () => {
        const allResults = getAllResults().filter(r => r.academicYear === selectedYear);
        setSavedResults(allResults);
    }
    
    useEffect(() => {
        updateSavedResults();
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

    const showGroupSelector = className === '9' || className === '10';
    
    const classNamesMap: { [key: string]: string } = { '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম' };
    const groupMap: { [key: string]: string } = { 'science': 'বিজ্ঞান', 'arts': 'মানবিক', 'commerce': 'ব্যবসায় শিক্ষা' };

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>ফলাফল ও নম্বর ব্যবস্থাপনা</CardTitle>
                                <CardDescription>শ্রেণি, বিষয় ও শাখা অনুযায়ী শিক্ষার্থীদের পরীক্ষার নম্বর ইনপুট করুন।</CardDescription>
                            </div>
                            <Link href="/view-results">
                                <Button variant="outline">ফলাফল শিট দেখুন</Button>
                            </Link>
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
