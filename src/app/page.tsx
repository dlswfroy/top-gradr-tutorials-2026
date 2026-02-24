'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, Clock } from 'lucide-react';
import { Student } from '@/lib/student-data';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { getAttendanceForDate } from '@/lib/attendance-data';
import { getFullRoutine, ClassRoutine } from '@/lib/routine-data';
import { format } from 'date-fns';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, FirestoreError } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { isHoliday, Holiday } from '@/lib/holiday-data';


const parseTeacherName = (cell: string): string => {
    if (!cell || !cell.includes(' - ')) return 'N/A';
    const parts = cell.split(' - ');
    return parts.pop()?.trim() || 'N/A';
};

const periodTimes = [
  { name: "১ম", start: { h: 10, m: 30 }, end: { h: 11, m: 20 } },
  { name: "২য়", start: { h: 11, m: 20 }, end: { h: 12, m: 10 } },
  { name: "৩য়", start: { h: 12, m: 10 }, end: { h: 13, m: 0 } },
  { name: "বিরতি", start: { h: 13, m: 0 }, end: { h: 13, m: 40 } },
  { name: "৪র্থ", start: { h: 13, m: 40 }, end: { h: 14, m: 30 } },
  { name: "৫ম", start: { h: 14, m: 30 }, end: { h: 15, m: 20 } },
  { name: "৬ষ্ঠ", start: { h: 15, m: 20 }, end: { h: 16, m: 10 } },
];

const dayMap = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const classNamesMap: { [key: string]: string } = {
    '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম',
};

