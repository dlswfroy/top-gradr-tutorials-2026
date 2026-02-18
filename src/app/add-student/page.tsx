'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, Upload, FileUp, Download } from 'lucide-react';
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { addStudent, getStudents, updateStudent, Student } from '@/lib/student-data';
import { Checkbox } from '@/components/ui/checkbox';
import { useAcademicYear } from '@/context/AcademicYearContext';

const initialStudentState: Partial<Omit<Student, 'id'>> = {
  roll: undefined,
  className: '',
  academicYear: '',
  group: '',
  studentNameBn: '',
  studentNameEn: '',
  dob: undefined,
  birthRegNo: '',
  gender: '',
  religion: '',
  photoUrl: '',
  fatherNameBn: '',
  fatherNameEn: '',
  fatherNid: '',
  motherNameBn: '',
  motherNameEn: '',
  motherNid: '',
  guardianMobile: '',
  studentMobile: '',
  presentVillage: '',
  presentUnion: '',
  presentPostOffice: '',
  presentUpazila: '',
  presentDistrict: '',
  permanentVillage: '',
  permanentUnion: '',
  permanentPostOffice: '',
  permanentUpazila: '',
  permanentDistrict: '',
};

export default function AddStudentPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { selectedYear, availableYears } = useAcademicYear();
    
    const [student, setStudent] = useState(initialStudentState);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectedYear) {
            setStudent(prev => ({...prev, academicYear: selectedYear}));
        }
    }, [selectedYear]);

    const handleInputChange = (field: keyof Omit<Student, 'id'>, value: string | number | Date | undefined) => {
        setStudent(prev => ({...prev, [field]: value}));
    };

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPhotoPreview(result);
                handleInputChange('photoUrl', result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!student.photoUrl) {
            toast({
                variant: "destructive",
                title: "ছবি আবশ্যক",
                description: "অনুগ্রহ করে একটি ছবি আপলোড করুন।",
            });
            return;
        }

        if (!student.academicYear) {
            toast({
                variant: "destructive",
                title: "শিক্ষাবর্ষ আবশ্যক",
                description: "অনুগ্রহ করে একটি শিক্ষাবর্ষ নির্বাচন করুন।",
            });
            return;
        }

        if (!student.className) {
            toast({
                variant: "destructive",
                title: "শ্রেণি আবশ্যক",
                description: "অনুগ্রহ করে একটি শ্রেণি নির্বাচন করুন।",
            });
            return;
        }
        
        addStudent(student as Omit<Student, 'id'>);

        toast({
            title: "শিক্ষার্থী যোগ হয়েছে",
            description: "নতুন শিক্ষার্থী সফলভাবে তালিকায় যোগ করা হয়েছে।",
        });

        router.push('/student-list');
    };

    const handleSameAddress = (checked: boolean | string) => {
        if (checked) {
            setStudent(prev => ({
                ...prev,
                permanentVillage: prev.presentVillage,
                permanentUnion: prev.presentUnion,
                permanentPostOffice: prev.presentPostOffice,
                permanentUpazila: prev.presentUpazila,
                permanentDistrict: prev.presentDistrict,
            }));
        } else {
            setStudent(prev => ({
                ...prev,
                permanentVillage: '',
                permanentUnion: '',
                permanentPostOffice: '',
                permanentUpazila: '',
                permanentDistrict: '',
            }));
        }
    }

    const handleDownloadSample = () => {
        const headers = [
            ['রোল', 'শ্রেণি', 'গ্রুপ', 'নাম (বাংলা)', 'নাম (ইংরেজি)', 'জন্ম তারিখ', 'জন্ম নিবন্ধন নম্বর', 'লিঙ্গ', 'ধর্ম', 'পিতার নাম (বাংলা)', 'পিতার নাম (ইংরেজি)', 'পিতার NID', 'মাতার নাম (বাংলা)', 'মাতার নাম (ইংরেজি)', 'মাতার NID', 'মোবাইল', 'শিক্ষার্থীর মোবাইল নম্বর', 'বর্তমান গ্রাম', 'বর্তমান ইউনিয়ন', 'বর্তমান ডাকঘর', 'বর্তমান উপজেলা', 'বর্তমান জেলা', 'স্থায়ী গ্রাম', 'স্থায়ী ইউনিয়ন', 'স্থায়ী ডাকঘর', 'স্থায়ী উপজেলা', 'স্থায়ী জেলা']
        ];
        const ws = XLSX.utils.aoa_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'নমুনা');
        XLSX.writeFile(wb, 'student_sample.xlsx');
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    toast({
                        variant: "destructive",
                        title: "ফাইল খালি",
                        description: "আপনার আপলোড করা ফাইলে কোনো তথ্য নেই।",
                    });
                    return;
                }

                const headerMapping: { [key: string]: keyof Omit<Student, 'id' | 'photoUrl' > } = {
                    'রোল': 'roll', 'শ্রেণি': 'className', 'গ্রুপ': 'group', 'নাম (বাংলা)': 'studentNameBn', 'নাম (ইংরেজি)': 'studentNameEn', 'জন্ম তারিখ': 'dob', 'জন্ম নিবন্ধন নম্বর': 'birthRegNo', 'লিঙ্গ': 'gender', 'ধর্ম': 'religion', 'পিতার নাম (বাংলা)': 'fatherNameBn', 'পিতার নাম (ইংরেজি)': 'fatherNameEn', 'পিতার NID': 'fatherNid', 'মাতার নাম (বাংলা)': 'motherNameBn', 'মাতার নাম (ইংরেজি)': 'motherNameEn', 'মাতার NID': 'motherNid', 'মোবাইল': 'guardianMobile', 'শিক্ষার্থীর মোবাইল নম্বর': 'studentMobile', 'বর্তমান গ্রাম': 'presentVillage', 'বর্তমান ইউনিয়ন': 'presentUnion', 'বর্তমান ডাকঘর': 'presentPostOffice', 'বর্তমান উপজেলা': 'presentUpazila', 'বর্তমান জেলা': 'presentDistrict', 'স্থায়ী গ্রাম': 'permanentVillage', 'স্থায়ী ইউনিয়ন': 'permanentUnion', 'স্থায়ী ডাকঘর': 'permanentPostOffice', 'স্থায়ী উপজেলা': 'permanentUpazila', 'স্থায়ী জেলা': 'permanentDistrict',
                };
                
                const englishToBengaliHeaderMap = Object.fromEntries(Object.entries(headerMapping).map(([k, v]) => [v, k]));
                
                const genderMap: { [key: string]: string } = { 'পুরুষ': 'male', 'মহিলা': 'female', 'অন্যান্য': 'other' };
                const religionMap: { [key: string]: string } = { 'ইসলাম': 'islam', 'হিন্দু': 'hinduism', 'বৌদ্ধ': 'buddhism', 'খ্রিস্টান': 'christianity', 'অন্যান্য': 'other' };
                const groupMap: { [key:string]: string } = { 'বিজ্ঞান': 'science', 'মানবিক': 'arts', 'ব্যবসায় শিক্ষা': 'commerce' };


                const allStudents = getStudents();
                let addedCount = 0;
                let updatedCount = 0;
                const processingErrors: string[] = [];

                json.forEach((row: any, index: number) => {
                    try {
                        const newStudentData: Partial<Student> = {};
                        Object.keys(row).forEach(excelHeader => {
                            const studentKey = headerMapping[excelHeader.trim()];
                            if (studentKey) {
                                let value = row[excelHeader];
                                
                                if (value && typeof value === 'string') {
                                    value = value.trim();
                                } else if (value && typeof value === 'number') {
                                    value = String(value);
                                }

                                if (studentKey === 'gender' && value) {
                                    (newStudentData as any)[studentKey] = genderMap[value] || value;
                                } else if (studentKey === 'religion' && value) {
                                    (newStudentData as any)[studentKey] = religionMap[value] || value;
                                } else if (studentKey === 'group' && value) {
                                    (newStudentData as any)[studentKey] = groupMap[value] || value;
                                } else if (studentKey === 'dob' && value && !(value instanceof Date)) {
                                    // Handle string or number dates from excel if cellDates:true fails
                                    const date = new Date(value);
                                    if (!isNaN(date.getTime())) {
                                        newStudentData.dob = date;
                                    } else {
                                        (newStudentData as any)[studentKey] = value;
                                    }
                                }
                                else {
                                    (newStudentData as any)[studentKey] = value;
                                }
                            }
                        });

                        newStudentData.academicYear = selectedYear;
                        if (newStudentData.roll) newStudentData.roll = Number(newStudentData.roll);
                        if (newStudentData.className) newStudentData.className = String(newStudentData.className);

                        const requiredFields: (keyof Student)[] = ['roll', 'className', 'studentNameBn', 'fatherNameBn', 'motherNameBn', 'academicYear'];
                        const missingFields = requiredFields.filter(field => !newStudentData[field]);

                        if (missingFields.length > 0) {
                            const missingHeaders = missingFields.map(field => englishToBengaliHeaderMap[field as keyof typeof englishToBengaliHeaderMap]).join(', ');
                            throw new Error(`সারি ${index + 2}: আবশ্যকীয় তথ্য অনুপস্থিত: ${missingHeaders}`);
                        }

                        const existingStudent = allStudents.find(
                            s => s.roll === newStudentData.roll &&
                                 s.className === newStudentData.className &&
                                 s.academicYear === newStudentData.academicYear
                        );

                        if (existingStudent) {
                            const dataToUpdate = { ...existingStudent, ...newStudentData };
                            updateStudent(existingStudent.id, dataToUpdate);
                            updatedCount++;
                        } else {
                            newStudentData.photoUrl = `https://picsum.photos/seed/${newStudentData.roll || Math.random()}/96/96`;
                            addStudent(newStudentData as Omit<Student, 'id'>);
                            addedCount++;
                        }
                    } catch (rowError: any) {
                        processingErrors.push(rowError.message);
                    }
                });

                if (processingErrors.length > 0) {
                    throw new Error(processingErrors.join('\n'));
                }
                
                toast({
                    title: "প্রসেসিং সম্পন্ন",
                    description: `${addedCount} জন নতুন শিক্ষার্থী যোগ হয়েছে এবং ${updatedCount} জনের তথ্য আপডেট হয়েছে।`,
                });

                router.push('/student-list');

            } catch (error: any) {
                console.error("File upload error:", error);
                toast({
                    variant: "destructive",
                    title: "ফাইল আপলোড ব্যর্থ হয়েছে",
                    description: error.message || "দয়া করে ফাইলের ফরম্যাট এবং আবশ্যকীয় তথ্য ঠিক আছে কিনা তা পরীক্ষা করুন।",
                    duration: 10000, // Show error for longer
                });
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div>
                    <CardTitle>নতুন শিক্ষার্থী যোগ করুন</CardTitle>
                    <CardDescription>নতুন শিক্ষার্থীর তথ্য পূরণ করুন।</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleDownloadSample}>
                        <Download className="mr-2 h-4 w-4" />
                        নমুনা ফাইল
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <FileUp className="mr-2 h-4 w-4" />
                        Excel ফাইল আপলোড
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-8" onSubmit={handleSubmit}>
              
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">প্রাতিষ্ঠানিক তথ্য</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                      <div className="space-y-2">
                          <Label htmlFor="roll">রোল নম্বর</Label>
                          <Input id="roll" name="roll" type="number" placeholder="রোল নম্বর" required value={student.roll || ''} onChange={e => handleInputChange('roll', e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="academic-year">শিক্ষাবর্ষ</Label>
                          <Select required value={student.academicYear || ''} onValueChange={value => handleInputChange('academicYear', value)}>
                              <SelectTrigger id="academic-year" name="academic-year">
                                  <SelectValue placeholder="শিক্ষাবর্ষ নির্বাচন করুন" />
                              </SelectTrigger>
                              <SelectContent>
                                  {availableYears.map(year => (
                                      <SelectItem key={year} value={String(year)}>{String(year).toLocaleString('bn-BD')}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="class">শ্রেণি</Label>
                          <Select required value={student.className} onValueChange={value => handleInputChange('className', value)}>
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
                          <Select value={student.group} onValueChange={value => handleInputChange('group', value)}>
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
                          <Input id="student-name-bn" name="student-name-bn" placeholder="শিক্ষার্থীর নাম বাংলায়" required value={student.studentNameBn} onChange={e => handleInputChange('studentNameBn', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="student-name-en">Name (English)</Label>
                          <Input id="student-name-en" name="student-name-en" placeholder="Student's name in English" value={student.studentNameEn} onChange={e => handleInputChange('studentNameEn', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="dob">জন্ম তারিখ</Label>
                          <Popover>
                              <PopoverTrigger asChild>
                                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !student.dob && "text-muted-foreground")}>
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {student.dob ? format(new Date(student.dob), "PPP") : <span>একটি তারিখ নির্বাচন করুন</span>}
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                  <Calendar mode="single" selected={student.dob} onSelect={date => handleInputChange('dob', date)} initialFocus />
                              </PopoverContent>
                          </Popover>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="birth-reg-no">জন্ম নিবন্ধন নম্বর</Label>
                          <Input id="birth-reg-no" name="birth-reg-no" placeholder="জন্ম নিবন্ধন নম্বর" value={student.birthRegNo} onChange={e => handleInputChange('birthRegNo', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="gender">লিঙ্গ</Label>
                          <Select value={student.gender} onValueChange={value => handleInputChange('gender', value)}>
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
                          <Select value={student.religion} onValueChange={value => handleInputChange('religion', value)}>
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
                          <Input id="father-name-bn" name="father-name-bn" placeholder="পিতার নাম বাংলায়" required value={student.fatherNameBn} onChange={e => handleInputChange('fatherNameBn', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="father-name-en">Father's Name (English)</Label>
                          <Input id="father-name-en" name="father-name-en" placeholder="Father's name in English" value={student.fatherNameEn} onChange={e => handleInputChange('fatherNameEn', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="father-nid">পিতার NID</Label>
                            <Input id="father-nid" name="father-nid" placeholder="পিতার NID নম্বর" value={student.fatherNid} onChange={e => handleInputChange('fatherNid', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother-name-bn">মাতার নাম (বাংলা)</Label>
                          <Input id="mother-name-bn" name="mother-name-bn" placeholder="মাতার নাম বাংলায়" required value={student.motherNameBn} onChange={e => handleInputChange('motherNameBn', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother-name-en">Mother's Name (English)</Label>
                          <Input id="mother-name-en" name="mother-name-en" placeholder="Mother's name in English" value={student.motherNameEn} onChange={e => handleInputChange('motherNameEn', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mother-nid">মাতার NID</Label>
                            <Input id="mother-nid" name="mother-nid" placeholder="মাতার NID নম্বর" value={student.motherNid} onChange={e => handleInputChange('motherNid', e.target.value)} />
                        </div>
                   </div>
              </div>

               <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">যোগাযোগের তথ্য</h3>
                   <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                          <Label htmlFor="guardian-mobile">অভিভাবকের মোবাইল নম্বর</Label>
                          <Input id="guardian-mobile" name="guardian-mobile" placeholder="অভিভাবকের মোবাইল নম্বর" value={student.guardianMobile} onChange={e => handleInputChange('guardianMobile', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="student-mobile">শিক্ষার্থীর মোবাইল নম্বর</Label>
                          <Input id="student-mobile" name="student-mobile" placeholder="শিক্ষার্থীর মোবাইল নম্বর (যদি থাকে)" value={student.studentMobile} onChange={e => handleInputChange('studentMobile', e.target.value)} />
                      </div>
                   </div>
               </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">বর্তমান ঠিকানা</h3>
                   <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="present-village">গ্রাম</Label>
                            <Input id="present-village" name="present-village" placeholder="গ্রাম" value={student.presentVillage} onChange={e => handleInputChange('presentVillage', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="present-union">ইউনিয়ন</Label>
                            <Input id="present-union" name="present-union" placeholder="ইউনিয়ন" value={student.presentUnion} onChange={e => handleInputChange('presentUnion', e.target.value)} />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="present-post-office">ডাকঘর</Label>
                                <Input id="present-post-office" name="present-post-office" placeholder="ডাকঘর" value={student.presentPostOffice} onChange={e => handleInputChange('presentPostOffice', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="present-upazila">উপজেলা</Label>
                                <Input id="present-upazila" name="present-upazila" placeholder="উপজেলা" value={student.presentUpazila} onChange={e => handleInputChange('presentUpazila', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="present-district">জেলা</Label>
                                <Input id="present-district" name="present-district" placeholder="জেলা" value={student.presentDistrict} onChange={e => handleInputChange('presentDistrict', e.target.value)} />
                            </div>
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
                   <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="permanent-village">গ্রাম</Label>
                            <Input id="permanent-village" name="permanent-village" placeholder="গ্রাম" value={student.permanentVillage} onChange={e => handleInputChange('permanentVillage', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="permanent-union">ইউনিয়ন</Label>
                            <Input id="permanent-union" name="permanent-union" placeholder="ইউনিয়ন" value={student.permanentUnion} onChange={e => handleInputChange('permanentUnion', e.target.value)} />
                        </div>
                         <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="permanent-post-office">ডাকঘর</Label>
                                <Input id="permanent-post-office" name="permanent-post-office" placeholder="ডাকঘর" value={student.permanentPostOffice} onChange={e => handleInputChange('permanentPostOffice', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="permanent-upazila">উপজেলা</Label>
                                <Input id="permanent-upazila" name="permanent-upazila" placeholder="উপজেলা" value={student.permanentUpazila} onChange={e => handleInputChange('permanentUpazila', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="permanent-district">জেলা</Label>
                                <Input id="permanent-district" name="permanent-district" placeholder="জেলা" value={student.permanentDistrict} onChange={e => handleInputChange('permanentDistrict', e.target.value)} />
                            </div>
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
