'use client';

import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student } from '@/lib/student-data';
import { useEffect, useState, useMemo } from 'react';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { saveDailyAttendance, getAttendanceForClassAndDate, StudentAttendance, DailyAttendance, AttendanceStatus } from '@/lib/attendance-data';
import { isHoliday, Holiday } from '@/lib/holiday-data';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, orderBy, FirestoreError } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


// Helper component for taking/viewing attendance for a single class
const AttendanceSheet = ({ classId, students }: { classId: string, students: Student[] }) => {
    const { toast } = useToast();
    const { selectedYear } = useAcademicYear();
    const db = useFirestore();
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const dayOfWeek = today.getDay(); // 0 for Sunday, 5 for Friday, 6 for Saturday

    const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
    const [savedAttendance, setSavedAttendance] = useState<DailyAttendance | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [activeHoliday, setActiveHoliday] = useState<Holiday | undefined>(undefined);

    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    useEffect(() => {
        if (!db) return;
        
        const initialAttendance = new Map<string, AttendanceStatus>();
        students.forEach(student => {
            initialAttendance.set(student.id, 'present');
        });
        setAttendance(initialAttendance);

        const checkExistingData = async () => {
            const existingAttendance = await getAttendanceForClassAndDate(db, todayStr, classId, selectedYear);
            setSavedAttendance(existingAttendance);
            
            const holidayToday = await isHoliday(db, todayStr);
            setActiveHoliday(holidayToday);
            
            setIsLoading(false);
        }

        checkExistingData();

    }, [students, todayStr, classId, selectedYear, db]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => new Map(prev).set(studentId, status));
    };

    const handleSaveAttendance = () => {
        if (!db) return;
        if (isWeekend) {
            toast({ variant: "destructive", title: "আজ সাপ্তাহিক ছুটি।" });
            return;
        }
        if (activeHoliday) {
            toast({ variant: "destructive", title: `আজ ${activeHoliday.description} উপলক্ষে ছুটি।` });
            return;
        }

        const attendanceData: StudentAttendance[] = Array.from(attendance.entries()).map(([studentId, status]) => ({
            studentId,
            status,
        }));

        const dailyAttendance: DailyAttendance = {
            date: todayStr,
            academicYear: selectedYear,
            className: classId,
            attendance: attendanceData,
        };

        saveDailyAttendance(db, dailyAttendance).then(() => {
            setSavedAttendance(dailyAttendance);
            toast({ title: "হাজিরা সেভ হয়েছে।", description: `শ্রেণি ${classId.toLocaleString('bn-BD')} এর জন্য আজকের হাজিরা সফলভাবে সেভ হয়েছে।` });
        }).catch(() => {
            // Error is handled by FirebaseErrorListener
        });
    };

    if (isLoading) {
        return <p className="text-center p-8">লোড হচ্ছে...</p>
    }

    if (isWeekend) {
        return <p className="text-center text-muted-foreground p-8">আজ সাপ্তাহিক ছুটি, তাই হাজিরা বন্ধ আছে।</p>
    }

    if (activeHoliday) {
        return <p className="text-center text-muted-foreground p-8">আজ {activeHoliday.description} উপলক্ষে ছুটি, তাই হাজিরা বন্ধ আছে।</p>;
    }

    if (savedAttendance) {
        const savedMap = new Map(savedAttendance.attendance.map(item => [item.studentId, item.status]));
        const presentCount = savedAttendance.attendance.filter(a => a.status === 'present').length;
        const absentCount = savedAttendance.attendance.length - presentCount;

        return (
            <div className="p-4">
                <h3 className="font-semibold mb-4">আজকের হাজিরা ইতিমধ্যে নেওয়া হয়েছে</h3>
                <div className="mb-4 text-sm">
                    <p>মোট শিক্ষার্থী: {(presentCount + absentCount).toLocaleString('bn-BD')}</p>
                    <p className="text-green-600">উপস্থিত: {presentCount.toLocaleString('bn-BD')}</p>
                    <p className="text-red-600">অনুপস্থিত: {absentCount.toLocaleString('bn-BD')}</p>
                </div>
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>রোল</TableHead>
                                <TableHead>নাম</TableHead>
                                <TableHead>অবস্থা</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.roll.toLocaleString('bn-BD')}</TableCell>
                                    <TableCell>{student.studentNameBn}</TableCell>
                                    <TableCell>
                                         <span className={savedMap.get(student.id) === 'present' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                            {savedMap.get(student.id) === 'present' ? 'উপস্থিত' : 'অনুপস্থিত'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            </div>
        );
    }
    
    return (
        <div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>রোল</TableHead>
                            <TableHead>নাম</TableHead>
                            <TableHead className="text-right">হাজিরা</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map(student => (
                            <TableRow key={student.id}>
                                <TableCell>{student.roll.toLocaleString('bn-BD')}</TableCell>
                                <TableCell>{student.studentNameBn}</TableCell>
                                <TableCell className="text-right">
                                    <RadioGroup
                                        defaultValue="present"
                                        onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)}
                                        className="flex justify-end gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="present" id={`present-${classId}-${student.id}`} className="text-green-600 border-green-600" />
                                            <Label htmlFor={`present-${classId}-${student.id}`}>উপস্থিত</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="absent" id={`absent-${classId}-${student.id}`} className="text-red-600 border-red-600" />
                                            <Label htmlFor={`absent-${classId}-${student.id}`}>অনুপস্থিত</Label>
                                        </div>
                                    </RadioGroup>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-end p-4 mt-4 border-t">
                <Button onClick={handleSaveAttendance}>হাজিরা সেভ করুন</Button>
            </div>
        </div>
    );
};


export default function DigitalAttendancePage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const { selectedYear } = useAcademicYear();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;
    setIsLoading(true);

    const studentsQuery = query(
      collection(db, "students"),
      orderBy("roll")
    );

    const unsubscribe = onSnapshot(studentsQuery, (querySnapshot) => {
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dob: doc.data().dob?.toDate(),
      })) as Student[];
      setAllStudents(studentsData);
      setIsLoading(false);
    }, async (error: FirestoreError) => {
      const permissionError = new FirestorePermissionError({
        path: 'students',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, toast]);

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
  
  const today = new Date();
  const formattedDate = format(today, "EEEE, d MMMM yyyy", { locale: bn });

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
             <div className="flex items-center justify-between">
              <div>
                <CardTitle>ডিজিটাল হাজিরা</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                    আজ: {formattedDate}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <p className="text-center text-muted-foreground py-8">লোড হচ্ছে...</p>
            ) : (
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
                       {getStudentsByClass(className).length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                এই শ্রেণিতে কোনো শিক্ষার্থী নেই।
                            </p>
                        ) : (
                           <AttendanceSheet classId={className} students={getStudentsByClass(className)} />
                        )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
