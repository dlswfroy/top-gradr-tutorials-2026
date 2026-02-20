'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, GraduationCap } from 'lucide-react';
import { Student } from '@/lib/student-data';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { getAttendanceForDate } from '@/lib/attendance-data';
import { format } from 'date-fns';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, FirestoreError } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function Home() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [presentStudents, setPresentStudents] = useState(0);
  const [absentStudents, setAbsentStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const { selectedYear } = useAcademicYear();
  const db = useFirestore();
  
  useEffect(() => {
      if (!db) return;

      // Students
      const studentsQuery = query(collection(db, 'students'), where('academicYear', '==', selectedYear));
      
      const unsubscribeStudents = onSnapshot(studentsQuery, (querySnapshot) => {
        const studentsForYear = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
        setTotalStudents(studentsForYear.length);
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        const fetchAttendance = async () => {
            if (!db) return;
            const todaysAttendance = await getAttendanceForDate(db, todayStr, selectedYear);
            
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
        }

        fetchAttendance();
      },
      async (error: FirestoreError) => {
        const permissionError = new FirestorePermissionError({
          path: 'students',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      });

      // Teachers
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

  }, [selectedYear, db]);


  return (
    <div className="flex min-h-screen w-full flex-col bg-sky-50">
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
          <Card className="bg-emerald-100 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">
                উপস্থিত
              </CardTitle>
              <UserCheck className="h-4 w-4 text-emerald-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">{presentStudents.toLocaleString('bn-BD')}</div>
              <p className="text-xs text-emerald-600">
                আজকে উপস্থিত
              </p>
            </CardContent>
          </Card>
          <Card className="bg-rose-100 border-rose-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-rose-800">অনুপস্থিত</CardTitle>
              <UserX className="h-4 w-4 text-rose-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-900">{absentStudents.toLocaleString('bn-BD')}</div>
              <p className="text-xs text-rose-600">
                আজকে অনুপস্থিত
              </p>
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
      </main>
    </div>
  );
}
