'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { useAcademicYear } from '@/context/AcademicYearContext';
import { getStudents } from '@/lib/student-data';
import { getSubjects } from '@/lib/subjects';
import { getResultsForClass, ClassResult } from '@/lib/results-data';
import { processStudentResults, StudentProcessedResult } from '@/lib/results-calculation';
import Link from 'next/link';

export default function ViewResultsPage() {
    const { toast } = useToast();
    const { selectedYear } = useAcademicYear();
    
    const [className, setClassName] = useState('');
    const [group, setGroup] = useState('');
    
    const [processedResults, setProcessedResults] = useState<StudentProcessedResult[]>([]);
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
            setIsLoading(false);
            return;
        }

        const subjectsForClass = getSubjects(className, group);
        
        const resultsBySubject: ClassResult[] = subjectsForClass.map(subject => {
            return getResultsForClass(selectedYear, className, subject.name, group);
        }).filter((result): result is ClassResult => !!result);

        if (resultsBySubject.length < subjectsForClass.length) {
            toast({ 
                variant: 'destructive',
                title: 'ফলাফল অসম্পূর্ণ',
                description: 'এই শ্রেণির সকল বিষয়ের নম্বর এখনও ইনপুট করা হয়নি।',
            });
            setProcessedResults([]);
            setIsLoading(false);
            return;
        }

        const finalResults = processStudentResults(studentsInClass, resultsBySubject, subjectsForClass);
        setProcessedResults(finalResults);

        setIsLoading(false);
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
                             <Link href="/results">
                                <Button variant="outline">নম্বর ইনপুট করুন</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
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
                            
                            <Button onClick={handleViewResults} disabled={isLoading} className="w-full lg:col-start-4">
                                {isLoading ? 'লোড হচ্ছে...' : 'ফলাফল দেখুন'}
                            </Button>
                        </div>
                        
                        {processedResults.length > 0 && (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>রোল</TableHead>
                                            <TableHead>শিক্ষার্থীর নাম</TableHead>
                                            <TableHead>মোট নম্বর</TableHead>
                                            <TableHead>জি.পি.এ</TableHead>
                                            <TableHead>গ্রেড</TableHead>
                                            <TableHead>ফলাফল</TableHead>
                                            <TableHead>মেধাস্থান</TableHead>
                                            <TableHead>অকৃতকার্য বিষয়</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {processedResults.map(res => (
                                            <TableRow key={res.student.id}>
                                                <TableCell>{res.student.roll.toLocaleString('bn-BD')}</TableCell>
                                                <TableCell>{res.student.studentNameBn}</TableCell>
                                                <TableCell>{res.totalMarks.toLocaleString('bn-BD')}</TableCell>
                                                <TableCell>{res.gpa.toFixed(2).toLocaleString('bn-BD')}</TableCell>
                                                <TableCell>{res.finalGrade}</TableCell>
                                                <TableCell>
                                                    <span className={res.isPass ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                                        {res.isPass ? 'পাশ' : 'ফেল'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{res.isPass ? renderMeritPosition(res.meritPosition) : '-'}</TableCell>
                                                <TableCell>{res.failedSubjectsCount > 0 ? res.failedSubjectsCount.toLocaleString('bn-BD') : '-'}</TableCell>
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
