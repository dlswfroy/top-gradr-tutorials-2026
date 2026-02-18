
'use client';
import type { Student } from './student-data';
import type { ClassResult } from './results-data';
import type { Subject } from './subjects';

export interface GradeInfo {
  grade: string;
  point: number;
}

export interface StudentSubjectResult {
    written?: number;
    mcq?: number;
    practical?: number;
    marks: number;
    grade: string;
    point: number;
    isPass: boolean;
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
    subjectResults: Map<string, StudentSubjectResult>;
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
    allSubjectsForGroup: Subject[]
): StudentProcessedResult[] {

    const studentResults: StudentProcessedResult[] = students.map(student => {
        const optionalSubjectName = student.optionalSubject;

        // Determine the actual list of subjects for this specific student
        const subjectsForStudent = allSubjectsForGroup.filter(subjectInfo => {
            if (student.group === 'science' && optionalSubjectName) {
                if (optionalSubjectName === 'উচ্চতর গণিত' && subjectInfo.name === 'কৃষি শিক্ষা') return false;
                if (optionalSubjectName === 'কৃষি শিক্ষা' && subjectInfo.name === 'উচ্চতর গণিত') return false;
            }
            return true;
        });

        let totalMarks = 0;
        let totalPossibleMarks = 0;
        const subjectResults = new Map<string, StudentSubjectResult>();

        subjectsForStudent.forEach(subjectInfo => {
            const classResult = resultsBySubject.find(r => r.subject === subjectInfo.name && r.group === (student.group || undefined) && r.className === student.className);
            const studentResult = classResult?.results.find(r => r.studentId === student.id);
            const fullMarks = classResult?.fullMarks || 100;

            const written = studentResult?.written;
            const mcq = studentResult?.mcq;
            const practical = studentResult?.practical;
            const obtainedMarks = (written || 0) + (mcq || 0) + (practical || 0);

            let isPassSubject = true;
            // Only check for pass marks if marks are actually entered
            if (written !== undefined || mcq !== undefined || practical !== undefined) {
                 const percentage = (obtainedMarks / fullMarks) * 100;
                 isPassSubject = percentage >= PASS_PERCENTAGE;
            } else {
                isPassSubject = false; // Fail if no marks are entered
            }
            
            const percentageForGrade = (obtainedMarks / fullMarks) * 100;
            const { grade, point } = getGradePoint(isPassSubject ? percentageForGrade : 0);
            
            totalMarks += obtainedMarks;
            totalPossibleMarks += fullMarks;
            
            subjectResults.set(subjectInfo.name, {
                written,
                mcq,
                practical,
                marks: obtainedMarks,
                grade: isPassSubject ? grade : 'F',
                point: isPassSubject ? point : 0,
                isPass: isPassSubject
            });
        });
        
        let totalCompulsoryPoints = 0;
        let compulsorySubjectsCount = 0;
        let failedInCompulsoryCount = 0;
        let bonusPoints = 0;

        subjectsForStudent.forEach(subjectInfo => {
            const result = subjectResults.get(subjectInfo.name);
            if (!result) return;
    
            if (subjectInfo.name === optionalSubjectName) {
                // Optional subject pass/fail doesn't affect the final result
                // It only contributes points if the student passes in it
                if (result.isPass && result.point > 2.0) {
                    bonusPoints = result.point - 2.0;
                }
            } else {
                totalCompulsoryPoints += result.point;
                compulsorySubjectsCount++;
                if (!result.isPass) {
                    failedInCompulsoryCount++;
                }
            }
        });

        const isPass = failedInCompulsoryCount === 0;
        let gpa = 0;

        if (isPass && compulsorySubjectsCount > 0) {
            gpa = (totalCompulsoryPoints + bonusPoints) / compulsorySubjectsCount;
        }
        
        if (gpa > 5.0) {
            gpa = 5.0;
        }

        const finalGrade = isPass ? getFinalGrade(gpa) : 'F';
        
        return {
            student,
            totalMarks,
            totalPossibleMarks,
            gpa: isPass ? parseFloat(gpa.toFixed(2)) : 0.0,
            finalGrade,
            isPass,
            failedSubjectsCount: failedInCompulsoryCount,
            subjectResults,
        };
    });

    // Assign merit position to passed students
    const passedStudents = studentResults
        .filter(s => s.isPass)
        .sort((a, b) => {
             if (b.totalMarks !== a.totalMarks) {
                return b.totalMarks - a.totalMarks;
            }
            // If total marks are same, sort by student roll
            return a.student.roll - b.student.roll;
        });

    let rank = 1;
    for (let i = 0; i < passedStudents.length; i++) {
        // Assign rank. If the previous student has the same marks, they get the same rank.
        if (i > 0 && passedStudents[i].totalMarks < passedStudents[i - 1].totalMarks) {
            rank = i + 1;
        }
        // Find the student in the original array to update their merit position
        const studentToUpdate = studentResults.find(s => s.student.id === passedStudents[i].student.id);
        if (studentToUpdate) {
            studentToUpdate.meritPosition = rank;
        }
    }

    return studentResults;
}
