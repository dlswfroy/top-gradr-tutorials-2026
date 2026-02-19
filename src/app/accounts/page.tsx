'use client';

import Image from 'next/image';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student } from '@/lib/student-data';
import Link from 'next/link';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, orderBy, FirestoreError } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Transaction, NewTransactionData, addTransaction, getTransactions, deleteTransaction, TransactionType } from '@/lib/transactions-data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StudentFeeDialog } from '@/components/StudentFeeDialog';
import { DatePicker } from '@/components/ui/date-picker';


// Fee Collection Component
const FeeCollectionTab = ({ onFeeCollected }: { onFeeCollected: () => void }) => {
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { selectedYear } = useAcademicYear();
    const db = useFirestore();
    const [feeStudent, setFeeStudent] = useState<Student | null>(null);

    useEffect(() => {
        if (!db) return;
        setIsLoading(true);

        const studentsQuery = query(
        collection(db, "students"), 
        orderBy("roll")
        );

        const unsubscribe = onSnapshot(studentsQuery, (querySnapshot) => {
        const studentsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            dob: doc.data().dob?.toDate(),
        })) as Student[];
        setAllStudents(studentsData);
        setIsLoading(false);
        }, async (error: FirestoreError) => {
        const permissionError = new FirestorePermissionError({
            path: 'students',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    const studentsForYear = useMemo(() => {
        return allStudents.filter(student => student.academicYear === selectedYear);
    }, [allStudents, selectedYear]);

    const classes = ['6', '7', '8', '9', '10'];
    const classNamesMap: { [key: string]: string } = {
        '6': '৬ষ্ঠ', '7': '৭ম', '8': '৮ম', '9': '৯ম', '10': '১০ম',
    };

    const getStudentsByClass = (className: string): Student[] => {
        return studentsForYear.filter((student) => student.className === className);
    };

    return (
        <>
        <Tabs defaultValue="6">
            <TabsList className="grid w-full grid-cols-5">
            {classes.map((className) => (
                <TabsTrigger key={className} value={className}>
                {classNamesMap[className]} শ্রেণি
                </TabsTrigger>
            ))}
            </TabsList>
            {classes.map((className) => (
            <TabsContent key={className} value={className}>
                <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>রোল</TableHead>
                            <TableHead>শিক্ষার্থীর নাম</TableHead>
                            <TableHead>পিতার নাম</TableHead>
                            <TableHead className="text-right">কার্যক্রম</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    লোড হচ্ছে...
                                </TableCell>
                            </TableRow>
                        ) : getStudentsByClass(className).length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    এই শ্রেণিতে কোনো শিক্ষার্থী নেই।
                                </TableCell>
                            </TableRow>
                        ) : (
                            getStudentsByClass(className).map((student) => (
                            <TableRow key={student.id}>
                                <TableCell>{student.roll.toLocaleString('bn-BD')}</TableCell>
                                <TableCell className="whitespace-nowrap">{student.studentNameBn}</TableCell>
                                <TableCell className="whitespace-nowrap">{student.fatherNameBn}</TableCell>
                                <TableCell className="text-right">
                                <Button onClick={() => setFeeStudent(student)}>বেতন আদায় করুন</Button>
                                </TableCell>
                            </TableRow>
                            ))
                        )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
                </Card>
            </TabsContent>
            ))}
        </Tabs>
        <StudentFeeDialog student={feeStudent} open={!!feeStudent} onOpenChange={() => setFeeStudent(null)} onFeeCollected={onFeeCollected} />
        </>
    )
}

// New Transaction Component
const NewTransactionTab = ({ onTransactionAdded }: { onTransactionAdded: () => void }) => {
    const { toast } = useToast();
    const db = useFirestore();
    const { selectedYear } = useAcademicYear();

    const [date, setDate] = useState<Date | undefined>(new Date());
    const [type, setType] = useState<TransactionType>('income');
    const [accountHead, setAccountHead] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');

    const incomeHeads = ['Tuition Fee', 'Exam Fee', 'Admission Fee', 'Session Fee', 'Donation', 'Other'];
    const expenseHeads = ['Salary', 'Utilities', 'Stationery', 'Maintenance', 'Other'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !date || !type || !accountHead || !amount || amount <= 0) {
            toast({ variant: 'destructive', title: 'অনুগ্রহ করে সকল তথ্য পূরণ করুন এবং টাকার পরিমাণ শূন্যের বেশি রাখুন।' });
            return;
        }

        const newTransaction: NewTransactionData = {
            date,
            type,
            accountHead,
            description,
            amount: Number(amount),
            academicYear: selectedYear
        };

        try {
            await addTransaction(db, newTransaction);
            toast({ title: 'লেনদেন যোগ হয়েছে।', description: 'নতুন লেনদেনটি সফলভাবে যোগ করা হয়েছে।' });
            // Reset form
            setDate(new Date());
            setAccountHead('');
            setDescription('');
            setAmount('');
            onTransactionAdded(); // Notify parent to refetch transactions
        } catch (error) {
            // Error is handled by the global listener
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>নতুন আয়/ব্যয় যোগ করুন</CardTitle>
                <CardDescription>আপনার প্রতিষ্ঠানের আয় ও ব্যয়ের হিসাব এখানে যোগ করুন।</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="date">তারিখ</Label>
                            <DatePicker value={date} onChange={setDate} />
                        </div>
                        <div className="space-y-2">
                             <Label>লেনদেনের ধরণ</Label>
                            <RadioGroup value={type} onValueChange={(v) => setType(v as TransactionType)} className="flex items-center space-x-4 pt-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="income" id="income" />
                                    <Label htmlFor="income">আয়</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="expense" id="expense" />
                                    <Label htmlFor="expense">ব্যয়</Label>
                                </div>
                            </RadioGroup>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="account-head">খাত</Label>
                            <Select value={accountHead} onValueChange={setAccountHead}>
                                <SelectTrigger id="account-head"><SelectValue placeholder="খাত নির্বাচন করুন" /></SelectTrigger>
                                <SelectContent>
                                    {(type === 'income' ? incomeHeads : expenseHeads).map(head => (
                                        <SelectItem key={head} value={head}>{head}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="amount">টাকার পরিমাণ</Label>
                            <Input id="amount" type="number" placeholder="টাকার পরিমাণ" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} required />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="description">বিবরণ</Label>
                            <Input id="description" placeholder="লেনদেনের সংক্ষিপ্ত বিবরণ" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                    </div>
                     <div className="flex justify-end">
                        <Button type="submit">লেনদেন সেভ করুন</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

// Cashbook Component
const CashbookTab = ({ transactions, isLoading, refetch }: { transactions: Transaction[], isLoading: boolean, refetch: () => void }) => {
    const db = useFirestore();
    const { toast } = useToast();

    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions]);

    const cashbookData = useMemo(() => {
        let balance = 0;
        return sortedTransactions.map(tx => {
            if (tx.type === 'income') {
                balance += tx.amount;
            } else {
                balance -= tx.amount;
            }
            return { ...tx, balance };
        });
    }, [sortedTransactions]);

    const handleDelete = async (id: string) => {
        if(!db) return;
        try {
            await deleteTransaction(db, id);
            toast({ title: 'লেনদেন মুছে ফেলা হয়েছে।'});
            refetch();
        } catch (error) {
            // error handled by listener
        }
    }

    return (
        <Card>
             <CardHeader>
                <CardTitle>ক্যাশবুক</CardTitle>
                <CardDescription>প্রতিষ্ঠানের সকল আয় ও ব্যয়ের কালানুক্রমিক তালিকা।</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>তারিখ</TableHead>
                                <TableHead>বিবরণ</TableHead>
                                <TableHead className="text-right">আয়</TableHead>
                                <TableHead className="text-right">ব্যয়</TableHead>
                                <TableHead className="text-right">ব্যালেন্স</TableHead>
                                <TableHead className="text-right">কার্যক্রম</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center p-8">লোড হচ্ছে...</TableCell></TableRow>
                            ) : cashbookData.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center p-8">কোনো লেনদেন পাওয়া যায়নি।</TableCell></TableRow>
                            ) : (
                                cashbookData.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{format(new Date(tx.date), 'PP')}</TableCell>
                                        <TableCell>
                                            <p className="font-medium">{tx.accountHead}</p>
                                            {tx.description && <p className="text-sm text-muted-foreground">{tx.description}</p>}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">{tx.type === 'income' ? tx.amount.toLocaleString('bn-BD') : '-'}</TableCell>
                                        <TableCell className="text-right text-red-600">{tx.type === 'expense' ? tx.amount.toLocaleString('bn-BD') : '-'}</TableCell>
                                        <TableCell className="text-right font-semibold">{tx.balance.toLocaleString('bn-BD')}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" disabled={!!tx.feeCollectionId}><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                                                        <AlertDialogDescription>এই লেনদেনটি স্থায়ীভাবে মুছে যাবে।</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(tx.id)}>মুছে ফেলুন</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

// Ledger Component
const LedgerTab = ({ transactions, isLoading }: { transactions: Transaction[], isLoading: boolean }) => {
    
    const ledgerData = useMemo(() => {
        const grouped: { [key: string]: { income: number, expense: number, transactions: Transaction[] } } = {};
        transactions.forEach(tx => {
            if (!grouped[tx.accountHead]) {
                grouped[tx.accountHead] = { income: 0, expense: 0, transactions: [] };
            }
            if (tx.type === 'income') {
                grouped[tx.accountHead].income += tx.amount;
            } else {
                grouped[tx.accountHead].expense += tx.amount;
            }
            grouped[tx.accountHead].transactions.push(tx);
        });
        return grouped;
    }, [transactions]);
    
    return (
         <Card>
             <CardHeader>
                <CardTitle>খতিয়ান (লেজার)</CardTitle>
                <CardDescription>খাত অনুযায়ী আয়-ব্যয়ের বিস্তারিত হিসাব।</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-center p-8">লোড হচ্ছে...</p>
                ) : Object.keys(ledgerData).length === 0 ? (
                    <p className="text-center p-8">কোনো লেনদেন পাওয়া যায়নি।</p>
                ) : (
                    <Accordion type="multiple" className="w-full">
                        {Object.entries(ledgerData).map(([head, data]) => (
                             <AccordionItem value={head} key={head}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4">
                                        <span>{head}</span>
                                        <div className="flex gap-4">
                                            <span className="text-green-600">মোট আয়: {data.income.toLocaleString('bn-BD')}</span>
                                            <span className="text-red-600">মোট ব্যয়: {data.expense.toLocaleString('bn-BD')}</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>তারিখ</TableHead>
                                                <TableHead>বিবরণ</TableHead>
                                                <TableHead className="text-right">আয়</TableHead>
                                                <TableHead className="text-right">ব্যয়</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(tx => (
                                                <TableRow key={tx.id}>
                                                    <TableCell>{format(new Date(tx.date), 'PP')}</TableCell>
                                                    <TableCell>{tx.description || '-'}</TableCell>
                                                    <TableCell className="text-right text-green-600">{tx.type === 'income' ? tx.amount.toLocaleString('bn-BD') : '-'}</TableCell>
                                                    <TableCell className="text-right text-red-600">{tx.type === 'expense' ? tx.amount.toLocaleString('bn-BD') : '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    )
}


export default function AccountsPage() {
  const [isClient, setIsClient] = useState(false);
  const db = useFirestore();
  const { selectedYear } = useAcademicYear();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!db) return;
    setIsLoading(true);
    const fetchedTransactions = await getTransactions(db, selectedYear);
    setTransactions(fetchedTransactions);
    setIsLoading(false);
  }, [db, selectedYear]);

  useEffect(() => {
    setIsClient(true);
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
             <CardTitle>হিসাব শাখা</CardTitle>
             <CardDescription>শিক্ষার্থীদের বেতন ও অন্যান্য ফি আদায় এবং প্রতিষ্ঠানের আয়-ব্যয় পরিচালনা করুন। শিক্ষাবর্ষ: {selectedYear.toLocaleString('bn-BD')}</CardDescription>
          </CardHeader>
          <CardContent>
             {isClient ? (
                <Tabs defaultValue="fee-collection">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="fee-collection">বেতন আদায়</TabsTrigger>
                    <TabsTrigger value="cashbook">ক্যাশবুক</TabsTrigger>
                    <TabsTrigger value="ledger">খতিয়ান</TabsTrigger>
                    <TabsTrigger value="new-transaction">নতুন লেনদেন</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fee-collection" className="mt-4">
                    <FeeCollectionTab onFeeCollected={fetchTransactions} />
                  </TabsContent>
                   <TabsContent value="cashbook" className="mt-4">
                    <CashbookTab transactions={transactions} isLoading={isLoading} refetch={fetchTransactions} />
                  </TabsContent>
                   <TabsContent value="ledger" className="mt-4">
                    <LedgerTab transactions={transactions} isLoading={isLoading} />
                  </TabsContent>
                   <TabsContent value="new-transaction" className="mt-4">
                    <NewTransactionTab onTransactionAdded={fetchTransactions} />
                  </TabsContent>
                </Tabs>
             ) : (
                <div>
                  {/* Skeleton Loader */}
                  <div className="grid w-full grid-cols-4 h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex justify-center"><Skeleton className="h-8 w-[80%]" /></div>
                    ))}
                  </div>
                   <div className="border rounded-md p-4">
                      <Skeleton className="h-8 w-1/4 mb-4" />
                       <Skeleton className="h-4 w-1/2 mb-6" />
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-6 w-16" /></TableHead>
                                    <TableHead><Skeleton className="h-6 w-32" /></TableHead>
                                    <TableHead><Skeleton className="h-6 w-32" /></TableHead>
                                    <TableHead className="text-right"><Skeleton className="h-6 w-24 ml-auto" /></TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {[...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                    <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-10 w-32 ml-auto" />
                                    </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                   </div>
                </div>
             )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
