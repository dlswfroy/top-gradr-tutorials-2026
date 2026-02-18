'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, Upload } from 'lucide-react';
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast"
import { getStudentById, updateStudent, deleteStudent, Student } from '@/lib/student-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export default function EditStudentPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    
    const studentId = parseInt(params.id as string, 10);

    const [studentNameBn, setStudentNameBn] = useState('');
    const [studentNameEn, setStudentNameEn] = useState('');
    const [fatherNameBn, setFatherNameBn] = useState('');
    const [fatherNameEn, setFatherNameEn] = useState('');
    const [motherNameBn, setMotherNameBn] = useState('');
    const [motherNameEn, setMotherNameEn] = useState('');
    const [date, setDate] = useState<Date | undefined>();
    const [studentClass, setStudentClass] = useState('');
    const [roll, setRoll] = useState<number | ''>('');
    const [mobile, setMobile] = useState('');
    const [address, setAddress] = useState('');
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (studentId) {
            const studentData = getStudentById(studentId);
            if (studentData) {
                setStudentNameBn(studentData.studentNameBn);
                setStudentNameEn(studentData.studentNameEn || '');
                setFatherNameBn(studentData.fatherNameBn);
                setFatherNameEn(studentData.fatherNameEn || '');
                setMotherNameBn(studentData.motherNameBn || '');
                setMotherNameEn(studentData.motherNameEn || '');
                setDate(studentData.dob);
                setStudentClass(studentData.className);
                setRoll(studentData.roll);
                setMobile(studentData.mobile || '');
                setAddress(studentData.address || '');
                setPhotoPreview(studentData.photoUrl);
                setIsLoading(false);
            } else {
                toast({
                    variant: "destructive",
                    title: "ছাত্র পাওয়া যায়নি",
                    description: "শিক্ষার্থীর তথ্য খুঁজে পাওয়া যায়নি।",
                });
                router.push('/student-list');
            }
        }
    }, [studentId, router, toast]);

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!photoPreview) {
            toast({
                variant: "destructive",
                title: "ছবি আবশ্যক",
                description: "অনুগ্রহ করে একটি ছবি আপলোড করুন।",
            });
            return;
        }

        const updatedStudentData: Omit<Student, 'id'> = {
            studentNameBn,
            studentNameEn,
            fatherNameBn,
            fatherNameEn,
            motherNameBn,
            motherNameEn,
            dob: date,
            className: studentClass,
            roll: Number(roll),
            mobile,
            address,
            photoUrl: photoPreview,
        };

        updateStudent(studentId, updatedStudentData);

        toast({
            title: "তথ্য আপডেট হয়েছে",
            description: "শিক্ষার্থীর তথ্য সফলভাবে আপডেট করা হয়েছে।",
        });

        router.push('/student-list');
    };

    const handleDelete = () => {
        deleteStudent(studentId);
        toast({
            title: "ছাত্র ডিলিট করা হয়েছে",
            description: "শিক্ষার্থীর তথ্য তালিকা থেকে মুছে ফেলা হয়েছে।",
        });
        router.push('/student-list');
    }

  if (isLoading) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center">
            <p>লোড হচ্ছে...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>শিক্ষার্থীর তথ্য এডিট করুন</CardTitle>
            <CardDescription>শিক্ষার্থীর তথ্য পরিবর্তন করুন।</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="student-name-bn">শিক্ষার্থীর নাম (বাংলা)</Label>
                <Input id="student-name-bn" name="student-name-bn" value={studentNameBn} onChange={(e) => setStudentNameBn(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-name-en">Student's Name (English)</Label>
                <Input id="student-name-en" name="student-name-en" value={studentNameEn} onChange={(e) => setStudentNameEn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father-name-bn">পিতার নাম (বাংলা)</Label>
                <Input id="father-name-bn" name="father-name-bn" value={fatherNameBn} onChange={(e) => setFatherNameBn(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father-name-en">Father's Name (English)</Label>
                <Input id="father-name-en" name="father-name-en" value={fatherNameEn} onChange={(e) => setFatherNameEn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mother-name-bn">মাতার নাম (বাংলা)</Label>
                <Input id="mother-name-bn" name="mother-name-bn" value={motherNameBn} onChange={(e) => setMotherNameBn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mother-name-en">Mother's Name (English)</Label>
                <Input id="mother-name-en" name="mother-name-en" value={motherNameEn} onChange={(e) => setMotherNameEn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">জন্ম তারিখ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>একটি তারিখ নির্বাচন করুন</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">শ্রেণি</Label>
                <Select required value={studentClass} onValueChange={setStudentClass}>
                  <SelectTrigger id="class" name="class">
                    <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">৬ষ্ঠ</SelectItem>
                    <SelectItem value="7">৭ম</SelectItem>
                    <SelectItem value="8">৮ম</SelectItem>
                    <SelectItem value="9">৯ম</SelectItem>
                    <SelectItem value="10">১০ম</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll">রোল নম্বর</Label>
                <Input id="roll" name="roll" type="number" value={roll} onChange={(e) => setRoll(e.target.value === '' ? '' : parseInt(e.target.value, 10))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">মোবাইল নম্বর</Label>
                <Input id="mobile" name="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">ঠিকানা</Label>
                <Textarea id="address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>ছবি</Label>
                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-md border flex items-center justify-center bg-muted overflow-hidden">
                        {photoPreview ? (
                            <Image src={photoPreview} alt="Student photo" width={96} height={96} className="object-cover w-full h-full" />
                        ) : (
                            <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
                                <Upload className="h-8 w-8" />
                                <span>ছবি</span>
                            </div>
                        )}
                    </div>
                    <Input id="photo" name="photo" type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('photo')?.click()}>
                        ছবি পরিবর্তন করুন
                    </Button>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-between items-center pt-4 border-t mt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">ডিলিট</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                      <AlertDialogDescription>
                        এই কাজটি ফিরিয়ে আনা যাবে না। এটি তালিকা থেকে স্থায়ীভাবে শিক্ষার্থীকে মুছে ফেলবে।
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>বাতিল</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>ডিলিট করুন</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button type="submit">আপডেট</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
