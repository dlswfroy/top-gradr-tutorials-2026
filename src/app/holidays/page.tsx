'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { format } from "date-fns";
import { bn } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { addHoliday, getHolidays, deleteHoliday, Holiday } from '@/lib/holiday-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function HolidaysPage() {
    const { toast } = useToast();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [newHolidayDate, setNewHolidayDate] = useState<Date | undefined>(undefined);
    const [newHolidayDescription, setNewHolidayDescription] = useState('');

    useEffect(() => {
        setHolidays(getHolidays());
    }, []);

    const handleAddHoliday = () => {
        if (!newHolidayDate || !newHolidayDescription) {
            toast({
                variant: 'destructive',
                title: 'তথ্য অসম্পূর্ণ',
                description: 'অনুগ্রহ করে তারিখ এবং ছুটির কারণ উল্লেখ করুন।',
            });
            return;
        }

        const holidayData = {
            date: format(newHolidayDate, 'yyyy-MM-dd'),
            description: newHolidayDescription,
        };

        const result = addHoliday(holidayData);

        if (result) {
            toast({
                title: 'ছুটি যোগ হয়েছে',
                description: `${format(newHolidayDate, 'd MMMM yyyy', { locale: bn })} তারিখটি ছুটির তালিকাভুক্ত হয়েছে।`,
            });
            setHolidays(getHolidays());
            setNewHolidayDate(undefined);
            setNewHolidayDescription('');
        } else {
            toast({
                variant: 'destructive',
                title: 'ছুটি যোগ করা যায়নি',
                description: 'এই তারিখে ইতিমধ্যে একটি ছুটি রয়েছে।',
            });
        }
    };

    const handleDeleteHoliday = (id: number) => {
        deleteHoliday(id);
        toast({
            title: 'ছুটি মুছে ফেলা হয়েছে',
            description: 'নির্বাচিত ছুটিটি তালিকা থেকে মুছে ফেলা হয়েছে।',
        });
        setHolidays(getHolidays());
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>অতিরিক্ত ছুটির দিন</CardTitle>
                        <CardDescription>বিশেষ কারণে স্কুল বন্ধ থাকলে সেই দিনগুলো এখানে যোগ করুন।</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex flex-col sm:flex-row items-end gap-4 p-4 border rounded-lg">
                            <div className="w-full space-y-2">
                                <Label htmlFor="holiday-date">তারিখ</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="holiday-date"
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !newHolidayDate && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newHolidayDate ? format(newHolidayDate, "PPP") : <span>একটি তারিখ নির্বাচন করুন</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={newHolidayDate}
                                            onSelect={setNewHolidayDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="w-full space-y-2">
                                <Label htmlFor="holiday-description">ছুটির কারণ</Label>
                                <Input
                                    id="holiday-description"
                                    placeholder="যেমন: বিশেষ উৎসব"
                                    value={newHolidayDescription}
                                    onChange={(e) => setNewHolidayDescription(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleAddHoliday} className="w-full sm:w-auto">যোগ করুন</Button>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-4">ছুটির তালিকা</h3>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>তারিখ</TableHead>
                                            <TableHead>কারণ</TableHead>
                                            <TableHead className="text-right">কার্যক্রম</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {holidays.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                    কোনো অতিরিক্ত ছুটি যোগ করা হয়নি।
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            holidays.map((holiday) => (
                                                <TableRow key={holiday.id}>
                                                    <TableCell>{format(new Date(holiday.date), "d MMMM yyyy", { locale: bn })}</TableCell>
                                                    <TableCell>{holiday.description}</TableCell>
                                                    <TableCell className="text-right">
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="destructive" size="icon">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        এই ছুটিটি তালিকা থেকে স্থায়ীভাবে মুছে যাবে।
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteHoliday(holiday.id)}>
                                                                        মুছে ফেলুন
                                                                    </AlertDialogAction>
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
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
