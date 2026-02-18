'use client';
import type { Student } from './student-data';
import type { ClassResult } from './results-data';
import type { Subject } from './subjects';

export interface GradeInfo {
  grade: string;
  point: number;
}

export interface StudentProcessedResult {
    student: Student;
    totalMarks: number;
    totalPossibleMarks: number;
    gpa: number;
    finalGrade: string;
    isPass: boolean;
    failedSubjectsCount: number;
    meritPosition?: number;
    subjectResults: Map<string, { marks: number; grade: string; point: number; isPass: boolean }>;
}

const PASS_PERCENTAGE = 33;

export const getGradePoint = (percentage: number): GradeInfo => {
    if (percentage < 33) return { grade: 'F', point: 0.0 };
    if (percentage < 40) return { grade: 'D', point: 1.0 };
    if (percentage < 50) return { grade: 'C', point: 2.0 };
    if (percentage < 60) return { grade: 'B', point: 3.0 };
    if (percentage < 70) return { grade: 'A-', point: 3.5 };
    if (percentage < 80) return { grade: 'A', point: 4.0 };
    return { grade: 'A+', point: 5.0 };
};

const getFinalGrade = (gpa: number): string => {
    if (gpa === 5.0) return 'A+';
    if (gpa >= 4.0) return 'A';
    if (gpa >= 3.5) return 'A-';
    if (gpa >= 3.0) return 'B';
    if (gpa >= 2.0) return 'C';
    if (gpa >= 1.0) return 'D';
    return 'F';
}

export function processStudentResults(
    students: Student[],
    resultsBySubject: ClassResult[],
    subjects: Subject[]
): StudentProcessedResult[] {

    const studentResults: StudentProcessedResult[] = students.map(student => {
        let totalMarks = 0;
        let totalPossibleMarks = 0;
        let totalPoints = 0;
        let failedSubjectsCount = 0;
        const subjectResults = new Map<string, { marks: number; grade: string; point: number; isPass: boolean }>();

        subjects.forEach(subjectInfo => {
            const classResult = resultsBySubject.find(r => r.subject === subjectInfo.name);
            const studentResult = classResult?.results.find(r => r.studentId === student.id);
            const fullMarks = classResult?.fullMarks || 100;

            const written = studentResult?.written || 0;
            const mcq = studentResult?.mcq || 0;
            const practical = studentResult?.practical || 0;
            const obtainedMarks = written + mcq + practical;

            totalMarks += obtainedMarks;
            totalPossibleMarks += fullMarks;
            
            const percentage = (obtainedMarks / fullMarks) * 100;
            const { grade, point } = getGradePoint(percentage);
            
            const isPassSubject = percentage >= PASS_PERCENTAGE;
            if (!isPassSubject) {
                failedSubjectsCount++;
            }
            
            totalPoints += point;

            subjectResults.set(subjectInfo.name, {
                marks: obtainedMarks,
                grade,
                point,
                isPass: isPassSubject
            });
        });

        const isPass = failedSubjectsCount === 0;
        const gpa = isPass && subjects.length > 0 ? parseFloat((totalPoints / subjects.length).toFixed(2)) : 0.0;
        const finalGrade = isPass ? getFinalGrade(gpa) : 'F';
        
        return {
            student,
            totalMarks,
            totalPossibleMarks,
            gpa,
            finalGrade,
            isPass,
            failedSubjectsCount,
            subjectResults,
        };
    });

    const passedStudents = studentResults
        .filter(s => s.isPass)
        .sort((a, b) => b.totalMarks - a.totalMarks);

    let rank = 1;
    for (let i = 0; i < passedStudents.length; i++) {
        if (i > 0 && passedStudents[i].totalMarks < passedStudents[i-1].totalMarks) {
            rank = i + 1;
        }
        const originalStudent = studentResults.find(s => s.student.id === passedStudents[i].student.id);
        if (originalStudent) {
            originalStudent.meritPosition = rank;
        }
    }

    return studentResults;
}
