export type Student = {
  id: number;
  studentNameBn: string;
  studentNameEn?: string;
  fatherNameBn: string;
  fatherNameEn?: string;
  motherNameBn?: string;
  motherNameEn?: string;
  dob?: Date;
  className: string;
  roll: number;
  mobile?: string;
  address?: string;
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
