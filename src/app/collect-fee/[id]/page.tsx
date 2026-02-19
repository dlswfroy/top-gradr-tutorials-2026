'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getStudentById, Student } from '@/lib/student-data';
import { getFeeCollectionsForStudent, FeeCollection, FeeBreakdown, NewFeeCollectionData } from '@/lib/fees-data';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { useFirestore } from '@/firebase';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { NewTransactionData } from '@/lib/transactions-data';
import { collection, doc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Calendar as CalendarIcon, FilePen, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const feeFields: { key: keyof FeeBreakdown; label: string }[] = [
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

const feeHeadMapping: { [key in keyof FeeBreakdown]?: string } = {
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

const emptyBreakdown: FeeBreakdown = {};

function FeeCollectionForm({ student, onSave, existingCollection, open, onOpenChange }: { student: Student, onSave: () => void, existingCollection: FeeCollection | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    const db = useFirestore();
    const { toast } = useToast();
    const { selectedYear } = useAcademicYear();
    const [collectionDate, setCollectionDate] = useState<Date>(new Date());
    const [description, setDescription] = useState('');
    const [breakdown, setBreakdown] = useState<FeeBreakdown>(emptyBreakdown);

    useEffect(() => {
        if (existingCollection) {
            setCollectionDate(new Date(existingCollection.collectionDate));
            setDescription(existingCollection.description);
            setBreakdown(existingCollection.breakdown);
        } else {
            setCollectionDate(new Date());
            setDescription('');
            setBreakdown(emptyBreakdown);
        }
    }, [existingCollection]);

    const handleFeeChange = (field: keyof FeeBreakdown, value: string) => {
        const numValue = value === '' ? undefined : parseInt(value, 10);
        setBreakdown(prev => ({ ...prev, [field]: numValue }));
    };

    const totalAmount = useMemo(() => {
        return Object.values(breakdown).reduce((acc, val) => acc + (val || 0), 0);
    }, [breakdown]);

    const handleSave = async () => {
        if (!db || !student || !collectionDate) {
            toast({ variant: 'destructive', title: 'প্রয়োজনীয় তথ্য পূরণ করুন' });
            return;
        }

        const batch = writeBatch(db);

        // If editing, delete old transactions first
        if (existingCollection && existingCollection.transactionIds) {
            existingCollection.transactionIds.forEach(id => {
                const transRef = doc(db, 'transactions', id);
                batch.delete(transRef);
            });
        }
        
        // Create new transactions for cashbook
        const transactionsToCreate: { [head: string]: NewTransactionData } = {};
        const newTransactionRefs: { [head: string]: any } = {};

        for (const key in breakdown) {
            const feeKey = key as keyof FeeBreakdown;
            const amount = breakdown[feeKey];
            if (!amount) continue;

            const accountHead = feeHeadMapping[feeKey] || 'Other';

            if (!transactionsToCreate[accountHead]) {
                transactionsToCreate[accountHead] = {
                    date: collectionDate,
                    type: 'income',
                    accountHead: accountHead,
                    description: `Fee from ${student.studentNameBn}, Roll: ${student.roll.toLocaleString('bn-BD')}`,
                    amount: 0,
                    academicYear: selectedYear,
                };
                newTransactionRefs[accountHead] = doc(collection(db, 'transactions'));
            }
            transactionsToCreate[accountHead].amount += amount;
        }
        
        const newTransactionIds: string[] = [];
        for (const head in transactionsToCreate) {
            const txRef = newTransactionRefs[head];
            newTransactionIds.push(txRef.id);
            const data = transactionsToCreate[head];
            batch.set(txRef, { ...data, date: Timestamp.fromDate(data.date), feeCollectionId: existingCollection?.id || doc(collection(db, 'feeCollections')).id });
        }
        
        // Create or Update Fee Collection
        const feeCollectionData: NewFeeCollectionData | any = {
            studentId: student.id,
            academicYear: selectedYear,
            collectionDate: Timestamp.fromDate(collectionDate),
            description,
            totalAmount,
            breakdown,
            transactionIds: newTransactionIds,
            updatedAt: serverTimestamp(),
        };

        if (existingCollection) {
            const feeDocRef = doc(db, 'feeCollections', existingCollection.id);
            batch.update(feeDocRef, feeCollectionData);
        } else {
            const feeDocRef = doc(collection(db, 'feeCollections'));
            feeCollectionData.createdAt = serverTimestamp();
            feeCollectionData.transactionIds = newTransactionIds.map(id => id.toString());
            // fix feeCollectionId in transactions
             for (const head in transactionsToCreate) {
                const txRef = newTransactionRefs[head];
                const data = transactionsToCreate[head];
                batch.set(txRef, { ...data, date: Timestamp.fromDate(data.date), feeCollectionId: feeDocRef.id });
            }
            batch.set(feeDocRef, feeCollectionData);
        }

        try {
            await batch.commit();
            toast({ title: "ফি আদায় সফল হয়েছে", description: `শিক্ষার্থীর ফি এবং ক্যাশবুক সফলভাবে আপডেট করা হয়েছে।` });
            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            const permissionError = new FirestorePermissionError({
                path: 'feeCollections/ or transactions/',
                operation: 'write',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{existingCollection ? 'ফি আদায় এডিট করুন' : 'নতুন ফি আদায়'}</DialogTitle>
                    <DialogDescription>
                        {student.studentNameBn} (রোল: {student.roll.toLocaleString('bn-BD')}) এর জন্য ফি আদায় করুন।
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">আদায়ের তারিখ</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !collectionDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {collectionDate ? format(collectionDate, "PPP", { locale: bn }) : <span>একটি তারিখ নির্বাচন করুন</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={collectionDate} onSelect={(d) => d && setCollectionDate(d)} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">বিবরণ</Label>
                        <Input id="description" placeholder="যেমন: জানুয়ারি মাসের বেতন" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                </div>
                <div className="border-t pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {feeFields.map(field => (
                            <div key={field.key} className="space-y-2">
                                <Label htmlFor={field.key}>{field.label}</Label>
                                <Input
                                    id={field.key}
                                    type="number"
                                    placeholder="0"
                                    value={breakdown[field.key] || ''}
                                    onChange={(e) => handleFeeChange(field.key, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter className="pt-4 border-t">
                    <div className="flex justify-between w-full items-center">
                        <p className="font-semibold">মোট আদায়: {totalAmount.toLocaleString('bn-BD')} টাকা</p>
                        <div>
                             <DialogClose asChild><Button variant="ghost">বাতিল</Button></DialogClose>
                            <Button onClick={handleSave}>সেভ করুন</Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function CollectFeePage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.id as string;
    const db = useFirestore();
    const { selectedYear } = useAcademicYear();
    const { toast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [feeCollections, setFeeCollections] = useState<FeeCollection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<FeeCollection | null>(null);

    const fetchFeeData = useCallback(async () => {
        if (!db || !studentId) return;
        const collections = await getFeeCollectionsForStudent(db, studentId, selectedYear);
        setFeeCollections(collections);
    }, [db, studentId, selectedYear]);

    useEffect(() => {
        if (!db || !studentId) return;

        const fetchData = async () => {
            setIsLoading(true);
            const studentData = await getStudentById(db, studentId);
            if (studentData) {
                setStudent(studentData);
                await fetchFeeData();
            } else {
                toast({ variant: 'destructive', title: 'শিক্ষার্থী পাওয়া যায়নি' });
                router.push('/accounts');
            }
            setIsLoading(false);
        };

        fetchData();
    }, [db, studentId, selectedYear, toast, router, fetchFeeData]);

    const handleEdit = (collection: FeeCollection) => {
        setEditingCollection(collection);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingCollection(null);
        setIsFormOpen(true);
    };

    const handleDelete = async (collection: FeeCollection) => {
        if(!db) return;

        const batch = writeBatch(db);
        const feeCollectionRef = doc(db, 'feeCollections', collection.id);
        batch.delete(feeCollectionRef);

        if (collection.transactionIds) {
            collection.transactionIds.forEach(id => {
                const transRef = doc(db, 'transactions', id);
                batch.delete(transRef);
            });
        }
        
        try {
            await batch.commit();
            toast({title: "লেনদেন মুছে ফেলা হয়েছে।"});
            fetchFeeData();
        } catch(error) {
             console.error(error);
             toast({variant: 'destructive', title: "ত্রুটি", description: "লেনদেনটি মোছা যায়নি।"});
        }
    };
    
    if (isLoading) {
        return (
             <div className="flex min-h-screen w-full flex-col bg-background">
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                     <Card>
                        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                        <CardContent>
                             <div className="space-y-2 mb-4"><Skeleton className="h-24 w-full" /></div>
                            <Skeleton className="h-[200px] w-full" />
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
                {student && (
                <>
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                {student.photoUrl && <Image src={student.photoUrl} alt="Student photo" width={96} height={96} className="rounded-lg border object-cover" />}
                                <div className="flex-1 text-center md:text-left">
                                    <CardTitle className="text-2xl">ছাত্র/ ছাত্রীর বেতন আদায় তথ্য - {selectedYear.toLocaleString('bn-BD')}</CardTitle>
                                    <p className="text-muted-foreground mt-2">
                                        <span className="font-semibold">{student.studentNameBn}</span> (রোল: {student.roll.toLocaleString('bn-BD')}, শ্রেণি: {student.className}-য়)
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>আদায়ের তারিখ</TableHead>
                                            <TableHead>বিবরণ</TableHead>
                                            <TableHead className="text-right">মোট টাকা</TableHead>
                                            <TableHead className="text-right">কার্যক্রম</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {feeCollections.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center h-24">কোনো ফি আদায় করা হয়নি।</TableCell></TableRow>
                                        ) : (
                                            feeCollections.map(collection => (
                                                <TableRow key={collection.id}>
                                                    <TableCell>{format(collection.collectionDate, "PP", { locale: bn })}</TableCell>
                                                    <TableCell>{collection.description || 'N/A'}</TableCell>
                                                    <TableCell className="text-right font-medium">{collection.totalAmount.toLocaleString('bn-BD')} ৳</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <Button variant="outline" size="icon" onClick={() => handleEdit(collection)}>
                                                                <FilePen className="h-4 w-4" />
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                                                                        <AlertDialogDescription>এই লেনদেনটি স্থায়ীভাবে মুছে যাবে। এটি ক্যাশবুক থেকেও মুছে যাবে।</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(collection)}>মুছে ফেলুন</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex justify-end mt-6">
                                <Button onClick={handleAddNew}>নতুন ফি আদায় করুন</Button>
                            </div>
                        </CardContent>
                    </Card>
                    <FeeCollectionForm 
                        student={student} 
                        onSave={fetchFeeData} 
                        existingCollection={editingCollection}
                        open={isFormOpen}
                        onOpenChange={setIsFormOpen}
                    />
                </>
                )}
            </main>
        </div>
    );
}
