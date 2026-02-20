'use client';

import { useState, useMemo, useEffect, forwardRef } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Data from the image, mapped to 6 periods by skipping the 4th period and using 1,2,3,5,6,7.
const routineData: Record<string, Record<string, string[]>> = {
    '6': {
        'রবিবার': ['বাংলা ১ম - ওবায়দা', 'গণিত - ধনঞ্জয়', 'বিজ্ঞান - শান্তি', 'বাও বি - জান্নাতুন', 'বাংলা ২য় - যুধিষ্ঠির', 'আইসিটি - শারমিন'],
        'সোমবার': ['কৃষি - জান্নাতুন', 'বাংলা ২য় - যুধিষ্ঠির', 'আইসিটি - শারমিন', 'বাও বি - জান্নাতুন', 'বাংলা ১ম - ওবায়দা', 'বিজ্ঞান - শান্তি'],
        'মঙ্গলবার': ['ইংরেজী ১ম - আরিফুর', 'শারীরিক - মাহাবুব', 'ধর্ম - আনিছুর/নীলা', 'ইংরেজী ২য় - যুধিষ্ঠির', 'গণিত - ধনঞ্জয়', 'শারীরিক - ওবায়দা'],
        'বুধবার': ['কৃষি - জান্নাতুন', 'গণিত - ধনঞ্জয়', 'ধর্ম - আনিছুর/নীলা', 'বাংলা ২য় - যুধিষ্ঠির', 'ইংরেজী ১ম - আরিফুর', 'আইসিটি - শারমিন'],
        'বৃহস্পতিবার': ['বাও বি - জান্নাতুন', 'বাংলা ২য় - যুধিষ্ঠির', 'ইংরেজী ১ম - আরিফুর', 'বাংলা ১ম - ওবায়দা', 'ইংরেজী২য় - যুধিষ্ঠির', 'বাও বি/বিজ্ঞান - আনিছুর/শান্তি'],
    },
    '7': {
        'রবিবার': ['ইংরেজী ১ম - আরিফুর', 'শারীরিক - ওবায়দা', 'কৃষি - মাহাবুব', 'ধর্ম - আনিছুর/নীলা', 'বিজ্ঞান - শান্তি', 'ইংরেজী২য় - যুধিষ্ঠির'],
        'সোমবার': ['গণিত - ধনঞ্জয়', 'আইসিটি - শারমিন', 'বাও বি - আনিছুর', 'কৃষি - মাহাবুব', 'কৃষি - মাহাবুব', 'শারীরিক - ওবায়দা'],
        'মঙ্গলবার': ['কৃষি - মাহাবুব', 'বাংলা ২য় - যুধিষ্ঠির', 'বিজ্ঞান - শান্তি', 'গণিত - ধনঞ্জয়', 'ধর্ম - মাহাবুব/নীলা', 'বাও বি - আনিছুর'],
        'বুধবার': ['বাংলা ১ম - ওবায়দা', 'ইংরেজী ১ম - আরিফুর', 'ইংরেজী ২য় - আরিফুর', 'কৃষি - মাহাবুব', 'গণিত - ধনঞ্জয়', 'শারীরিক - ওবায়দা'],
        'বৃহস্পতিবার': ['গণিত - ধনঞ্জয়', 'বাও বি - আনিছুর', 'ইংরেজী ২য় - আরিফুর', 'বিজ্ঞান - শান্তি', 'ধর্ম - মাহাবুব/নীলা', 'বাংলা ১ম - ওবায়দা'],
    },
    '8': {
        'রবিবার': ['বাংলা ২য় - যুধিষ্ঠির', 'ধর্ম - মাহাবুব/নীলা', 'ইংরেজী ১ম - আরিফুর', 'বিজ্ঞান - শান্তি', 'বাংলা ১ম - ওবায়দা', 'বাও বি - আনিছুর'],
        'সোমবার': ['বাংলা ১ম - ওবায়দা', 'গণিত - ধনঞ্জয়', 'বাংলা ২য় - যুধিষ্ঠির', 'বাংলা ২য় - যুধিষ্ঠির', 'ইংরেজী২য় - আরিফুর', 'ধর্ম - মাহাবুব/নীলা'],
        'মঙ্গলবার': ['বাংলা ২য় - যুধিষ্ঠির', 'শারীরিক - নীলা', 'বাংলা ১ম - ওবায়দা', 'গণিত - ধনঞ্জয়', 'আইসিটি - শারমিন', 'ধর্ম - মাহাবুব/নীলা'],
        'বুধবার': ['গণিত - ধনঞ্জয়', 'বাংলা ১ম - ওবায়দা', 'কৃষি - মাহাবুব', 'ধর্ম - মাহাবুব/নীলা', 'বাংলা ২য় - যুধিষ্ঠির', 'আইসিটি - শারমিন'],
        'বৃহস্পতিবার': ['শারীরিক - নীলা', 'কৃষি - মাহাবুব', 'গণিত - ধনঞ্জয়', 'কৃষি - মাহাবুব', 'ইংরেজী ১ম - আরিফুর', 'বাও বি/বিজ্ঞান - আনিছুর/শান্তি'],
    },
    '9': {
        'রবিবার': ['গণিত - ধনঞ্জয়', 'জীব/পৌর - শান্তি/জান্নাতুন', 'রসায়ন/ভূগোল - ধনঞ্জয়/শারমিন', 'বাংলা ২য় - যুধিষ্ঠির', 'রসায়ন/ভূগোল - ধনঞ্জয়/শারমিন', 'বাও বি/বিজ্ঞান - আনিছুর/শান্তি'],
        'সোমবার': ['আইসিটি - শারমিন', 'গণিত - ধনঞ্জয়', 'জীব/পৌর - শান্তি/জান্নাতুন', 'ইংরেজী ১ম - আরিফুর', 'গণিত - ধনঞ্জয়', 'রসায়ন/ভূগোল - ধনঞ্জয়/শারমিন'],
        'মঙ্গলবার': ['গণিত - ধনঞ্জয়', 'বাংলা ১ম - ওবায়দা', 'পদায/ইতিহাস - ধনঞ্জয়/জান্নাতুন', 'জীব/পৌর - শান্তি/জান্নাতুন', 'ধর্ম - মাহাবুব/নীলা', 'বাও বি/বিজ্ঞান - আনিছুর/শান্তি'],
        'বুধবার': ['ইংরেজী ২য় - আরিফুর', 'পদায/ইতিহাস - ধনঞ্জয়/জান্নাতুন', 'কৃষি - মাহাবুব', 'শারীরিক - মাহাবুব', 'পদায/ইতিহাস - ধনঞ্জয়/জান্নাতুন', 'কৃষি - জান্নাতুন'],
        'বৃহস্পতিবার': ['পদায/ইতিহাস - ধনঞ্জয়/জান্নাতুন', 'গণিত - ধনঞ্জয়', 'রসায়ন/ভূগোল - ধনঞ্জয়/শারমিন', 'শারীরিক - মাহাবুব', 'গণিত - ধনঞ্জয়', 'ধর্ম - আনিছুর/নীলা'],
    },
    '10': {
        'রবিবার': ['আইসিটি - শারমিন', 'জীব/পৌর - শান্তি/জান্নাতুন', 'বাংলা ২য় - যুধিষ্ঠির', 'ইংরেজী ১ম - আরিফুর', 'বাংলা ১ম - ওবায়দা', 'গণিত - ধনঞ্জয়'],
        'সোমবার': ['আইসিটি - শারমিন', 'ধর্ম - মাহাবুব/নীলা', 'জীব/পৌর - শান্তি/জান্নাতুন', 'বাও বি - জান্নাতুন', 'গণিত - ধনঞ্জয়', 'আইসিটি - শারমিন'],
        'মঙ্গলবার': ['আইসিটি - শারমিন', 'ইংরেজী ২য় - আরিফুর', 'ধর্ম - মাহাবুব/নীলা', 'ইংরেজী ২য় - যুধিষ্ঠির', 'জীব/পৌর - শান্তি/জান্নাতুন', 'কৃষি - জান্নাতুন'],
        'বুধবার': ['আইসিটি - শারমিন', 'বাংলা ১ম - ওবায়দা', 'বাংলা ২য় - যুধিষ্ঠির', 'বাংলা ১ম - ওবায়দা', 'ধর্ম - মাহাবুব/নীলা', 'ইংরেজী ১ম - আরিফুর'],
        'বৃহস্পতিবার': ['বাংলা ১ম - ওবায়দা', 'ইংরেজী ১ম - আরিফুর', 'কৃষি - মাহাবুব', 'বাংলা ২য় - যুধিষ্ঠির', 'ধর্ম - মাহাবুব/নীলা', 'আইসিটি - শারমিন'],
    },
};