const LiveRoutineCard = () => {
    const db = useFirestore();
    const { selectedYear } = useAcademicYear();
    const [fullRoutine, setFullRoutine] = useState<ClassRoutine[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [activeHoliday, setActiveHoliday] = useState<Holiday | undefined>(undefined);

    useEffect(() => {
        if (!db) return;
        setIsLoading(true);
        const fetchData = async () => {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const [routineData, holidayInfo] = await Promise.all([
                getFullRoutine(db, selectedYear),
                isHoliday(db, todayStr),
            ]);
            setFullRoutine(routineData);
            setActiveHoliday(holidayInfo);
            setIsLoading(false);
        };
        fetchData();
    }, [db, selectedYear]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getCurrentPeriodInfo = () => {
        const now = currentTime;
        const currentDayName = dayMap[now.getDay()];

        if (activeHoliday) {
            return { status: `আজ ${activeHoliday.description} উপলক্ষে ছুটি।`, runningClasses: [] };
        }
        
        if (currentDayName === 'শুক্রবার' || currentDayName === 'শনিবার') {
            return { status: 'আজ সাপ্তাহিক ছুটি।', runningClasses: [] };
        }

        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        let periodIndex = -1;
        let status = 'ক্লাস চলছে';
        
        for(let i=0; i<periodTimes.length; i++) {
            const period = periodTimes[i];
            const startMinutes = period.start.h * 60 + period.start.m;
            const endMinutes = period.end.h * 60 + period.end.m;

            if(currentMinutes >= startMinutes && currentMinutes < endMinutes) {
                if (period.name === 'বিরতি') {
                    return { status: 'এখন টিফিনের বিরতি চলছে।', runningClasses: [] };
                }
                if (i < 3) periodIndex = i;
                if (i > 3) periodIndex = i - 1;
                break;
            }
        }
        
        if (periodIndex === -1) {
             return { status: 'এখন কোনো ক্লাস চলছে না।', runningClasses: [] };
        }

        const runningClasses = fullRoutine
            .filter(r => r.day === currentDayName)
            .map(r => {
                const periodContent = r.periods[periodIndex];
                if (periodContent) {
                    const adjustedPeriodIndex = periodIndex + (periodIndex >= 3 ? 1 : 0);
                    const periodInfo = periodTimes[adjustedPeriodIndex];
                    return {
                        className: r.className, // Keep raw class name for sorting
                        displayClassName: classNamesMap[r.className] || r.className,
                        teacher: parseTeacherName(periodContent),
                        period: periodInfo.name,
                        time: `${periodInfo.start.h.toString().padStart(2, '0')}:${periodInfo.start.m.toString().padStart(2, '0')} - ${periodInfo.end.h.toString().padStart(2, '0')}:${periodInfo.end.m.toString().padStart(2, '0')}`
                    };
                }
                return null;
            })
            .filter((c): c is NonNullable<typeof c> => c !== null)
            .sort((a, b) => parseInt(a.className) - parseInt(b.className));

        if (runningClasses.length === 0 && status === 'ক্লাস চলছে') {
            status = 'এখন কোনো ক্লাস চলছে না।';
        }

        return { status, runningClasses };
    };

    const { status, runningClasses } = getCurrentPeriodInfo();

    return (
        <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">লাইভ ক্লাস রুটিন</CardTitle>
                 <Badge variant="outline" className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {currentTime.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: 'numeric' })}
                </Badge>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2 pt-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                    </div>
                ) : runningClasses.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>সময়</TableHead>
                                <TableHead>শিক্ষক</TableHead>
                                <TableHead>শ্রেণি</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {runningClasses.map((rc, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-xs">{rc.time}</TableCell>
                                    <TableCell className="font-medium">{rc.teacher}</TableCell>
                                    <TableCell>{rc.displayClassName}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex items-center justify-center h-24">
                        <p className="text-muted-foreground">{status}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [classAttendance, setClassAttendance] = useState<Record<string, { present: number; absent: number; total: number }>>({});
  const [attendanceTaken, setAttendanceTaken] = useState(false);
  const { selectedYear } = useAcademicYear();
  const db = useFirestore();
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
      if (!db || !user) return;

      const studentsQuery = query(collection(db, 'students'), where('academicYear', '==', selectedYear));
      
      const unsubscribeStudents = onSnapshot(studentsQuery, async (studentsSnapshot) => {
        const studentsForYear = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
        setTotalStudents(studentsForYear.length);
        
        const classMap: Record<string, { present: number; absent: number; total: number }> = {
            '6': { present: 0, absent: 0, total: 0 },
            '7': { present: 0, absent: 0, total: 0 },
            '8': { present: 0, absent: 0, total: 0 },
            '9': { present: 0, absent: 0, total: 0 },
            '10': { present: 0, absent: 0, total: 0 },
        };

        studentsForYear.forEach(student => {
            if (classMap[student.className]) {
                classMap[student.className].total++;
            }
        });

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todaysAttendance = await getAttendanceForDate(db, todayStr, selectedYear);
        setAttendanceTaken(todaysAttendance.length > 0);

        if (todaysAttendance.length > 0) {
            todaysAttendance.forEach(classAttendanceRecord => {
                const className = classAttendanceRecord.className;
                if (classMap[className]) {
                    let presentCount = 0;
                    let absentCount = 0;
                    
                    classAttendanceRecord.attendance.forEach(studentAttendance => {
                        const studentExistsInYear = studentsForYear.some(s => s.id === studentAttendance.studentId && s.className === className);
                        if (studentExistsInYear) {
                            if (studentAttendance.status === 'present') {
                                presentCount++;
                            } else {
                                absentCount++;
                            }
                        }
                    });
                    classMap[className].present = presentCount;
                    classMap[className].absent = absentCount;
                }
            });
        }
        
        setClassAttendance(classMap);
      },
      async (error: FirestoreError) => {
        const permissionError = new FirestorePermissionError({
          path: 'students',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      });

      const staffQuery = query(collection(db, 'staff'), where('isActive', '==', true), where('staffType', '==', 'teacher'));
      const unsubscribeStaff = onSnapshot(staffQuery, (querySnapshot) => {
        setTotalTeachers(querySnapshot.size);
      },
      async (error: FirestoreError) => {
        const permissionError = new FirestorePermissionError({
          path: 'staff',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      });

      return () => {
        unsubscribeStudents();
        unsubscribeStaff();
      };

  }, [selectedYear, db, user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-sky-100">
          <p>লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-sky-100">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card className="bg-sky-100 border-sky-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-sky-800">
                মোট শিক্ষার্থী
              </CardTitle>
              <Users className="h-4 w-4 text-sky-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-900">{totalStudents.toLocaleString('bn-BD')}</div>
              <p className="text-xs text-sky-600">
                শিক্ষাবর্ষ {selectedYear.toLocaleString('bn-BD')}
              </p>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>আজকের হাজিরা</CardTitle>
                <CardDescription>
                    {attendanceTaken ? 'শ্রেণিভিত্তিক আজকের উপস্থিতির সারসংক্ষেপ' : 'আজ এখনও কোনো শ্রেণির হাজিরা নেওয়া হয়নি।'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>শ্রেণি</TableHead>
                            <TableHead className="text-center">মোট</TableHead>
                            <TableHead className="text-center">উপস্থিত</TableHead>
                            <TableHead className="text-center">অনুপস্থিত</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(classAttendance).map(([className, data]) => (
                            <TableRow key={className}>
                                <TableCell className="font-medium">{classNamesMap[className]} শ্রেণি</TableCell>
                                <TableCell className="text-center">{data.total.toLocaleString('bn-BD')}</TableCell>
                                <TableCell className="text-center text-emerald-600 font-semibold">{data.present.toLocaleString('bn-BD')}</TableCell>
                                <TableCell className="text-center text-rose-600 font-semibold">{data.absent.toLocaleString('bn-BD')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>

          <Card className="bg-amber-100 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">
                মোট শিক্ষক
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-amber-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">{totalTeachers.toLocaleString('bn-BD')}</div>
              <p className="text-xs text-amber-600">
                &nbsp;
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <LiveRoutineCard />
        </div>
      </main>
    </div>
  );
}
