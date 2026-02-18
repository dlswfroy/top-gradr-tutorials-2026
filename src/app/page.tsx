'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, GraduationCap } from 'lucide-react';
import { getStudents } from '@/lib/student-data';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { getAttendanceForDate } from '@/lib/attendance-data';
import { format } from 'date-fns';

export default function Home() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [presentStudents, setPresentStudents] = useState(0);
  const [absentStudents, setAbsentStudents] = useState(0);
  const { selectedYear } = useAcademicYear();
  
  // For now, let's keep these as static
  const totalTeachers = 0;

  useEffect(() => {
      // All data is from localStorage, must be run on client
      const studentsForYear = getStudents().filter(s => s.academicYear === selectedYear);
      setTotalStudents(studentsForYear.length);

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todaysAttendance = getAttendanceForDate(todayStr, selectedYear);
      
      let present = 0;
      let absent = 0;
      
      if (todaysAttendance.length > 0) {
        const studentIdsForYear = new Set(studentsForYear.map(s => s.id));
        todaysAttendance.forEach(classAttendance => {
            classAttendance.attendance.forEach(studentAttendance => {
                if (studentIdsForYear.has(studentAttendance.studentId)) {
                  if (studentAttendance.status === 'present') {
                      present++;
                  } else {
                      absent++;
                  }
                }
            });
        });
      }

      setPresentStudents(present);
      setAbsentStudents(absent);

  }, [selectedYear]);


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                মোট শিক্ষার্থী
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents.toLocaleString('bn-BD')}</div>
              <p className="text-xs text-muted-foreground">
                শিক্ষাবর্ষ {selectedYear.toLocaleString('bn-BD')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                উপস্থিত
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentStudents.toLocaleString('bn-BD')}</div>
              <p className="text-xs text-muted-foreground">
                আজকে উপস্থিত
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">অনুপস্থিত</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{absentStudents.toLocaleString('bn-BD')}</div>
              <p className="text-xs text-muted-foreground">
                আজকে অনুপস্থিত
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                শিক্ষক
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTeachers.toLocaleString('bn-BD')}</div>
              <p className="text-xs text-muted-foreground">
                &nbsp;
              </p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Welcome to School Navigator</CardTitle>
            <CardDescription>Your central hub for school management. Navigate through your daily tasks with ease and efficiency.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is a placeholder for the main content of the dashboard. You can add charts, tables, and other components here to build out your application. The top bar provides consistent navigation across the site, with subtle animations on interaction, and the overall design uses a serene and professional color palette.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
