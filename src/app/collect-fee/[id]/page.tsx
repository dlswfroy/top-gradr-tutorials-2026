'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStudentById, Student } from '@/lib/student-data';
import { getFeeCollectionForStudent, saveFeeCollection, FeeCollection, MonthlyFee, NewFeeCollectionData } from '@/lib/fees-data';
import { useSchoolInfo } from '@/context/SchoolInfoContext';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { useFirestore } from '@/firebase';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { addTransaction, NewTransactionData } from '@/lib/transactions-data';

const months = ['জানুয়ারী', 'ফেব্রুয়ারী', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

const feeFields: { key: keyof Omit<MonthlyFee, 'month' | 'collectionDate'>; label: string }[] = [
    { key: 'tuitionCurrent', label: 'চলতি' },
    { key: 'tuitionAdvance', label: 'অগ্রিম' },
    { key: 'tuitionDue', label: 'বকেয়া' },
    { key: 'tuitionFine', label: 'জরিমানা' },
    { key: 'examFeeHalfYearly', label: 'অর্ধ-বার্ষিক' },
    { key: 'examFeeAnnual', label: 'বার্ষিক' },
    { key: 'examFeePreNirbachoni', label: 'প্রাক-নির্বাচনী' },
    { key: 'examFeeNirbachoni', label: 'নির্বাচনী' },
    { key: 'sessionFee', label: 'সেশন ফি' },
    { key: 'admissionFee', label: 'ভর্তি ফি' },
    { key: 'scoutFee', label: 'স্কাউট ফি' },
    { key: 'developmentFee', label: 'উন্নয়ন ফি' },
    { key: 'libraryFee', label: 'লাইব্রেরি ফি' },
    { key: 'tiffinFee', label: 'টিফিন ফি' },
];

const initialMonthlyFees: { [month: string]: MonthlyFee } = months.reduce((acc, month) => {
    acc[month] = { month };
    return acc;
}, {} as { [month: string]: MonthlyFee });


export default function CollectFeePage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.id as string;
    const db = useFirestore();
    const { schoolInfo } = useSchoolInfo();
    const { selectedYear } = useAcademicYear();
    const { toast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [feeCollection, setFeeCollection] = useState<FeeCollection | null>(null);
    const [monthlyFees, setMonthlyFees] = useState<{ [month: string]: MonthlyFee }>(initialMonthlyFees);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!db || !studentId) return;

        const fetchData = async () => {
            setIsLoading(true);
            const studentData = await getStudentById(db, studentId);
            if (studentData) {
                setStudent(studentData);
                const feeData = await getFeeCollectionForStudent(db, studentId, selectedYear);
                setFeeCollection(feeData);
                if (feeData) {
                    const mergedFees = { ...initialMonthlyFees };
                    const feeDataMonthlyFees = feeData.monthlyFees || {};
                    for (const monthKey in feeDataMonthlyFees) {
                        if (mergedFees[monthKey]) {
                            mergedFees[monthKey] = { ...mergedFees[monthKey], ...feeDataMonthlyFees[monthKey] };
                        }
                    }
                    setMonthlyFees(mergedFees);
                } else {
                    setMonthlyFees(initialMonthlyFees);
                }
            } else {
                toast({ variant: 'destructive', title: 'শিক্ষার্থী পাওয়া যায়নি' });
                router.push('/accounts');
            }
            setIsLoading(false);
        };

        fetchData();
    }, [db, studentId, selectedYear, toast, router]);

    const handleFeeChange = (month: string, field: keyof Omit<MonthlyFee, 'month' | 'collectionDate'>, value: string) => {
        const numValue = value === '' ? undefined : parseInt(value, 10);
        setMonthlyFees(prev => ({
            ...prev,
            [month]: {
                ...prev[month],
                [field]: numValue,
                collectionDate: (numValue !== undefined && !isNaN(numValue)) || Object.values(prev[month]).some(v => typeof v === 'number') ? (prev[month].collectionDate || new Date()) : undefined
            }
        }));
    };
    
    const calculateTotal = (month: string, fields: (keyof MonthlyFee)[]) => {
        const monthData = monthlyFees[month];
        if (!monthData) return 0;
        return fields.reduce((acc, field) => {
             const value = monthData[field] as number | undefined;
             return acc + (value || 0);
        }, 0);
    }
    
    const calculateGrandTotal = (field: keyof MonthlyFee) => {
        return months.reduce((total, month) => {
            const value = monthlyFees[month]?.[field] as number | undefined;
            return total + (value || 0);
        }, 0);
    };

    const handleSaveFees = async () => {
        if (!db || !student) return;

        const oldFees = feeCollection?.monthlyFees || {};
        const newFees = monthlyFees;

        // Calculate deltas for each fee head
        const deltas: { [key: string]: number } = {};
        const allFeeKeys: (keyof Omit<MonthlyFee, 'month' | 'collectionDate'>)[] = [
            'tuitionCurrent', 'tuitionAdvance', 'tuitionDue', 'tuitionFine',
            'examFeeHalfYearly', 'examFeeAnnual', 'examFeePreNirbachoni', 'examFeeNirbachoni',
            'sessionFee', 'admissionFee', 'scoutFee', 'developmentFee', 'libraryFee', 'tiffinFee'
        ];

        allFeeKeys.forEach(key => {
            const oldTotal = Object.values(oldFees).reduce((sum, month) => sum + (month[key] || 0), 0);
            const newTotal = Object.values(newFees).reduce((sum, month) => sum + (month[key] || 0), 0);
            if (newTotal > oldTotal) {
                deltas[key] = newTotal - oldTotal;
            }
        });
        
        const feeHeadMapping: { [key in keyof Omit<MonthlyFee, 'month' | 'collectionDate'>]?: string } = {
            tuitionCurrent: 'Tuition Fee',
            tuitionAdvance: 'Tuition Fee',
            tuitionDue: 'Tuition Fee',
            tuitionFine: 'Tuition Fee',
            examFeeHalfYearly: 'Exam Fee',
            examFeeAnnual: 'Exam Fee',
            examFeePreNirbachoni: 'Exam Fee',
            examFeeNirbachoni: 'Exam Fee',
            sessionFee: 'Session Fee',
            admissionFee: 'Admission Fee',
            scoutFee: 'Other',
            developmentFee: 'Other',
            libraryFee: 'Other',
            tiffinFee: 'Other'
        };

        const transactionsToCreate: { [head: string]: NewTransactionData } = {};

        for (const key in deltas) {
            const feeKey = key as keyof typeof feeHeadMapping;
            const amount = deltas[feeKey];
            if(!amount) continue;

            const accountHead = feeHeadMapping[feeKey] || 'Other';

            if (!transactionsToCreate[accountHead]) {
                transactionsToCreate[accountHead] = {
                    date: new Date(),
                    type: 'income',
                    accountHead: accountHead,
                    description: `Fee from ${student.studentNameBn}, Roll: ${student.roll.toLocaleString('bn-BD')}`,
                    amount: 0,
                    academicYear: selectedYear
                };
            }
            transactionsToCreate[accountHead].amount += amount;
        }
        
        // Save fee collection first
        const dataToSave: NewFeeCollectionData = {
            studentId: student.id,
            academicYear: selectedYear,
            monthlyFees: monthlyFees,
        };
        
        try {
            await saveFeeCollection(db, dataToSave);
            
            // Then create all transactions
            const transactionPromises = Object.values(transactionsToCreate).map(tx => addTransaction(db, tx));
            await Promise.all(transactionPromises);

            if (Object.keys(transactionsToCreate).length > 0) {
                 toast({ title: "ফি আদায় সফল হয়েছে", description: `শিক্ষার্থীর ফি এবং ক্যাশবুক সফলভাবে আপডেট করা হয়েছে।` });
            } else {
                 toast({ title: "ফি আদায় সফল হয়েছে", description: "শিক্ষার্থীর ফি সফলভাবে সেভ করা হয়েছে।" });
            }
            
            // After successful save, update the initial state for the next calculation
            const updatedFeeData = await getFeeCollectionForStudent(db, student.id, selectedYear);
            setFeeCollection(updatedFeeData || null);

        } catch (error) {
            // error is handled by the global listener
        }
    };
    
    if (isLoading) {
        return (
             <div className="flex min-h-screen w-full flex-col bg-background">
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                     <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-1/2 mx-auto" />
                            <Skeleton className="h-6 w-1/3 mx-auto mt-2" />
                            <Skeleton className="h-4 w-1/4 mx-auto mt-2" />
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-2 mb-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Skeleton className="h-6 w-full" />
                                    <Skeleton className="h-6 w-full" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Skeleton className="h-6 w-full" />
                                    <Skeleton className="h-6 w-full" />
                                </div>
                            </div>
                            <Skeleton className="h-[400px] w-full" />
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader className="text-center">
                        {schoolInfo.logoUrl && <Image src={schoolInfo.logoUrl} alt="School Logo" width={80} height={80} className="mx-auto" />}
                        <CardTitle className="text-3xl">{schoolInfo.name}</CardTitle>
                        <p>{schoolInfo.address}</p>
                        <h2 className="text-xl font-semibold pt-2">ছাত্র/ ছাত্রীর বেতন আদায় তথ্য - {selectedYear.toLocaleString('bn-BD')}</h2>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md p-4 mb-6 text-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div><span className="font-semibold">শিক্ষার্থীর নামঃ</span> {student?.studentNameBn}</div>
                                <div><span className="font-semibold">রোল নং-</span> {student?.roll.toLocaleString('bn-BD')}</div>
                                <div><span className="font-semibold">শাখাঃ</span> {student?.group ? student.group.charAt(0).toUpperCase() + student.group.slice(1) : '-'}</div>
                                <div><span className="font-semibold">মোবাইল নং-</span> {student?.guardianMobile}</div>
                                <div><span className="font-semibold">পিতার নামঃ</span> {student?.fatherNameBn}</div>
                                <div><span className="font-semibold">মাতার নামঃ</span> {student?.motherNameBn}</div>
                                <div><span className="font-semibold">শ্রেণিঃ</span> {student?.className}-য়</div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table className="min-w-max border">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead rowSpan={2} className="border text-center align-middle">মাসের নাম</TableHead>
                                        <TableHead rowSpan={2} className="border text-center align-middle">আদায়ের তারিখ</TableHead>
                                        <TableHead colSpan={4} className="border text-center">বেতন আদায়</TableHead>
                                        <TableHead colSpan={4} className="border text-center">পরীক্ষার ফি আদায়</TableHead>
                                        <TableHead colSpan={6} className="border text-center">অন্যান্য ফি</TableHead>
                                        <TableHead rowSpan={2} className="border text-center align-middle">মোট আদায়</TableHead>
                                    </TableRow>
                                    <TableRow>
                                        {feeFields.map(field => (
                                             <TableHead key={field.key} className="border text-center text-xs p-1">{field.label}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {months.map(month => {
                                        const totalForMonth = calculateTotal(month, feeFields.map(f => f.key));
                                        return (
                                            <TableRow key={month}>
                                                <TableCell className="border font-semibold">{month}</TableCell>
                                                <TableCell className="border text-center">
                                                    {monthlyFees[month]?.collectionDate ? new Date(monthlyFees[month].collectionDate!).toLocaleDateString('bn-BD') : '-'}
                                                </TableCell>
                                                {feeFields.map(field => (
                                                    <TableCell key={field.key} className="border p-1">
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            className="w-20 h-8 text-center"
                                                            value={monthlyFees[month]?.[field.key] || ''}
                                                            onChange={(e) => handleFeeChange(month, field.key, e.target.value)}
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell className="border text-center font-semibold">
                                                    {totalForMonth > 0 ? totalForMonth.toLocaleString('bn-BD') : '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    <TableRow className="bg-muted font-bold">
                                        <TableCell colSpan={2} className="text-right border">সর্বমোট</TableCell>
                                        {feeFields.map(field => (
                                            <TableCell key={field.key} className="text-center border">{calculateGrandTotal(field.key).toLocaleString('bn-BD')}</TableCell>
                                        ))}
                                        <TableCell className="text-center border">
                                            {calculateGrandTotal(feeFields.map(f => f.key) as any).toLocaleString('bn-BD')}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                         <div className="flex justify-end mt-6">
                            <Button onClick={handleSaveFees}>আদায় সংরক্ষণ করুন</Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

    