const parseSubjectTeacher = (cell: string): { subject: string, teacher: string | null } => {
    if (!cell || !cell.includes(' - ')) {
        return { subject: cell, teacher: null };
    }
    const parts = cell.split(' - ');
    const teacher = parts.pop()?.trim() || null;
    const subject = parts.join(' - ').trim();
    return { subject, teacher };
};

const useRoutineAnalysis = (routine: typeof routineData) => {
    const analysis = useMemo(() => {
        const teacherClashes = new Set<string>();
        const consecutiveClassClashes = new Set<string>();
        const breakClashes = new Set<string>();
        
        const teacherStats: { [teacher: string]: { total: number, sixthPeriods: number, daily: { [day: string]: string[] } } } = {};
        const classStats: { [cls: string]: { [subject: string]: number } } = {};
        const teachers = new Set<string>();

        const days = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার"];
        const classes = Object.keys(routine);
        const periodsCount = 6;

        classes.forEach(cls => {
            days.forEach(day => {
                if (routine[cls]?.[day]) {
                    routine[cls][day].forEach(cell => {
                        const { teacher } = parseSubjectTeacher(cell);
                        if (teacher) teachers.add(teacher);
                    });
                }
            });
        });

        teachers.forEach(t => {
            teacherStats[t] = { total: 0, sixthPeriods: 0, daily: { 'রবিবার': [], 'সোমবার': [], 'মঙ্গলবার': [], 'বুধবার': [], 'বৃহস্পতিবার': [] } };
        });

        days.forEach(day => {
            for (let periodIdx = 0; periodIdx < periodsCount; periodIdx++) {
                const periodTeachers = new Map<string, string>();
                classes.forEach(cls => {
                    const cell = routine[cls]?.[day]?.[periodIdx];
                    if (cell) {
                        const { teacher } = parseSubjectTeacher(cell);
                        if (teacher) {
                            if (periodTeachers.has(teacher)) {
                                teacherClashes.add(`${cls}-${day}-${periodIdx}`);
                                const existingCls = periodTeachers.get(teacher)!;
                                teacherClashes.add(`${existingCls}-${day}-${periodIdx}`);
                            } else {
                                periodTeachers.set(teacher, cls);
                            }
                        }
                    }
                });
            }
        });

        classes.forEach(cls => {
            classStats[cls] = {};
            days.forEach(day => {
                const dayRoutine = routine[cls]?.[day];
                if (dayRoutine) {
                    dayRoutine.forEach((cell, periodIdx) => {
                        const { subject, teacher } = parseSubjectTeacher(cell);
                        if(subject) {
                             const mainSubject = subject.split('/')[0].trim();
                            classStats[cls][mainSubject] = (classStats[cls][mainSubject] || 0) + 1;
                        }
                        if (teacher) {
                            teacher.split('/').forEach(t => {
                                const trimmedTeacher = t.trim();
                                if(!teacherStats[trimmedTeacher]) {
                                    teachers.add(trimmedTeacher);
                                    teacherStats[trimmedTeacher] = { total: 0, sixthPeriods: 0, daily: { 'রবিবার': [], 'সোমবার': [], 'মঙ্গলবার': [], 'বুধবার': [], 'বৃহস্পতিবার': [] } };
                                }
                                teacherStats[trimmedTeacher].total++;
                                teacherStats[trimmedTeacher].daily[day].push(`${subject} (${cls} শ্রেণি)`);
                                if (periodIdx === 5) {
                                    teacherStats[trimmedTeacher].sixthPeriods++;
                                }
                            });
                        }
                    });

                    const consecutivePairs = [[0, 1], [1, 2], [3, 4], [4, 5]];
                    consecutivePairs.forEach(([p1, p2]) => {
                        const teacher1 = parseSubjectTeacher(dayRoutine[p1]).teacher;
                        const teacher2 = parseSubjectTeacher(dayRoutine[p2]).teacher;
                        if (teacher1 && teacher1 === teacher2) {
                            consecutiveClassClashes.add(`${cls}-${day}-${p1}`);
                            consecutiveClassClashes.add(`${cls}-${day}-${p2}`);
                        }
                    });

                    const teacherBeforeBreak = parseSubjectTeacher(dayRoutine[2]).teacher;
                    const teacherAfterBreak = parseSubjectTeacher(dayRoutine[3]).teacher;
                    if (teacherBeforeBreak && teacherBeforeBreak === teacherAfterBreak) {
                        breakClashes.add(`${cls}-${day}-2`);
                        breakClashes.add(`${cls}-${day}-3`);
                    }
                }
            });
        });

        return { conflicts: { teacherClashes, consecutiveClassClashes, breakClashes }, stats: { teacherStats, classStats } };
    }, [routine]);

    return analysis;
};

