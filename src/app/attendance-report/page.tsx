'use client';

import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStudents, Student } from '@/lib/student-data';
import { getAttendanceFromStorage } from '@/lib/attendance-data';
import { useEffect, useState, useMemo } from 'react';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StudentReport {
    student: Student;
    presentDays: number;
    absentDays: number;
    totalDays: number;
}

const ReportSheet = ({ classId, students }: { classId: string, students: Student[] }) => {
    const { selectedYear } = useAcademicYear();
    const [reportData, setReportData] = useState<StudentReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const allAttendance = getAttendanceFromStorage().filter(
            att => att.academicYear === selectedYear && att.className === classId
        );
        
        const studentReports = students.map(student => {
            let presentDays = 0;
            let absentDays = 0;

            allAttendance.forEach(dailyRecord => {
                const studentAttendance = dailyRecord.attendance.find(a => a.studentId === student.id);
                if (studentAttendance) {
                    if (studentAttendance.status === 'present') {
                        presentDays++;
                    } else {
                        absentDays++;
                    }
                }
            });

            return {
                student: student,
                presentDays,
                absentDays,
                totalDays: allAttendance.length,
            };
        });

        setReportData(studentReports);
        setIsLoading(false);

    }, [classId, students, selectedYear]);

     if (isLoading) {
        return <p className="text-center p-8">লোড হচ্ছে...</p>
    }

    if (students.length === 0) {
        return <p className="text-center text-muted-foreground p-8">এই শ্রেণিতে কোনো শিক্ষার্থী নেই।</p>
    }

    if (reportData.length === 0 || reportData[0].totalDays === 0) {
        return <p className="text-center text-muted-foreground p-8">এই শ্রেণির জন্য কোনো হাজিরা রেকর্ড পাওয়া যায়নি।</p>
    }


    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>রোল</TableHead>
                    <TableHead>নাম</TableHead>
                    <TableHead>মোট কার্যদিবস</TableHead>
                    <TableHead>উপস্থিত</TableHead>
                    <TableHead>অনুপস্থিত</TableHead>
                    <TableHead>উপস্থিতির হার (%)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reportData.map(report => (
                    <TableRow key={report.student.id}>
                        <TableCell>{report.student.roll.toLocaleString('bn-BD')}</TableCell>
                        <TableCell>{report.student.studentNameBn}</TableCell>
                        <TableCell>{report.totalDays.toLocaleString('bn-BD')}</TableCell>
                        <TableCell>{report.presentDays.toLocaleString('bn-BD')}</TableCell>
                        <TableCell>{report.absentDays.toLocaleString('bn-BD')}</TableCell>
                        <TableCell>
                            {report.totalDays > 0 ? 
                                ((report.presentDays / report.totalDays) * 100).toFixed(2).toLocaleString('bn-BD') + '%' 
                                : 'N/A'
                            }
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};


export default function AttendanceReportPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const { selectedYear } = useAcademicYear();

  useEffect(() => {
    setAllStudents(getStudents());
  }, []);

  const studentsForYear = useMemo(() => {
    return allStudents.filter(student => student.academicYear === selectedYear);
  }, [allStudents, selectedYear]);

  const classes = ['6', '7', '8', '9', '10'];
  const classNamesMap: { [key: string]: string } = {
    '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম',
  };

  const getStudentsByClass = (className: string): Student[] => {
    return studentsForYear.filter((student) => student.className === className);
  };
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
             <div className="flex items-center justify-between">
              <div>
                <CardTitle>হাজিরার রিপোর্ট</CardTitle>
                <CardDescription>
                    শিক্ষাবর্ষ {selectedYear.toLocaleString('bn-BD')} এর শ্রেণিভিত্তিক উপস্থিতির সারসংক্ষেপ।
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="6">
              <TabsList className="grid w-full grid-cols-5">
                {classes.map((className) => (
                  <TabsTrigger key={className} value={className}>
                    {classNamesMap[className]} শ্রেণি
                  </TabsTrigger>
                ))}
              </TabsList>
              {classes.map((className) => (
                <TabsContent key={className} value={className}>
                  <Card>
                    <CardContent className="p-0">
                       <ReportSheet classId={className} students={getStudentsByClass(className)} />
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
