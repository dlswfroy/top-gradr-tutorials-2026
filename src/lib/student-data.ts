export type Student = {
  id: number;
  roll: number;
  className: string;
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

// This is a temporary in-memory "database"
let students: Student[] = [];

let nextId = 1;

// Function to get a copy of all students
export const getStudents = (): Student[] => {
  return [...students].sort((a, b) => a.roll - b.roll);
};

// Function to get a single student by ID
export const getStudentById = (id: number): Student | undefined => {
  return students.find((student) => student.id === id);
};


// Function to add a new student
export const addStudent = (studentData: Omit<Student, 'id'>) => {
  const newStudent: Student = {
    ...studentData,
    id: nextId++,
  };
  students.push(newStudent);
  return newStudent;
};

// Function to update an existing student
export const updateStudent = (id: number, updatedData: Omit<Student, 'id'>) => {
  const studentIndex = students.findIndex((s) => s.id === id);
  if (studentIndex !== -1) {
    students[studentIndex] = { ...students[studentIndex], ...updatedData };
    return students[studentIndex];
  }
  return null;
};

// Function to delete a student
export const deleteStudent = (id: number) => {
  const index = students.findIndex((student) => student.id === id);
  if (index !== -1) {
    students.splice(index, 1);
    return true;
  }
  return false;
};