const RoutineStatistics = ({ stats }: { stats: any }) => {
    const { teacherStats, classStats } = stats;
    const teachers = Object.keys(teacherStats).sort();
    const classes = Object.keys(classStats).sort((a,b) => parseInt(a) - parseInt(b));
    const classNamesMap: { [key: string]: string } = { '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম' };

    return (
        <Accordion type="multiple" className="w-full space-y-4">
            <AccordionItem value="teacher-stats">
                <AccordionTrigger className="text-lg font-semibold">শিক্ষকভিত্তিক পরিসংখ্যান</AccordionTrigger>
                <AccordionContent>
                    <div className="overflow-x-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>শিক্ষকের নাম</TableHead>
                                    <TableHead>মোট ক্লাস</TableHead>
                                    <TableHead>৬ষ্ঠ পিরিয়ডে ক্লাস</TableHead>
                                    <TableHead>দিনভিত্তিক ক্লাস</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.map(teacher => (
                                    <TableRow key={teacher}>
                                        <TableCell className="font-medium">{teacher}</TableCell>
                                        <TableCell>{teacherStats[teacher].total.toLocaleString('bn-BD')}</TableCell>
                                        <TableCell>{teacherStats[teacher].sixthPeriods.toLocaleString('bn-BD')}</TableCell>
                                        <TableCell>
                                            <ul className="list-disc list-inside text-xs">
                                                {Object.entries(teacherStats[teacher].daily).map(([day, classes]) => (
                                                    (classes as string[]).length > 0 && <li key={day}><strong>{day}:</strong> {(classes as string[]).length.toLocaleString('bn-BD')}টি</li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="class-stats">
                <AccordionTrigger className="text-lg font-semibold">শ্রেণিভিত্তিক পরিসংখ্যান</AccordionTrigger>
                <AccordionContent>
                     <div className="overflow-x-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>শ্রেণি</TableHead>
                                    <TableHead>বিষয়</TableHead>
                                    <TableHead>সাপ্তাহিক ক্লাস সংখ্যা</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classes.map(cls => {
                                    const subjects = Object.keys(classStats[cls]).sort();
                                    return subjects.map((subject, index) => (
                                        <TableRow key={`${cls}-${subject}`}>
                                            {index === 0 && <TableCell rowSpan={subjects.length} className="font-medium align-top">{classNamesMap[cls]}</TableCell>}
                                            <TableCell>{subject}</TableCell>
                                            <TableCell>{classStats[cls][subject].toLocaleString('bn-BD')}</TableCell>
                                        </TableRow>
                                    ));
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};


const RoutineTable = ({ className, routine, showGroupInfo, conflicts }: { className: string, routine: any, showGroupInfo: boolean, conflicts: any }) => {
    const days = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার"];
    const periods = [ { name: "১ম", time: "১০:৩০ - ১১:২০" }, { name: "২য়", time: "১১:২০ - ১২:১০" }, { name: "৩য়", time: "১২:১০ - ০১:০০" } ];
    const postBreakPeriods = [ { name: "৪র্থ", time: "০১:৪০ - ০২:৩০" }, { name: "৫ম", time: "০২:৩০ - ০৩:২০" }, { name: "৬ষ্ঠ", time: "০৩:২০ - ০৪:১০" } ];
    const classNamesMap: { [key: string]: string } = { '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম' };

    return (
        <Card>
            <CardHeader>
                <CardTitle>ক্লাস রুটিন (শ্রেণি - {classNamesMap[className] || className})</CardTitle>
                {showGroupInfo && <CardDescription>দ্রষ্টব্য: ৯ম ও ১০ম শ্রেণির রুটিন সকল গ্রুপের জন্য সম্মিলিতভাবে দেখানো হয়েছে।</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table className="border">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="border-r font-bold align-middle text-center">বার</TableHead>
                                {periods.map(p => <TableHead key={p.name} className="border-r text-center font-semibold">{p.name} পিরিয়ড<br/><span className="font-normal text-xs">{p.time}</span></TableHead>)}
                                <TableHead className="border-r text-center font-semibold bg-gray-100">বিরতি<br/><span className="font-normal text-xs">০১:০০ - ০১:৪০</span></TableHead>
                                {postBreakPeriods.map(p => <TableHead key={p.name} className="border-r text-center font-semibold">{p.name} পিরিয়ড<br/><span className="font-normal text-xs">{p.time}</span></TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {days.map(day => (
                                <TableRow key={day}>
                                    <TableCell className="font-semibold border-r">{day}</TableCell>
                                    {[...Array(6)].map((_, periodIdx) => {
                                        const subject = (routine[day] || [])[periodIdx] || '-';
                                        const key = `${className}-${day}-${periodIdx}`;
                                        const isTeacherClash = conflicts.teacherClashes.has(key);
                                        const isConsecutiveClash = conflicts.consecutiveClassClashes.has(key);
                                        const isBreakClash = conflicts.breakClashes.has(key);
                                        const isConflict = isTeacherClash || isConsecutiveClash || isBreakClash;
                                        
                                        let tooltipContent = '';
                                        if (isTeacherClash) tooltipContent += 'একই সময়ে এই শিক্ষকের অন্য ক্লাসে ক্লাস রয়েছে। ';
                                        if (isConsecutiveClash) tooltipContent += 'একই শিক্ষকের এই ক্লাসে পরপর ক্লাস পড়েছে। ';
                                        if (isBreakClash) tooltipContent += 'বিরতির আগে ও পরে একই শিক্ষকের ক্লাস পড়েছে। ';
                                        
                                        if (periodIdx === 3) {
                                            return <>
                                                <TableCell key={`${day}-pre-${periodIdx}`} className={cn("border-r text-center", { "bg-red-100 text-red-700": isConflict })} title={tooltipContent}>{subject}</TableCell>
                                                <TableCell className="border-r text-center bg-muted font-semibold">টিফিন</TableCell>
                                            </>;
                                        }

                                        return <TableCell key={`${day}-pre-${periodIdx}`} className={cn("border-r text-center", { "bg-red-100 text-red-700": isConflict })} title={tooltipContent}>{subject}</TableCell>;
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

const CombinedRoutineTable = ({ conflicts }: { conflicts: any }) => {
    const days = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার"];
    const classes = ['6', '7', '8', '9', '10'];
    const periods = [ { name: "১ম", time: "১০:৩০ - ১১:২০" }, { name: "২য়", time: "১১:২০ - ১২:১০" }, { name: "৩য়", time: "১২:১০ - ০১:০০" } ];
    const postBreakPeriods = [ { name: "৪র্থ", time: "০১:৪০ - ০২:৩০" }, { name: "৫ম", time: "০২:৩০ - ০৩:২০" }, { name: "৬ষ্ঠ", time: "০৩:২০ - ০৪:১০" } ];
    const classNamesMap: { [key: string]: string } = { '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম' };

    return (
         <Card>
            <CardHeader>
                <CardTitle>সকল শ্রেণির সম্মিলিত ক্লাস রুটিন</CardTitle>
                <CardDescription>
                    অসঙ্গতিপূর্ণ ক্লাসগুলো লাল রঙে হাইলাইট করা হয়েছে। বিস্তারিত জানতে সেলের উপর মাউস রাখুন।
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <Table className="border">
                         <TableHeader>
                            <TableRow>
                                <TableHead className="border-r font-bold align-middle text-center min-w-[100px]">বার</TableHead>
                                <TableHead className="border-r font-bold align-middle text-center min-w-[80px]">শ্রেণি</TableHead>
                                {periods.map(p => <TableHead key={p.name} className="border-r text-center font-semibold min-w-[150px]">{p.name} পিরিয়ড<br/><span className="font-normal text-xs">{p.time}</span></TableHead>)}
                                <TableHead className="border-r text-center font-semibold bg-gray-100 min-w-[100px]">বিরতি<br/><span className="font-normal text-xs">০১:০০ - ০১:৪০</span></TableHead>
                                {postBreakPeriods.map(p => <TableHead key={p.name} className="border-r text-center font-semibold min-w-[150px]">{p.name} পিরিয়ড<br/><span className="font-normal text-xs">{p.time}</span></TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {days.map((day) => (
                                classes.map((cls, classIndex) => (
                                    <TableRow key={`${day}-${cls}`}>
                                        {classIndex === 0 && (
                                             <TableCell className="font-semibold border-r align-middle text-center" rowSpan={classes.length}>{day}</TableCell>
                                        )}
                                        <TableCell className="font-semibold border-r text-center">{classNamesMap[cls]}</TableCell>
                                        {[...Array(6)].map((_, periodIdx) => {
                                            const subject = (routineData[cls]?.[day] || [])[periodIdx] || '-';
                                            const key = `${cls}-${day}-${periodIdx}`;
                                            const isTeacherClash = conflicts.teacherClashes.has(key);
                                            const isConsecutiveClash = conflicts.consecutiveClassClashes.has(key);
                                            const isBreakClash = conflicts.breakClashes.has(key);
                                            const isConflict = isTeacherClash || isConsecutiveClash || isBreakClash;
                                            
                                            let tooltipContent = '';
                                            if (isTeacherClash) tooltipContent += 'একই সময়ে এই শিক্ষকের অন্য ক্লাসে ক্লাস রয়েছে। ';
                                            if (isConsecutiveClash) tooltipContent += 'একই শিক্ষকের এই ক্লাসে পরপর ক্লাস পড়েছে। ';
                                            if (isBreakClash) tooltipContent += 'বিরতির আগে ও পরে একই শিক্ষকের ক্লাস পড়েছে। ';

                                            const cell = (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                             <TableCell className={cn("border-r text-center", { "bg-red-100 text-red-700": isConflict })}>
                                                                {subject}
                                                             </TableCell>
                                                        </TooltipTrigger>
                                                        {isConflict && <TooltipContent><p>{tooltipContent}</p></TooltipContent>}
                                                    </Tooltip>
                                                </TooltipProvider>
                                            );
                                            
                                            if (periodIdx === 2) {
                                                return <>{cell}<TableCell className="border-r text-center bg-muted font-semibold">টিফিন</TableCell></>;
                                            }
                                            return cell;
                                        })}
                                    </TableRow>
                                ))
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            </CardContent>
        </Card>
    );
};


const ClassRoutineTab = ({ conflicts }: { conflicts: any }) => {
    const [className, setClassName] = useState('all');
    
    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg items-end">
                <div className="space-y-2 flex-1">
                    <Label htmlFor="class-name">শ্রেণি</Label>
                    <Select value={className} onValueChange={setClassName}>
                        <SelectTrigger id="class-name"><SelectValue placeholder="শ্রেণি নির্বাচন করুন" /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">সকল শ্রেণি</SelectItem>
                           <SelectItem value="6">৬ষ্ঠ</SelectItem>
                           <SelectItem value="7">৭ম</SelectItem>
                           <SelectItem value="8">৮ম</SelectItem>
                           <SelectItem value="9">৯ম</SelectItem>
                           <SelectItem value="10">১০ম</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {className === 'all' ? (
                <CombinedRoutineTable conflicts={conflicts} />
            ) : (
                <RoutineTable 
                    className={className} 
                    routine={routineData[className] || {}}
                    showGroupInfo={className === '9' || className === '10'}
                    conflicts={conflicts}
                />
            )}
        </div>
    );
};

const ExamRoutineTab = () => {
    const [examName, setExamName] = useState('');

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                    <Label htmlFor="exam-name">পরীক্ষা</Label>
                    <Select value={examName} onValueChange={setExamName}>
                        <SelectTrigger id="exam-name"><SelectValue placeholder="পরীক্ষা নির্বাচন করুন" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="half-yearly">অর্ধ-বার্ষিক পরীক্ষা</SelectItem>
                            <SelectItem value="annual">বার্ষিক পরীক্ষা</SelectItem>
                            <SelectItem value="pre-test">প্রাক-নির্বাচনী পরীক্ষা</SelectItem>
                            <SelectItem value="test">নির্বাচনী পরীক্ষা</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-end">
                     <Button>রুটিন দেখুন</Button>
                </div>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>পরীক্ষার রুটিন</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground p-8">
                        পরীক্ষার রুটিন পরিচালনা করার ফিচার শীঘ্রই আসছে।
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};


export default function RoutinesPage() {
    const { selectedYear } = useAcademicYear();
    const [isClient, setIsClient] = useState(false);
    const { conflicts, stats } = useRoutineAnalysis(routineData);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="flex min-h-screen w-full flex-col bg-fuchsia-50">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>রুটিন</CardTitle>
                        {isClient && <p className="text-sm text-muted-foreground">শিক্ষাবর্ষ: {selectedYear.toLocaleString('bn-BD')}</p>}
                    </CardHeader>
                    <CardContent>
                        {isClient ? (
                            <Tabs defaultValue="class-routine">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="class-routine">ক্লাস রুটিন</TabsTrigger>
                                    <TabsTrigger value="exam-routine">পরীক্ষার রুটিন</TabsTrigger>
                                    <TabsTrigger value="statistics">পরিসংখ্যান</TabsTrigger>
                                </TabsList>
                                <TabsContent value="class-routine" className="mt-4">
                                    <ClassRoutineTab conflicts={conflicts} />
                                </TabsContent>
                                <TabsContent value="exam-routine" className="mt-4">
                                    <ExamRoutineTab />
                                </TabsContent>
                                <TabsContent value="statistics" className="mt-4">
                                    <RoutineStatistics stats={stats} />
                                </TabsContent>
                            </Tabs>
                        ) : (
                           <div className="space-y-4">
                               <div className="grid w-full grid-cols-2 h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                                    <div className="inline-flex items-center justify-center rounded-sm bg-background shadow-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
                                    <div className="inline-flex items-center justify-center rounded-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <Skeleton className="h-48 w-full" />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
