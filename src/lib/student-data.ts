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

export const students: Student[] = [];

let nextId = 1;

export const addStudent = (studentData: Omit<Student, 'id'>) => {
  const newStudent: Student = {
    ...studentData,
    id: nextId++,
  };
  students.push(newStudent);
  return newStudent;
};
