export type Student = {
  id: number;
  roll: number;
  className: string;
  academicYear: string;
  studentNameBn: string;
  studentNameEn?: string;
  fatherNameBn: string;
  fatherNameEn?: string;
  motherNameBn: string;
  motherNameEn?: string;
  dob?: Date;
  birthRegNo?: string;
  guardianMobile?: string;
  studentMobile?: string;
  fatherNid?: string;
  motherNid?: string;
  gender?: string;
  religion?: string;
  group?: string;
  presentVillage?: string;
  presentUnion?: string;
  presentPostOffice?: string;
  presentUpazila?: string;
  presentDistrict?: string;
  permanentVillage?: string;
  permanentUnion?: string;
  permanentPostOffice?: string;
  permanentUpazila?: string;
  permanentDistrict?: string;
  photoUrl: string;
};

const STUDENTS_STORAGE_KEY = 'studentsData';

// Function to get students from localStorage
const getStudentsFromStorage = (): Student[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const data = window.localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (data) {
        const students: Student[] = JSON.parse(data);
        // Dates are stored as strings in JSON, so we need to convert them back to Date objects.
        return students.map(s => ({
            ...s,
            dob: s.dob ? new Date(s.dob) : undefined,
        }));
    }
    return [];
  } catch (error) {
    console.error("Error reading students from localStorage", error);
    return [];
  }
};

// Function to save students to localStorage
const saveStudentsToStorage = (students: Student[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  } catch (error) {
    console.error("Error saving students to localStorage", error);
  }
};


// Function to get a copy of all students
export const getStudents = (): Student[] => {
  const students = getStudentsFromStorage();
  return [...students].sort((a, b) => a.roll - b.roll);
};

// Function to get a single student by ID
export const getStudentById = (id: number): Student | undefined => {
  const students = getStudentsFromStorage();
  return students.find((student) => student.id === id);
};


// Function to add a new student
export const addStudent = (studentData: Omit<Student, 'id'>) => {
  const students = getStudentsFromStorage();
  const maxId = students.reduce((max, student) => (student.id > max ? student.id : max), 0);
  const newStudent: Student = {
    ...studentData,
    id: maxId + 1,
  };
  const newStudents = [...students, newStudent];
  saveStudentsToStorage(newStudents);
  return newStudent;
};

// Function to update an existing student
export const updateStudent = (id: number, updatedData: Omit<Student, 'id'>) => {
  const students = getStudentsFromStorage();
  const studentIndex = students.findIndex((s) => s.id === id);
  if (studentIndex !== -1) {
    const updatedStudent = { id, ...updatedData };
    students[studentIndex] = updatedStudent;
    saveStudentsToStorage(students);
    return updatedStudent;
  }
  return null;
};

// Function to delete a student
export const deleteStudent = (id: number) => {
  const students = getStudentsFromStorage();
  const updatedStudents = students.filter((student) => student.id !== id);
  if (students.length !== updatedStudents.length) {
    saveStudentsToStorage(updatedStudents);
    return true;
  }
  return false;
};
