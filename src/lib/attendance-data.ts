'use client';

export type AttendanceStatus = 'present' | 'absent';

export interface StudentAttendance {
  studentId: number;
  status: AttendanceStatus;
}

export interface DailyAttendance {
  date: string; // YYYY-MM-DD
  academicYear: string;
  className: string;
  attendance: StudentAttendance[];
}

const ATTENDANCE_STORAGE_KEY = 'attendanceData';

export const getAttendanceFromStorage = (): DailyAttendance[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const data = window.localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading attendance from localStorage", error);
    return [];
  }
};

const saveAttendanceToStorage = (records: DailyAttendance[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("Error saving attendance to localStorage", error);
  }
};

export const saveDailyAttendance = (record: DailyAttendance) => {
  const allAttendance = getAttendanceFromStorage();
  const existingIndex = allAttendance.findIndex(
    r =>
      r.date === record.date &&
      r.academicYear === record.academicYear &&
      r.className === record.className
  );

  if (existingIndex !== -1) {
    // This case prevents re-taking attendance, but we'll enforce it in the UI.
    // If somehow it gets here, we update it.
    allAttendance[existingIndex] = record;
  } else {
    allAttendance.push(record);
  }
  saveAttendanceToStorage(allAttendance);
};

export const getAttendanceForDate = (date: string, academicYear: string): DailyAttendance[] => {
    const allAttendance = getAttendanceFromStorage();
    return allAttendance.filter(r => r.date === date && r.academicYear === academicYear);
}

export const getAttendanceForClassAndDate = (date: string, className: string, academicYear: string): DailyAttendance | undefined => {
    const allAttendance = getAttendanceFromStorage();
    return allAttendance.find(
      r =>
        r.date === date &&
        r.className === className &&
        r.academicYear === academicYear
    );
};
