'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { addStudent, Student } from '@/lib/student-data';
import { Checkbox } from '@/components/ui/checkbox';


export default function AddStudentPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [date, setDate] = useState<Date>()
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [studentClass, setStudentClass] = useState<string>('');
    const [gender, setGender] = useState<string>('');
    const [religion, setReligion] = useState<string>('');
    const [group, setGroup] = useState<string>('');

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
        const form = event.currentTarget;

        if (!photoPreview) {
            toast({
                variant: "destructive",
                title: "ছবি আবশ্যক",
                description: "অনুগ্রহ করে একটি ছবি আপলোড করুন।",
            });
            return;
        }

        if (!studentClass) {
            toast({
                variant: "destructive",
                title: "শ্রেণি আবশ্যক",
                description: "অনুগ্রহ করে একটি শ্রেণি নির্বাচন করুন।",
            });
            return;
        }
        
        const newStudentData: Omit<Student, 'id'> = {
            roll: parseInt((form.elements.namedItem('roll') as HTMLInputElement).value, 10),
            className: studentClass,
            group,
            studentNameBn: (form.elements.namedItem('student-name-bn') as HTMLInputElement).value,
            studentNameEn: (form.elements.namedItem('student-name-en') as HTMLInputElement).value,
            dob: date,
            birthRegNo: (form.elements.namedItem('birth-reg-no') as HTMLInputElement).value,
            gender,
            religion,
            photoUrl: photoPreview,
            fatherNameBn: (form.elements.namedItem('father-name-bn') as HTMLInputElement).value,
            fatherNameEn: (form.elements.namedItem('father-name-en') as HTMLInputElement).value,
            fatherNid: (form.elements.namedItem('father-nid') as HTMLInputElement).value,
            motherNameBn: (form.elements.namedItem('mother-name-bn') as HTMLInputElement).value,
            motherNameEn: (form.elements.namedItem('mother-name-en') as HTMLInputElement).value,
            motherNid: (form.elements.namedItem('mother-nid') as HTMLInputElement).value,
            guardianMobile: (form.elements.namedItem('guardian-mobile') as HTMLInputElement).value,
            studentMobile: (form.elements.namedItem('student-mobile') as HTMLInputElement).value,
            presentVillage: (form.elements.namedItem('present-village') as HTMLInputElement).value,
            presentUnion: (form.elements.namedItem('present-union') as HTMLInputElement).value,
            presentPostOffice: (form.elements.namedItem('present-post-office') as HTMLInputElement).value,
            presentUpazila: (form.elements.namedItem('present-upazila') as HTMLInputElement).value,
            presentDistrict: (form.elements.namedItem('present-district') as HTMLInputElement).value,
            permanentVillage: (form.elements.namedItem('permanent-village') as HTMLInputElement).value,
            permanentUnion: (form.elements.namedItem('permanent-union') as HTMLInputElement).value,
            permanentPostOffice: (form.elements.namedItem('permanent-post-office') as HTMLInputElement).value,
            permanentUpazila: (form.elements.namedItem('permanent-upazila') as HTMLInputElement).value,
            permanentDistrict: (form.elements.namedItem('permanent-district') as HTMLInputElement).value,
        };

        addStudent(newStudentData);

        toast({
            title: "শিক্ষার্থী যোগ হয়েছে",
            description: "নতুন শিক্ষার্থী সফলভাবে তালিকায় যোগ করা হয়েছে।",
        });

        router.push('/student-list');
    };

    const handleSameAddress = (checked: boolean | string) => {
        if (checked) {
            (document.getElementById('permanent-village') as HTMLInputElement).value = (document.getElementById('present-village') as HTMLInputElement).value;
            (document.getElementById('permanent-union') as HTMLInputElement).value = (document.getElementById('present-union') as HTMLInputElement).value;
            (document.getElementById('permanent-post-office') as HTMLInputElement).value = (document.getElementById('present-post-office') as HTMLInputElement).value;
            (document.getElementById('permanent-upazila') as HTMLInputElement).value = (document.getElementById('present-upazila') as HTMLInputElement).value;
            (document.getElementById('permanent-district') as HTMLInputElement).value = (document.getElementById('present-district') as HTMLInputElement).value;
        } else {
            (document.getElementById('permanent-village') as HTMLInputElement).value = '';
            (document.getElementById('permanent-union') as HTMLInputElement).value = '';
            (document.getElementById('permanent-post-office') as HTMLInputElement).value = '';
            (document.getElementById('permanent-upazila') as HTMLInputElement).value = '';
            (document.getElementById('permanent-district') as HTMLInputElement).value = '';
        }
    }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>নতুন শিক্ষার্থী যোগ করুন</CardTitle>
                    <CardDescription>নতুন শিক্ষার্থীর তথ্য পূরণ করুন।</CardDescription>
                </div>
                <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    Excel ফাইল আপলোড
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-8" onSubmit={handleSubmit}>
              
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">প্রাতিষ্ঠানিক তথ্য</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div className="space-y-2">
                          <Label htmlFor="roll">রোল নম্বর</Label>
                          <Input id="roll" name="roll" type="number" placeholder="রোল নম্বর" required />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="class">শ্রেণি</Label>
                          <Select required onValueChange={setStudentClass}>
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
                          <Select onValueChange={setGroup}>
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
                          <Input id="student-name-bn" name="student-name-bn" placeholder="শিক্ষার্থীর নাম বাংলায়" required />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="student-name-en">Name (English)</Label>
                          <Input id="student-name-en" name="student-name-en" placeholder="Student's name in English" />
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
                          <Input id="birth-reg-no" name="birth-reg-no" placeholder="জন্ম নিবন্ধন নম্বর" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="gender">লিঙ্গ</Label>
                          <Select onValueChange={setGender}>
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
                          <Select onValueChange={setReligion}>
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
                                  ছবি আপলোড করুন
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
                          <Input id="father-name-bn" name="father-name-bn" placeholder="পিতার নাম বাংলায়" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="father-name-en">Father's Name (English)</Label>
                          <Input id="father-name-en" name="father-name-en" placeholder="Father's name in English" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="father-nid">পিতার NID</Label>
                            <Input id="father-nid" name="father-nid" placeholder="পিতার NID নম্বর" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother-name-bn">মাতার নাম (বাংলা)</Label>
                          <Input id="mother-name-bn" name="mother-name-bn" placeholder="মাতার নাম বাংলায়" required/>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother-name-en">Mother's Name (English)</Label>
                          <Input id="mother-name-en" name="mother-name-en" placeholder="Mother's name in English" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mother-nid">মাতার NID</Label>
                            <Input id="mother-nid" name="mother-nid" placeholder="মাতার NID নম্বর" />
                        </div>
                   </div>
              </div>

               <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">যোগাযোগের তথ্য</h3>
                   <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                          <Label htmlFor="guardian-mobile">অভিভাবকের মোবাইল নম্বর</Label>
                          <Input id="guardian-mobile" name="guardian-mobile" placeholder="অভিভাবকের মোবাইল নম্বর" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="student-mobile">শিক্ষার্থীর মোবাইল নম্বর</Label>
                          <Input id="student-mobile" name="student-mobile" placeholder="শিক্ষার্থীর মোবাইল নম্বর (যদি থাকে)" />
                      </div>
                   </div>
               </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">বর্তমান ঠিকানা</h3>
                   <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="present-village">গ্রাম</Label>
                            <Input id="present-village" name="present-village" placeholder="গ্রাম" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="present-union">ইউনিয়ন</Label>
                            <Input id="present-union" name="present-union" placeholder="ইউনিয়ন" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="present-post-office">ডাকঘর</Label>
                            <Input id="present-post-office" name="present-post-office" placeholder="ডাকঘর" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="present-upazila">উপজেলা</Label>
                            <Input id="present-upazila" name="present-upazila" placeholder="উপজেলা" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="present-district">জেলা</Label>
                            <Input id="present-district" name="present-district" placeholder="জেলা" />
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
                            <Input id="permanent-village" name="permanent-village" placeholder="গ্রাম" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="permanent-union">ইউনিয়ন</Label>
                            <Input id="permanent-union" name="permanent-union" placeholder="ইউনিয়ন" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="permanent-post-office">ডাকঘর</Label>
                            <Input id="permanent-post-office" name="permanent-post-office" placeholder="ডাকঘর" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="permanent-upazila">উপজেলা</Label>
                            <Input id="permanent-upazila" name="permanent-upazila" placeholder="উপজেলা" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="permanent-district">জেলা</Label>
                            <Input id="permanent-district" name="permanent-district" placeholder="জেলা" />
                        </div>
                   </div>
               </div>

              <div className="flex justify-end pt-4 border-t mt-4">
                <Button type="submit">সেভ করুন</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
