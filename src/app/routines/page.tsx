'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { getFullRoutine, saveRoutinesBatch, ClassRoutine } from '@/lib/routine-data';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { FilePen } from 'lucide-react';
import { Input } from '@/components/ui/input';


const parseSubjectTeacher = (cell: string): { subject: string, teacher: string | null } => {
    if (!cell || !cell.includes(' - ')) {
        return { subject: cell, teacher: null };
    }
    const parts = cell.split(' - ');
    const teacher = parts.pop()?.trim() || null;
    const subject = parts.join(' - ').trim();
    return { subject, teacher };
};

const useRoutineAnalysis = (routine: Record<string, Record<string, string[]>>) => {
    const analysis = useMemo(() => {
        const colorPalette = [
            '#FDEDEC', '#F5EEF8', '#EAF2F8', '#D6EAF8',
            '#D1F2EB', '#D0ECE7', '#D4EFDF', '#FCF3CF',
            '#FDEBD0', '#FAE5D3', '#F6DDCC', '#FADBD8', 
            '#E5E7E9', '#E8DAEF', '#D2B4DE', '#A9CCE3',
            '#A3E4D7', '#A2D9CE', '#ABEBC6', '#F9E79F',
            '#FAD7A0', '#F5CBA7', '#EDBB99', '#D98880'
        ];

        const teacherClashes = new Set<string>();
        const consecutiveClassClashes = new Set<string>();
        const breakClashes = new Set<string>();
        
        const teacherStats: { [teacher: string]: { total: number, sixthPeriods: number, daily: { [day: string]: string[] }, beforeBreak: number, afterBreak: number } } = {};
        const classStats: { [cls: string]: { [subject: string]: number } } = {};
        const allIndividualTeachers = new Set<string>();

        const days = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার"];
        const classes = Object.keys(routine);
        const periodsCount = 6;

        classes.forEach(cls => {
            days.forEach(day => {
                if (routine[cls]?.[day]) {
                    routine[cls][day].forEach(cell => {
                        const { teacher } = parseSubjectTeacher(cell);
                        if (teacher) {
                            teacher.split('/').forEach(t => {
                                const trimmed = t.trim();
                                if (trimmed) allIndividualTeachers.add(trimmed);
                            });
                        }
                    });
                }
            });
        });

        allIndividualTeachers.forEach(t => {
            teacherStats[t] = { total: 0, sixthPeriods: 0, daily: { 'রবিবার': [], 'সোমবার': [], 'মঙ্গলবার': [], 'বুধবার': [], 'বৃহস্পতিবার': [] }, beforeBreak: 0, afterBreak: 0 };
        });
        
        const sortedTeachers = Array.from(allIndividualTeachers).sort();
        const teacherColorMap = new Map<string, string>();
        sortedTeachers.forEach((teacher, index) => {
            teacherColorMap.set(teacher, colorPalette[index % colorPalette.length]);
        });
        
        days.forEach(day => {
            for (let periodIdx = 0; periodIdx < periodsCount; periodIdx++) {
                const periodTeachers = new Map<string, string>();
                classes.forEach(cls => {
                    const cell = routine[cls]?.[day]?.[periodIdx];
                    if (cell) {
                        const { teacher } = parseSubjectTeacher(cell);
                        if (teacher) {
                            teacher.split('/').forEach(t => {
                                const trimmedTeacher = t.trim();
                                if (!trimmedTeacher) return;
                                if (periodTeachers.has(trimmedTeacher)) {
                                    teacherClashes.add(`${cls}-${day}-${periodIdx}`);
                                    const existingCls = periodTeachers.get(trimmedTeacher)!;
                                    teacherClashes.add(`${existingCls}-${day}-${periodIdx}`);
                                } else {
                                    periodTeachers.set(trimmedTeacher, cls);
                                }
                            })
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
                                if (!trimmedTeacher) return;
                                
                                if (teacherStats[trimmedTeacher]) {
                                    teacherStats[trimmedTeacher].total++;
                                    teacherStats[trimmedTeacher].daily[day].push(`${subject} (${cls} শ্রেণি)`);
                                    if (periodIdx === 5) {
                                        teacherStats[trimmedTeacher].sixthPeriods++;
                                    }
                                    if (periodIdx < 3) {
                                        teacherStats[trimmedTeacher].beforeBreak++;
                                    } else {
                                        teacherStats[trimmedTeacher].afterBreak++;
                                    }
                                }
                            });
                        }
                    });

                    const consecutivePairs = [[0, 1], [1, 2], [3, 4], [4, 5]];
                    consecutivePairs.forEach(([p1, p2]) => {
                        const teacher1 = parseSubjectTeacher(dayRoutine[p1]).teacher;
                        const teacher2 = parseSubjectTeacher(dayRoutine[p2]).teacher;
                        if (teacher1 && teacher2) {
                            const teachers1 = teacher1.split('/').map(t => t.trim()).filter(Boolean);
                            const teachers2 = teacher2.split('/').map(t => t.trim()).filter(Boolean);
                            const hasOverlap = teachers1.some(t => teachers2.includes(t));
                            if (hasOverlap) {
                                consecutiveClassClashes.add(`${cls}-${day}-${p1}`);
                                consecutiveClassClashes.add(`${cls}-${day}-${p2}`);
                            }
                        }
                    });

                    const teacherBeforeBreak = parseSubjectTeacher(dayRoutine[2]).teacher;
                    const teacherAfterBreak = parseSubjectTeacher(dayRoutine[3]).teacher;
                    if (teacherBeforeBreak && teacherAfterBreak) {
                        const teachersBefore = teacherBeforeBreak.split('/').map(t => t.trim()).filter(Boolean);
                        const teachersAfter = teacherAfterBreak.split('/').map(t => t.trim()).filter(Boolean);
                        const hasOverlap = teachersBefore.some(t => teachersAfter.includes(t));
                         if (hasOverlap) {
                            breakClashes.add(`${cls}-${day}-2`);
                            breakClashes.add(`${cls}-${day}-3`);
                        }
                    }
                }
            });
        });

        return { conflicts: { teacherClashes, consecutiveClassClashes, breakClashes }, stats: { teacherStats, classStats }, teacherColorMap };
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
                                    <TableHead>বিরতির আগে</TableHead>
                                    <TableHead>বিরতির পরে</TableHead>
                                    <TableHead>৬ষ্ঠ পিরিয়ডে ক্লাস</TableHead>
                                    <TableHead>দিনভিত্তিক ক্লাস</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.map(teacher => (
                                    <TableRow key={teacher}>
                                        <TableCell className="font-medium">{teacher}</TableCell>
                                        <TableCell>{teacherStats[teacher].total.toLocaleString('bn-BD')}</TableCell>
                                        <TableCell>{teacherStats[teacher].beforeBreak.toLocaleString('bn-BD')}</TableCell>
                                        <TableCell>{teacherStats[teacher].afterBreak.toLocaleString('bn-BD')}</TableCell>
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


const RoutineTable = ({ className, routineData, conflicts, isEditMode, onCellChange, teacherColorMap }: { className: string, routineData: any, conflicts: any, isEditMode: boolean, onCellChange: (cls: string, day: string, periodIdx: number, value: string) => void, teacherColorMap: Map<string, string> }) => {
    const days = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার"];
    const periods = [ { name: "১ম", time: "১০:৩০ - ১১:২০" }, { name: "২য়", time: "১১:২০ - ১২:১০" }, { name: "৩য়", time: "১২:১০ - ০১:০০" } ];
    const postBreakPeriods = [ { name: "৪র্থ", time: "০১:৪০ - ০২:৩০" }, { name: "৫ম", time: "০২:৩০ - ০৩:২০" }, { name: "৬ষ্ঠ", time: "০৩:২০ - ০৪:১০" } ];
    const classNamesMap: { [key: string]: string } = { '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম' };

    const routineForClass = routineData[className] || {};

    return (
        <Card>
            <CardHeader>
                <CardTitle>ক্লাস রুটিন (শ্রেণি - {classNamesMap[className] || className})</CardTitle>
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
                                    {[...Array(3)].map((_, periodIdx) => {
                                        const cellContent = (routineForClass[day] || [])[periodIdx] || '';
                                        return <EditableCell key={`${day}-${periodIdx}`} content={cellContent} isEditMode={isEditMode} onCellChange={(value) => onCellChange(className, day, periodIdx, value)} conflictKey={`${className}-${day}-${periodIdx}`} conflicts={conflicts} teacherColorMap={teacherColorMap} />;
                                    })}
                                    <TableCell className="border-r text-center bg-muted font-semibold">টিফিন</TableCell>
                                    {[...Array(3)].map((_, i) => {
                                        const periodIdx = i + 3;
                                        const cellContent = (routineForClass[day] || [])[periodIdx] || '';
                                        return <EditableCell key={`${day}-${periodIdx}`} content={cellContent} isEditMode={isEditMode} onCellChange={(value) => onCellChange(className, day, periodIdx, value)} conflictKey={`${className}-${day}-${periodIdx}`} conflicts={conflicts} teacherColorMap={teacherColorMap} />;
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

const CombinedRoutineTable = ({ routineData, conflicts, isEditMode, onCellChange, teacherColorMap }: { routineData: Record<string, Record<string, string[]>>, conflicts: any, isEditMode: boolean, onCellChange: (cls: string, day: string, periodIdx: number, value: string) => void, teacherColorMap: Map<string, string> }) => {
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
                    অসঙ্গতিপূর্ণ ক্লাসগুলো লাল রঙে হাইলাইট করা হয়েছে। বিস্তারিত জানতে সেলের উপর মাউস রাখুন। এডিট মোডে প্রতিটি সেলে ক্লিক করে পরিবর্তন করা যাবে।
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
                                        {[...Array(3)].map((_, periodIdx) => {
                                            const cellContent = (routineData[cls]?.[day] || [])[periodIdx] || '';
                                            return <EditableCell key={`${day}-${cls}-${periodIdx}`} content={cellContent} isEditMode={isEditMode} onCellChange={(value) => onCellChange(cls, day, periodIdx, value)} conflictKey={`${cls}-${day}-${periodIdx}`} conflicts={conflicts} teacherColorMap={teacherColorMap} />;
                                        })}
                                        <TableCell className="border-r text-center bg-muted font-semibold">টিফিন</TableCell>
                                        {[...Array(3)].map((_, i) => {
                                            const periodIdx = i + 3;
                                            const cellContent = (routineData[cls]?.[day] || [])[periodIdx] || '';
                                            return <EditableCell key={`${day}-${cls}-${periodIdx}`} content={cellContent} isEditMode={isEditMode} onCellChange={(value) => onCellChange(cls, day, periodIdx, value)} conflictKey={`${cls}-${day}-${periodIdx}`} conflicts={conflicts} teacherColorMap={teacherColorMap} />;
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

const EditableCell = ({ content, isEditMode, onCellChange, conflictKey, conflicts, teacherColorMap }: { content: string, isEditMode: boolean, onCellChange: (value: string) => void, conflictKey: string, conflicts: any, teacherColorMap: Map<string, string> }) => {
    const isTeacherClash = conflicts.teacherClashes.has(conflictKey);
    const isConsecutiveClash = conflicts.consecutiveClassClashes.has(conflictKey);
    const isBreakClash = conflicts.breakClashes.has(conflictKey);
    const isConflict = isTeacherClash || isConsecutiveClash || isBreakClash;

    let tooltipContent = '';
    if (isTeacherClash) tooltipContent += 'একই সময়ে এই শিক্ষকের অন্য ক্লাসে ক্লাস রয়েছে। ';
    if (isConsecutiveClash) tooltipContent += 'একই শিক্ষকের এই ক্লাসে পরপর ক্লাস পড়েছে। ';
    if (isBreakClash) tooltipContent += 'বিরতির আগে ও পরে একই শিক্ষকের ক্লাস পড়েছে। ';

    const { teacher } = parseSubjectTeacher(content);
    const firstTeacher = teacher ? teacher.split('/')[0].trim() : null;
    const color = firstTeacher ? teacherColorMap.get(firstTeacher) : undefined;

    const cellContent = isEditMode ? (
        <Input
            value={content}
            onChange={(e) => onCellChange(e.target.value)}
            className={cn("w-full h-full p-1 text-xs border-transparent rounded-none focus:bg-amber-100", { "bg-red-100": isConflict })}
        />
    ) : (
        content
    );

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <TableCell 
                        className={cn("border-r text-center p-0", { "bg-red-100 text-red-700": isConflict && !isEditMode })}
                        style={!isEditMode && !isConflict && color ? { backgroundColor: color } : {}}
                    >
                        {cellContent}
                    </TableCell>
                </TooltipTrigger>
                {isConflict && <TooltipContent><p>{tooltipContent}</p></TooltipContent>}
            </Tooltip>
        </TooltipProvider>
    );
};

const ClassRoutineTab = ({ routineData, conflicts, isEditMode, onCellChange, teacherColorMap }: { routineData: any, conflicts: any, isEditMode: boolean, onCellChange: (cls: string, day: string, periodIdx: number, value: string) => void, teacherColorMap: Map<string, string> }) => {
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
                <CombinedRoutineTable routineData={routineData} conflicts={conflicts} isEditMode={isEditMode} onCellChange={onCellChange} teacherColorMap={teacherColorMap} />
            ) : (
                <RoutineTable 
                    className={className} 
                    routineData={routineData}
                    conflicts={conflicts}
                    isEditMode={isEditMode}
                    onCellChange={onCellChange}
                    teacherColorMap={teacherColorMap}
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
    
    const db = useFirestore();
    const { toast } = useToast();
    const [originalRoutineData, setOriginalRoutineData] = useState<Record<string, Record<string, string[]>>>({});
    const [routineData, setRoutineData] = useState<Record<string, Record<string, string[]>>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);

    const fetchData = useCallback(async () => {
        if (!db) return;
        setIsLoading(true);
        const routinesFromDb = await getFullRoutine(db, selectedYear);
        const transformedData: Record<string, Record<string, string[]>> = {};
        routinesFromDb.forEach(r => {
            if (!transformedData[r.className]) {
                transformedData[r.className] = {};
            }
            const periods = r.periods || [];
            while (periods.length < 6) {
                periods.push('');
            }
            transformedData[r.className][r.day] = periods.slice(0, 6);
        });
        setRoutineData(transformedData);
        setOriginalRoutineData(transformedData);
        setIsLoading(false);
    }, [db, selectedYear]);

    useEffect(() => {
        setIsClient(true);
        fetchData();
    }, [fetchData]);

    const { conflicts, stats, teacherColorMap } = useRoutineAnalysis(routineData);
    
    const handleCellChange = (className: string, day: string, periodIndex: number, value: string) => {
        setRoutineData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            if (!newData[className]) newData[className] = {};
            if (!newData[className][day]) newData[className][day] = Array(6).fill('');
            newData[className][day][periodIndex] = value;
            return newData;
        });
    };

    const handleSaveChanges = () => {
        if (!db) return;
        
        const routinesToSave: ClassRoutine[] = [];
        Object.keys(routineData).forEach(className => {
            Object.keys(routineData[className]).forEach(day => {
                routinesToSave.push({
                    academicYear: selectedYear,
                    className,
                    day,
                    periods: routineData[className][day]
                });
            });
        });

        saveRoutinesBatch(db, routinesToSave).then(() => {
            toast({ title: 'রুটিন সেভ হয়েছে' });
            setIsEditMode(false);
            setOriginalRoutineData(routineData);
        }).catch(() => {
            toast({ variant: 'destructive', title: 'সেভ করা যায়নি' });
        });
    };

    const handleCancelEdit = () => {
        setRoutineData(originalRoutineData);
        setIsEditMode(false);
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-fuchsia-50">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>রুটিন</CardTitle>
                                {isClient && <p className="text-sm text-muted-foreground">শিক্ষাবর্ষ: {selectedYear.toLocaleString('bn-BD')}</p>}
                            </div>
                             {isEditMode ? (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleCancelEdit}>বাতিল</Button>
                                    <Button onClick={handleSaveChanges}>পরিবর্তন সেভ করুন</Button>
                                </div>
                            ) : (
                                <Button variant="outline" onClick={() => setIsEditMode(true)}><FilePen className="mr-2 h-4 w-4" /> রুটিন এডিট করুন</Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isClient && !isLoading ? (
                            <Tabs defaultValue="class-routine">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="class-routine">ক্লাস রুটিন</TabsTrigger>
                                    <TabsTrigger value="exam-routine">পরীক্ষার রুটিন</TabsTrigger>
                                    <TabsTrigger value="statistics">পরিসংখ্যান</TabsTrigger>
                                </TabsList>
                                <TabsContent value="class-routine" className="mt-4">
                                    <ClassRoutineTab routineData={routineData} conflicts={conflicts} isEditMode={isEditMode} onCellChange={handleCellChange} teacherColorMap={teacherColorMap!} />
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
                               <div className="grid w-full grid-cols-3 h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                                    <div className="inline-flex items-center justify-center rounded-sm bg-background shadow-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
                                    <div className="inline-flex items-center justify-center rounded-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
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
