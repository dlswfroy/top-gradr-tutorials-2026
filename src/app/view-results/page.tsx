
'use client';

import { useState, useMemo } from 'react';
import React from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { useAcademicYear } from '@/context/AcademicYearContext';
import { getStudents, updateStudent } from '@/lib/student-data';
import { getSubjects, Subject } from '@/lib/subjects';
import { getResultsForClass, ClassResult } from '@/lib/results-data';
import { processStudentResults, StudentProcessedResult } from '@/lib/results-calculation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BookOpen } from 'lucide-react';

export default function ViewResultsPage() {
    const { toast } = useToast();
    const { selectedYear } = useAcademicYear();
    
    const [className, setClassName] = useState('');
    const [group, setGroup] = useState('');
    const [optionalSubject, setOptionalSubject] = useState('');
    
    const [processedResults, setProcessedResults] = useState<StudentProcessedResult[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleViewResults = () => {
        if (!className) {
            toast({
                variant: 'destructive',
                title: 'শ্রেণি নির্বাচন করুন',
                description: 'ফলাফল দেখার জন্য অনুগ্রহ করে একটি শ্রেণি নির্বাচন করুন।',
            });
            return;
        }

        setIsLoading(true);

        const allStudents = getStudents();
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

        const subjectsForClass = getSubjects(className, group);
        setSubjects(subjectsForClass);
        
        const resultsBySubject: ClassResult[] = subjectsForClass.map(subject => {
            return getResultsForClass(selectedYear, className, subject.name, group);
        }).filter((result): result is ClassResult => !!result);

        const subjectsWithResults = new Set(resultsBySubject.map(r => r.subject));
        const missingSubjects = subjectsForClass.filter(s => !subjectsWithResults.has(s.name));

        if (missingSubjects.length > 0) {
            toast({ 
                variant: 'destructive',
                title: 'ফলাফল অসম্পূর্ণ',
                description: `এই শ্রেণির সকল বিষয়ের নম্বর এখনও ইনপুট করা হয়নি। অনুপস্থিত বিষয়: ${missingSubjects.map(s => s.name).join(', ')}`,
                duration: 8000,
            });
            setProcessedResults([]);
            setIsLoading(false);
            return;
        }

        const finalResults = processStudentResults(studentsInClass, resultsBySubject, subjectsForClass, optionalSubject);
        setProcessedResults(finalResults);

        setIsLoading(false);
    };

    const handlePromoteStudents = () => {
        if (processedResults.length === 0) {
            toast({
                variant: 'destructive',
                title: 'কোনো ফলাফল নেই',
                description: 'শিক্ষার্থী উত্তীর্ণ করার জন্য প্রথমে ফলাফল দেখুন।',
            });
            return;
        }

        const nextYear = String(parseInt(selectedYear, 10) + 1);
        let promotedCount = 0;
        let failedCount = 0;
        let graduatedCount = 0;

        processedResults.forEach(result => {
            if (result.isPass) {
                if (result.student.className === '10') {
                    graduatedCount++;
                } else {
                    const nextClass = String(parseInt(result.student.className, 10) + 1);
                    const { id, ...currentData } = result.student;
                    
                    const updatedStudentData = {
                        ...currentData,
                        academicYear: nextYear,
                        className: nextClass,
                        group: (nextClass === '9' || nextClass === '10') ? currentData.group : undefined,
                    };

                    updateStudent(id, updatedStudentData);
                    promotedCount++;
                }
            } else {
                failedCount++;
            }
        });
        
        toast({
            title: 'শিক্ষার্থী উত্তীর্ণ করা সম্পন্ন',
            description: `${promotedCount} জন শিক্ষার্থী পরবর্তী শ্রেণিতে উত্তীর্ণ হয়েছে। ${graduatedCount} জন গ্র্যাজুয়েট হয়েছে। ${failedCount} জন ফেল করেছে।`,
            duration: 8000,
        });

        // Clear current results view
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
                    <TableHead rowSpan={2} className="align-middle text-center sticky left-0 bg-background z-10">রোল</TableHead>
                    <TableHead rowSpan={2} className="align-middle text-center min-w-[200px] sticky left-[50px] bg-background z-10">শিক্ষার্থীর নাম</TableHead>
                    {subjects.map(subject => (
                        <TableHead key={subject.name} colSpan={subject.practical ? 4 : 3} className={cn("text-center border-x", optionalSubject === subject.name && "bg-blue-50")}>
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
                            {/* <TableHead className="text-center border-l">লিখিত</TableHead>
                            <TableHead className="text-center border-l">বহুনি.</TableHead>
                            {subject.practical && <TableHead className="text-center border-l">ব্যবহারিক</TableHead>} */}
                            <TableHead className="text-center border-l">মোট</TableHead>
                            <TableHead className="text-center border-l">গ্রেড</TableHead>
                            <TableHead className="text-center border-l border-r">পয়েন্ট</TableHead>
                        </React.Fragment>
                    ))}
                </TableRow>
            </TableHeader>
        );
    }, [subjects, optionalSubject]);


    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                                <CardTitle>ফলাফল দেখুন</CardTitle>
                                <CardDescription>শ্রেণিভিত্তিক চূড়ান্ত ফলাফল দেখুন। শিক্ষাবর্ষ: {selectedYear.toLocaleString('bn-BD')}</CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
                                <Link href="/results">
                                    <Button variant="outline">নম্বর ইনপুট করুন</Button>
                                </Link>
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
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end p-4 border rounded-lg">
                            <div className="space-y-2">
                                <Label htmlFor="class">শ্রেণি</Label>
                                <Select value={className} onValueChange={c => { setClassName(c); setGroup(''); setOptionalSubject(''); }}>
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
                                    <Select value={group} onValueChange={g => { setGroup(g); setOptionalSubject(''); }}>
                                        <SelectTrigger id="group"><SelectValue placeholder="শাখা নির্বাচন" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="science">বিজ্ঞান</SelectItem>
                                            <SelectItem value="arts">মানবিক</SelectItem>
                                            <SelectItem value="commerce">ব্যবসায় শিক্ষা</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {showGroupSelector && (
                                <div className="space-y-2">
                                    <Label htmlFor="optional-subject">ঐচ্ছিক বিষয় (৪র্থ)</Label>
                                    <Select value={optionalSubject} onValueChange={setOptionalSubject} disabled={!group}>
                                        <SelectTrigger id="optional-subject"><SelectValue placeholder="ঐচ্ছিক বিষয় নির্বাচন" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">None</SelectItem>
                                            {subjects.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            
                            <Button onClick={handleViewResults} disabled={isLoading} className="w-full lg:col-start-5">
                                {isLoading ? 'লোড হচ্ছে...' : 'ফলাফল দেখুন'}
                            </Button>
                        </div>
                        
                        {processedResults.length > 0 && subjects.length > 0 && (
                            <div className="border rounded-md overflow-x-auto">
                                <Table className="min-w-max">
                                    {tableHeaders}
                                    <TableBody>
                                        {processedResults.map(res => (
                                            <TableRow key={res.student.id}>
                                                <TableCell className="text-center sticky left-0 bg-background z-10">{res.student.roll.toLocaleString('bn-BD')}</TableCell>
                                                <TableCell className="whitespace-nowrap sticky left-[50px] bg-background z-10">{res.student.studentNameBn}</TableCell>
                                                {subjects.map(subject => {
                                                    const subjectRes = res.subjectResults.get(subject.name);
                                                    return (
                                                        <React.Fragment key={`${res.student.id}-${subject.name}`}>
                                                            {/* <TableCell className="text-center border-l">{(subjectRes?.written?.toLocaleString('bn-BD')) ?? '-'}</TableCell>
                                                            <TableCell className="text-center border-l">{(subjectRes?.mcq?.toLocaleString('bn-BD')) ?? '-'}</TableCell>
                                                            {subject.practical && <TableCell className="text-center border-l">{(subjectRes?.practical?.toLocaleString('bn-BD')) ?? '-'}</TableCell>} */}
                                                            <TableCell className="text-center border-l font-semibold">{subjectRes?.marks.toLocaleString('bn-BD') ?? '-'}</TableCell>
                                                            <TableCell className={cn("text-center border-l", {"text-destructive font-bold": subjectRes && !subjectRes.isPass})}>{subjectRes?.grade ?? '-'}</TableCell>
                                                            <TableCell className="text-center border-l border-r">{subjectRes?.point.toFixed(2).toLocaleString('bn-BD') ?? '-'}</TableCell>
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
                                                    <Link href={`/marksheet/${res.student.id}?academicYear=${selectedYear}&className=${className}&group=${group || ''}&optionalSubject=${optionalSubject || ''}`} target="_blank">
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
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
