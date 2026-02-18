
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getStudentById, Student } from '@/lib/student-data';
import { getSubjects, Subject } from '@/lib/subjects';
import { getResultsForClass, ClassResult } from '@/lib/results-data';
import { processStudentResults, StudentProcessedResult, getGradePoint } from '@/lib/results-calculation';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const classMap: { [key: string]: string } = { '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine', '10': 'Ten' };
const groupMap: { [key: string]: string } = { 'science': 'Science', 'arts': 'Arts', 'commerce': 'Commerce' };
const religionMap: { [key: string]: string } = { 'islam': 'Islam', 'hinduism': 'Hinduism', 'buddhism': 'Buddhism', 'christianity': 'Christianity', 'other': 'Other' };

export default function MarksheetPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const studentId = parseInt(params.id as string, 10);

    const [student, setStudent] = useState<Student | null>(null);
    const [processedResult, setProcessedResult] = useState<StudentProcessedResult | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const academicYear = searchParams.get('academicYear');
    const className = searchParams.get('className');
    const group = searchParams.get('group');
    const optionalSubject = searchParams.get('optionalSubject');

    useEffect(() => {
        if (!studentId || !academicYear || !className) {
            setIsLoading(false);
            return;
        }

        const studentData = getStudentById(studentId);
        if (!studentData) {
            setIsLoading(false);
            return;
        }
        setStudent(studentData);

        const subjectsForClass = getSubjects(className, group || undefined);
        setSubjects(subjectsForClass);

        const resultsBySubject: ClassResult[] = subjectsForClass
            .map(subject => getResultsForClass(academicYear, className, subject.name, group || undefined))
            .filter((result): result is ClassResult => !!result);
        
        const [finalResult] = processStudentResults([studentData], resultsBySubject, subjectsForClass, optionalSubject || undefined);
        setProcessedResult(finalResult);
        setIsLoading(false);

    }, [studentId, academicYear, className, group, optionalSubject]);

    const schoolLogo = PlaceHolderImages.find(p => p.id === 'school-logo');
    
    const renderMeritPosition = (position?: number) => {
        if (!position) return '-';
        if (position % 10 === 1 && position % 100 !== 11) return `${position}st`;
        if (position % 10 === 2 && position % 100 !== 12) return `${position}nd`;
        if (position % 10 === 3 && position % 100 !== 13) return `${position}rd`;
        return `${position}th`;
    }

    const gradingScale = [
        { interval: '80-100', point: '5.00', grade: 'A+' },
        { interval: '70-79', point: '4.00', grade: 'A' },
        { interval: '60-69', point: '3.50', grade: 'A-' },
        { interval: '50-59', point: '3.00', grade: 'B' },
        { interval: '40-49', point: '2.00', grade: 'C' },
        { interval: '33-39', point: '1.00', grade: 'D' },
        { interval: '0-32', point: '0.00', grade: 'F' },
    ];


    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!student || !processedResult) {
        return <div className="flex items-center justify-center min-h-screen">Marksheet data not found.</div>;
    }

    const sortedSubjects = [...subjects].sort((a,b) => parseInt(a.code) - parseInt(b.code));

    return (
        <div className="bg-gray-100 p-4 font-sans">
            <div className="fixed top-4 right-4 no-print">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Marksheet
                </Button>
            </div>
            <div className="w-[210mm] h-[297mm] bg-white mx-auto p-8 shadow-lg printable-area relative">
                {schoolLogo && (
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <Image src={schoolLogo.imageUrl} alt="School Logo Watermark" width={400} height={400} className="opacity-10" />
                    </div>
                )}
                <div className="relative z-10 border-4 border-black p-4 h-full flex flex-col">
                    <header className="text-center mb-4">
                        <div className="flex justify-center items-center gap-4">
                            {schoolLogo && <Image src={schoolLogo.imageUrl} alt="School Logo" width={60} height={60} />}
                            <div>
                                <h1 className="text-3xl font-bold">BIRGANJ POURO HIGH SCHOOL</h1>
                                <p className="text-sm">Upazila: Birganj, Post: Birganj, Zila: Dinajpur</p>
                            </div>
                            <div className="w-[60px]"></div>
                        </div>
                        <p className="mt-2"><b>Academic Session:</b> {academicYear}</p>
                        <h2 className="text-xl font-semibold underline mt-2">Annual Exam Results</h2>
                    </header>

                    <section className="mb-4 text-sm">
                        <div className="grid grid-cols-[1fr_3fr] gap-x-4">
                            <div className="font-bold">Class</div><div>: {classMap[student.className] || student.className}</div>
                            <div className="font-bold">Student's name</div><div>: {student.studentNameEn || student.studentNameBn}</div>
                            <div className="font-bold">Father's name</div><div>: {student.fatherNameEn || student.fatherNameBn}</div>
                            <div className="font-bold">Mother's name</div><div>: {student.motherNameEn || student.motherNameBn}</div>
                        </div>
                         <div className="grid grid-cols-[1fr_3fr_1.5fr_1.5fr_2fr_2fr] gap-x-4">
                            <div className="font-bold">Date of birth</div><div>: {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : 'N/A'}</div>
                            <div className="font-bold">Class Roll</div><div>: {student.roll}</div>
                             <div className="font-bold">Group</div><div>: {student.group ? groupMap[student.group] : 'N/A'}</div>
                        </div>
                        <div className="grid grid-cols-[1fr_3fr] gap-x-4">
                            <div className="font-bold">Religion</div><div>: {student.religion ? religionMap[student.religion] : 'N/A'}</div>
                        </div>
                    </section>

                    <section className="mb-4 text-sm font-bold">
                        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] border-2 border-black p-1">
                            <div>Result : {processedResult.isPass ? 'PASSED' : 'FAILED'}</div>
                            <div>Grade: {processedResult.finalGrade}</div>
                            <div>Point: {processedResult.gpa.toFixed(2)}</div>
                            <div>Merit rank: {processedResult.isPass ? renderMeritPosition(processedResult.meritPosition) : 'N/A'}</div>
                        </div>
                    </section>

                    <section className="flex-grow text-sm">
                        <table className="w-full border-collapse border-2 border-black">
                            <thead>
                                <tr className="border-2 border-black">
                                    <th className="border-r border-black p-1">Serial No.</th>
                                    <th className="border-r border-black p-1">Subject Name</th>
                                    <th className="border-r border-black p-1">Subject code</th>
                                    <th className="border-r border-black p-1">Full Marks</th>
                                    <th colSpan={3} className="p-1">Annual exam results</th>
                                </tr>
                                <tr className="border-2 border-black">
                                    <th colSpan={4}></th>
                                    <th className="border-l border-black p-1">Marks</th>
                                    <th className="border-l border-black p-1">Grade</th>
                                    <th className="border-l border-black p-1">Point</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedSubjects.map((subject, index) => {
                                    const result = processedResult.subjectResults.get(subject.name);
                                    return (
                                        <tr key={subject.code} className="border-b border-black">
                                            <td className="border-r border-black p-1 text-center">{index + 1}</td>
                                            <td className="border-r border-black p-1">
                                                {subject.englishName}
                                                {optionalSubject === subject.name && <span className="font-bold"> (Optional)</span>}
                                            </td>
                                            <td className="border-r border-black p-1 text-center">{subject.code}</td>
                                            <td className="border-r border-black p-1 text-center">100</td>
                                            <td className="border-r border-black p-1 text-center">{result?.marks ?? '-'}</td>
                                            <td className="border-r border-black p-1 text-center">{result?.grade ?? '-'}</td>
                                            <td className="p-1 text-center">{result?.point.toFixed(2) ?? '-'}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="font-bold">
                                    <td colSpan={4} className="p-1 text-right border-t-2 border-black">Total marks obtained</td>
                                    <td className="p-1 text-center border-t-2 border-black">{processedResult.totalMarks}</td>
                                    <td className="p-1 text-center border-t-2 border-black">Grade</td>
                                    <td className="p-1 text-center border-t-2 border-black">{processedResult.finalGrade}</td>
                                </tr>
                                 <tr className="font-bold">
                                    <td colSpan={4} className="p-1 text-right"></td>
                                    <td className="p-1 text-center"></td>
                                    <td className="p-1 text-center">Points</td>
                                    <td className="p-1 text-center">{processedResult.gpa.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                    
                    <div className="absolute top-10 right-10 w-40">
                         <table className="w-full border-collapse border-2 border-black text-xs text-center">
                            <thead className="bg-gray-200">
                                <tr className="border-b-2 border-black">
                                    <th className="p-1 border-r border-black">Interval</th>
                                    <th className="p-1 border-r border-black">Point</th>
                                    <th className="p-1">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gradingScale.map(g => (
                                    <tr key={g.grade} className="border-b border-black">
                                        <td className="p-1 border-r border-black">{g.interval}</td>
                                        <td className="p-1 border-r border-black">{g.point}</td>
                                        <td className="p-1">{g.grade}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <footer className="mt-auto pt-16 text-sm">
                        <div className="flex justify-between">
                            <div className="border-t-2 border-dashed border-black px-8">Class teacher's signature</div>
                            <div className="border-t-2 border-dashed border-black px-8">Headmaster's signature</div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}

