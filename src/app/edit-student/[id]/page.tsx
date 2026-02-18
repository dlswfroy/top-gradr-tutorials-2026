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
import { Calendar as CalendarIcon, Upload, FileUp } from 'lucide-react';
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getStudentById, updateStudent, deleteStudent, Student } from '@/lib/student-data';
import { Checkbox } from '@/components/ui/checkbox';
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

    const [isLoading, setIsLoading] = useState(true);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Form states
    const [roll, setRoll] = useState<number | ''>('');
    const [academicYear, setAcademicYear] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [group, setGroup] = useState('');
    const [studentNameBn, setStudentNameBn] = useState('');
    const [studentNameEn, setStudentNameEn] = useState('');
    const [date, setDate] = useState<Date | undefined>();
    const [birthRegNo, setBirthRegNo] = useState('');
    const [gender, setGender] = useState('');
    const [religion, setReligion] = useState('');
    const [fatherNameBn, setFatherNameBn] = useState('');
    const [fatherNameEn, setFatherNameEn] = useState('');
    const [fatherNid, setFatherNid] = useState('');
    const [motherNameBn, setMotherNameBn] = useState('');
    const [motherNameEn, setMotherNameEn] = useState('');
    const [motherNid, setMotherNid] = useState('');
    const [guardianMobile, setGuardianMobile] = useState('');
    const [studentMobile, setStudentMobile] = useState('');
    const [presentVillage, setPresentVillage] = useState('');
    const [presentUnion, setPresentUnion] = useState('');
    const [presentPostOffice, setPresentPostOffice] = useState('');
    const [presentUpazila, setPresentUpazila] = useState('');
    const [presentDistrict, setPresentDistrict] = useState('');
    const [permanentVillage, setPermanentVillage] = useState('');
    const [permanentUnion, setPermanentUnion] = useState('');
    const [permanentPostOffice, setPermanentPostOffice] = useState('');
    const [permanentUpazila, setPermanentUpazila] = useState('');
    const [permanentDistrict, setPermanentDistrict] = useState('');


    useEffect(() => {
        if (studentId) {
            const studentData = getStudentById(studentId);
            if (studentData) {
                setRoll(studentData.roll);
                setAcademicYear(studentData.academicYear || '');
                setStudentClass(studentData.className);
                setGroup(studentData.group || '');
                setStudentNameBn(studentData.studentNameBn);
                setStudentNameEn(studentData.studentNameEn || '');
                setDate(studentData.dob);
                setBirthRegNo(studentData.birthRegNo || '');
                setGender(studentData.gender || '');
                setReligion(studentData.religion || '');
                setPhotoPreview(studentData.photoUrl);
                setFatherNameBn(studentData.fatherNameBn);
                setFatherNameEn(studentData.fatherNameEn || '');
                setFatherNid(studentData.fatherNid || '');
                setMotherNameBn(studentData.motherNameBn || '');
                setMotherNameEn(studentData.motherNameEn || '');
                setMotherNid(studentData.motherNid || '');
                setGuardianMobile(studentData.guardianMobile || '');
                setStudentMobile(studentData.studentMobile || '');
                setPresentVillage(studentData.presentVillage || '');
                setPresentUnion(studentData.presentUnion || '');
                setPresentPostOffice(studentData.presentPostOffice || '');
                setPresentUpazila(studentData.presentUpazila || '');
                setPresentDistrict(studentData.presentDistrict || '');
                setPermanentVillage(studentData.permanentVillage || '');
                setPermanentUnion(studentData.permanentUnion || '');
                setPermanentPostOffice(studentData.permanentPostOffice || '');
                setPermanentUpazila(studentData.permanentUpazila || '');
                setPermanentDistrict(studentData.permanentDistrict || '');
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
            roll: Number(roll),
            academicYear,
            className: studentClass,
            group,
            studentNameBn,
            studentNameEn,
            dob: date,
            birthRegNo,
            gender,
            religion,
            photoUrl: photoPreview,
            fatherNameBn,
            fatherNameEn,
            fatherNid,
            motherNameBn,
            motherNameEn,
            motherNid,
            guardianMobile,
            studentMobile,
            presentVillage,
            presentUnion,
            presentPostOffice,
            presentUpazila,
            presentDistrict,
            permanentVillage,
            permanentUnion,
            permanentPostOffice,
            permanentUpazila,
            permanentDistrict,
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
    
    const handleSameAddress = (checked: boolean | string) => {
        if (checked) {
            setPermanentVillage(presentVillage);
            setPermanentUnion(presentUnion);
            setPermanentPostOffice(presentPostOffice);
            setPermanentUpazila(presentUpazila);
            setPermanentDistrict(presentDistrict);
        } else {
            setPermanentVillage('');
            setPermanentUnion('');
            setPermanentPostOffice('');
            setPermanentUpazila('');
            setPermanentDistrict('');
        }
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
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>শিক্ষার্থীর তথ্য এডিট করুন</CardTitle>
                    <CardDescription>শিক্ষার্থীর তথ্য পরিবর্তন করুন।</CardDescription>
                </div>
                 <Button variant="outline" disabled>
                    <FileUp className="mr-2 h-4 w-4" />
                    Excel ফাইল আপলোড
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-8" onSubmit={handleSubmit}>
              
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">প্রাতিষ্ঠানিক তথ্য</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                      <div className="space-y-2">
                          <Label htmlFor="roll">রোল নম্বর</Label>
                          <Input id="roll" name="roll" type="number" placeholder="রোল নম্বর" required value={roll} onChange={e => setRoll(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="academic-year">শিক্ষাবর্ষ</Label>
                          <Select required value={academicYear} onValueChange={setAcademicYear}>
                              <SelectTrigger id="academic-year" name="academic-year">
                                  <SelectValue placeholder="শিক্ষাবর্ষ নির্বাচন করুন" />
                              </SelectTrigger>
                              <SelectContent>
                                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                      <SelectItem key={year} value={String(year)}>{String(year).toLocaleString('bn-BD')}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
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
                          <Label htmlFor="group">গ্রুপ</Label>
                          <Select value={group} onValueChange={setGroup}>
                              <SelectTrigger id="group" name="group">
                                  <SelectValue placeholder="গ্রুপ নির্বাচন করুন (যদি থাকে)" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="science">বিজ্ঞান</SelectItem>
                                  <SelectItem value="arts">মানবিক</SelectItem>
                                  <SelectItem value="commerce">ব্যবসায় শিক্ষা</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">শিক্ষার্থীর তথ্য</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div className="space-y-2">
                          <Label htmlFor="student-name-bn">নাম (বাংলা)</Label>
                          <Input id="student-name-bn" name="student-name-bn" placeholder="শিক্ষার্থীর নাম বাংলায়" required value={studentNameBn} onChange={e => setStudentNameBn(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="student-name-en">Name (English)</Label>
                          <Input id="student-name-en" name="student-name-en" placeholder="Student's name in English" value={studentNameEn} onChange={e => setStudentNameEn(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="dob">জন্ম তারিখ</Label>
                          <Popover>
                              <PopoverTrigger asChild>
                                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {date ? format(date, "PPP") : <span>একটি তারিখ নির্বাচন করুন</span>}
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                              </PopoverContent>
                          </Popover>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="birth-reg-no">জন্ম নিবন্ধন নম্বর</Label>
                          <Input id="birth-reg-no" name="birth-reg-no" placeholder="জন্ম নিবন্ধন নম্বর" value={birthRegNo} onChange={e => setBirthRegNo(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="gender">লিঙ্গ</Label>
                          <Select value={gender} onValueChange={setGender}>
                              <SelectTrigger id="gender" name="gender"><SelectValue placeholder="লিঙ্গ নির্বাচন করুন" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="male">পুরুষ</SelectItem>
                                  <SelectItem value="female">মহিলা</SelectItem>
                                  <SelectItem value="other">অন্যান্য</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="religion">ধর্ম</Label>
                          <Select value={religion} onValueChange={setReligion}>
                              <SelectTrigger id="religion" name="religion"><SelectValue placeholder="ধর্ম নির্বাচন করুন" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="islam">ইসলাম</SelectItem>
                                  <SelectItem value="hinduism">হিন্দু</SelectItem>
                                  <SelectItem value="buddhism">বৌদ্ধ</SelectItem>
                                  <SelectItem value="christianity">খ্রিস্টান</SelectItem>
                                  <SelectItem value="other">অন্যান্য</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                       <div className="space-y-2 md:col-span-3">
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
                  </div>
              </div>
              
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">অভিভাবকের তথ্য</h3>
                   <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="father-name-bn">পিতার নাম (বাংলা)</Label>
                          <Input id="father-name-bn" name="father-name-bn" placeholder="পিতার নাম বাংলায়" required value={fatherNameBn} onChange={e => setFatherNameBn(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="father-name-en">Father's Name (English)</Label>
                          <Input id="father-name-en" name="father-name-en" placeholder="Father's name in English" value={fatherNameEn} onChange={e => setFatherNameEn(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="father-nid">পিতার NID</Label>
                            <Input id="father-nid" name="father-nid" placeholder="পিতার NID নম্বর" value={fatherNid} onChange={e => setFatherNid(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother-name-bn">মাতার নাম (বাংলা)</Label>
                          <Input id="mother-name-bn" name="mother-name-bn" placeholder="মাতার নাম বাংলায়" required value={motherNameBn} onChange={e => setMotherNameBn(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother-name-en">Mother's Name (English)</Label>
                          <Input id="mother-name-en" name="mother-name-en" placeholder="Mother's name in English" value={motherNameEn} onChange={e => setMotherNameEn(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mother-nid">মাতার NID</Label>
                            <Input id="mother-nid" name="mother-nid" placeholder="মাতার NID নম্বর" value={motherNid} onChange={e => setMotherNid(e.target.value)} />
                        </div>
                   </div>
              </div>

               <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">যোগাযোগের তথ্য</h3>
                   <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                          <Label htmlFor="guardian-mobile">অভিভাবকের মোবাইল নম্বর</Label>
                          <Input id="guardian-mobile" name="guardian-mobile" placeholder="অভিভাবকের মোবাইল নম্বর" value={guardianMobile} onChange={e => setGuardianMobile(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="student-mobile">শিক্ষার্থীর মোবাইল নম্বর</Label>
                          <Input id="student-mobile" name="student-mobile" placeholder="শিক্ষার্থীর মোবাইল নম্বর (যদি থাকে)" value={studentMobile} onChange={e => setStudentMobile(e.target.value)} />
                      </div>
                   </div>
               </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">বর্তমান ঠিকানা</h3>
                   <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="present-village">গ্রাম</Label>
                            <Input id="present-village" name="present-village" placeholder="গ্রাম" value={presentVillage} onChange={e => setPresentVillage(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="present-union">ইউনিয়ন</Label>
                            <Input id="present-union" name="present-union" placeholder="ইউনিয়ন" value={presentUnion} onChange={e => setPresentUnion(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="present-post-office">ডাকঘর</Label>
                            <Input id="present-post-office" name="present-post-office" placeholder="ডাকঘর" value={presentPostOffice} onChange={e => setPresentPostOffice(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="present-upazila">উপজেলা</Label>
                            <Input id="present-upazila" name="present-upazila" placeholder="উপজেলা" value={presentUpazila} onChange={e => setPresentUpazila(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="present-district">জেলা</Label>
                            <Input id="present-district" name="present-district" placeholder="জেলা" value={presentDistrict} onChange={e => setPresentDistrict(e.target.value)} />
                        </div>
                   </div>
               </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-semibold text-lg">স্থায়ী ঠিকানা</h3>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="same-as-present" onCheckedChange={handleSameAddress} />
                            <label
                                htmlFor="same-as-present"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                বর্তমান ঠিকানার অনুরূপ
                            </label>
                        </div>
                    </div>
                   <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="permanent-village">গ্রাম</Label>
                            <Input id="permanent-village" name="permanent-village" placeholder="গ্রাম" value={permanentVillage} onChange={e => setPermanentVillage(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="permanent-union">ইউনিয়ন</Label>
                            <Input id="permanent-union" name="permanent-union" placeholder="ইউনিয়ন" value={permanentUnion} onChange={e => setPermanentUnion(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="permanent-post-office">ডাকঘর</Label>
                            <Input id="permanent-post-office" name="permanent-post-office" placeholder="ডাকঘর" value={permanentPostOffice} onChange={e => setPermanentPostOffice(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="permanent-upazila">উপজেলা</Label>
                            <Input id="permanent-upazila" name="permanent-upazila" placeholder="উপজেলা" value={permanentUpazila} onChange={e => setPermanentUpazila(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="permanent-district">জেলা</Label>
                            <Input id="permanent-district" name="permanent-district" placeholder="জেলা" value={permanentDistrict} onChange={e => setPermanentDistrict(e.target.value)} />
                        </div>
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
                <Button type="submit">আপডেট করুন</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
