'use client';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Student, studentFromDoc } from '@/lib/student-data';
import { Exam, getExams } from '@/lib/exam-data';
import { AdmitCard } from '@/components/AdmitCard';
import { Printer, Loader2 } from 'lucide-react';
import { useSchoolInfo } from '@/context/SchoolInfoContext';

const AdmitCardGeneratorPage = () => {
    const db = useFirestore();
    const { schoolInfo } = useSchoolInfo();
    const { selectedYear } = useAcademicYear();
    
    const [exams, setExams] = useState<Exam[]>([]);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingExams, setIsFetchingExams] = useState(true);

    useEffect(() => {
        if (!db) return;
        setIsFetchingExams(true);
        getExams(db, selectedYear).then(data => {
            setExams(data);
            setIsFetchingExams(false);
        });
    }, [db, selectedYear]);

    useEffect(() => {
        if (!db) return;
        const studentsQuery = query(
            collection(db, "students"),
            where("academicYear", "==", selectedYear)
        );
        const unsubscribe = onSnapshot(studentsQuery, (querySnapshot) => {
            setAllStudents(querySnapshot.docs.map(studentFromDoc));
        }, (error) => {
            console.error("Error fetching students:", error);
        });
        return () => unsubscribe();
    }, [db, selectedYear]);

    const handleGenerate = () => {
        if (!selectedExam || !selectedClass) return;
        setIsLoading(true);
        const filteredStudents = allStudents
            .filter(s => s.className === selectedClass)
            .sort((a, b) => a.roll - b.roll);
        setStudentsInClass(filteredStudents);
        setIsLoading(false);
    };

    const classNamesMap: { [key: string]: string } = { '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম' };

    return (
        <>
            <div className="flex min-h-screen w-full flex-col bg-slate-100 no-print">
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>প্রবেশ পত্র জেনারেটর</CardTitle>
                            <CardDescription>পরীক্ষা এবং শ্রেণি নির্বাচন করে প্রবেশপত্র তৈরি করুন।</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg items-end">
                                <div className="space-y-2 flex-1">
                                    <Label htmlFor="exam-name">পরীক্ষা</Label>
                                    <Select 
                                        disabled={isFetchingExams}
                                        onValueChange={(examId) => {
                                            const exam = exams.find(e => e.id === examId);
                                            setSelectedExam(exam || null);
                                            setSelectedClass('');
                                            setStudentsInClass([]);
                                        }}
                                    >
                                        <SelectTrigger id="exam-name">
                                            <SelectValue placeholder={isFetchingExams ? "লোড হচ্ছে..." : "পরীক্ষা নির্বাচন করুন"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {exams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 flex-1">
                                    <Label htmlFor="class-name">শ্রেণি</Label>
                                    <Select 
                                        value={selectedClass} 
                                        onValueChange={setSelectedClass}
                                        disabled={!selectedExam}
                                    >
                                        <SelectTrigger id="class-name">
                                            <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedExam?.classes.map(cls => (
                                                <SelectItem key={cls} value={cls}>{classNamesMap[cls] || `${cls}ম শ্রেণি`}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleGenerate} disabled={!selectedExam || !selectedClass || isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            জেনারেট হচ্ছে...
                                        </>
                                    ) : 'প্রবেশপত্র দেখুন'}
                                </Button>
                            </div>
                            
                            {studentsInClass.length > 0 && (
                                <div className="text-center p-4 bg-muted rounded-lg">
                                    <p className="mb-4 font-medium text-sm text-muted-foreground">
                                        মোট {studentsInClass.length.toLocaleString('bn-BD')} জন শিক্ষার্থীর প্রবেশপত্র তৈরি হয়েছে।
                                    </p>
                                     <Button onClick={() => window.print()} size="lg" className="w-full sm:w-auto">
                                        <Printer className="mr-2 h-5 w-5" />
                                        সকল প্রবেশপত্র প্রিন্ট করুন
                                    </Button>
                                </div>
                            )}

                            {selectedClass && studentsInClass.length === 0 && !isLoading && (
                                <p className="text-center text-muted-foreground py-8">
                                    এই শ্রেণিতে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি।
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
            {studentsInClass.length > 0 && selectedExam && (
                <div className="printable-area bg-white">
                    <div className="grid grid-cols-2 gap-4 p-4">
                        {studentsInClass.map(student => (
                            <AdmitCard key={student.id} student={student} schoolInfo={schoolInfo} examName={selectedExam.name} />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default AdmitCardGeneratorPage;
