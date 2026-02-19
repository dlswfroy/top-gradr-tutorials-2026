'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { addStaff, NewStaffData } from '@/lib/staff-data';
import { useFirestore } from '@/firebase';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';

const initialStaffState: NewStaffData = {
  employeeId: '',
  nameBn: '',
  nameEn: '',
  designation: '',
  subject: '',
  mobile: '',
  email: '',
  joinDate: new Date(),
  education: '',
  address: '',
  photoUrl: '',
  isActive: true,
  staffType: 'teacher',
};

export default function AddStaffPage() {
    const router = useRouter();
    const { toast } = useToast();
    const db = useFirestore();
    
    const [staff, setStaff] = useState<NewStaffData>(initialStaffState);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleInputChange = (field: keyof NewStaffData, value: string | Date | boolean | undefined) => {
        setStaff(prev => ({...prev, [field]: value}));
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
        if(!db) return;

        if (!staff.photoUrl) {
            toast({
                variant: "destructive",
                title: "ছবি আবশ্যক",
                description: "অনুগ্রহ করে একটি ছবি আপলোড করুন।",
            });
            return;
        }
        
        addStaff(db, staff).then(() => {
            toast({
                title: "রেকর্ড যোগ হয়েছে",
                description: "নতুন শিক্ষক/কর্মচারীর তথ্য সফলভাবে তালিকায় যোগ করা হয়েছে।",
            });
            router.push('/staff');
        }).catch(() => {
            // FirebaseErrorListener will handle the toast.
        });
    };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>নতুন শিক্ষক/কর্মচারী যোগ করুন</CardTitle>
          </CardHeader>
          <CardContent>
            {isClient ? (
              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">সাধারণ তথ্য</h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="employeeId">কর্মচারী আইডি</Label>
                            <Input id="employeeId" name="employeeId" required value={staff.employeeId} onChange={e => handleInputChange('employeeId', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nameBn">নাম (বাংলা)</Label>
                            <Input id="nameBn" name="nameBn" required value={staff.nameBn} onChange={e => handleInputChange('nameBn', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nameEn">Name (English)</Label>
                            <Input id="nameEn" name="nameEn" value={staff.nameEn} onChange={e => handleInputChange('nameEn', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="designation">পদবি</Label>
                            <Input id="designation" name="designation" required value={staff.designation} onChange={e => handleInputChange('designation', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="staffType">ধরণ</Label>
                            <Select required value={staff.staffType} onValueChange={(value: 'teacher' | 'staff') => handleInputChange('staffType', value)}>
                                <SelectTrigger id="staffType" name="staffType"><SelectValue placeholder="ধরণ নির্বাচন করুন" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="teacher">শিক্ষক</SelectItem>
                                    <SelectItem value="staff">কর্মচারী</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">বিষয়</Label>
                            <Input id="subject" name="subject" value={staff.subject} onChange={e => handleInputChange('subject', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="joinDate">যোগদানের তারিখ</Label>
                            <DatePicker value={staff.joinDate} onChange={date => handleInputChange('joinDate', date)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="education">শিক্ষাগত যোগ্যতা</Label>
                            <Input id="education" name="education" value={staff.education} onChange={e => handleInputChange('education', e.target.value)} />
                        </div>
                        <div className="flex items-center space-x-2">
                              <Switch id="isActive" checked={staff.isActive} onCheckedChange={checked => handleInputChange('isActive', checked)} />
                              <Label htmlFor="isActive">সক্রিয়</Label>
                          </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">যোগাযোগ ও অন্যান্য</h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="mobile">মোবাইল নম্বর</Label>
                            <Input id="mobile" name="mobile" required value={staff.mobile} onChange={e => handleInputChange('mobile', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">ইমেইল</Label>
                            <Input id="email" name="email" type="email" value={staff.email} onChange={e => handleInputChange('email', e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">ঠিকানা</Label>
                            <Textarea id="address" name="address" value={staff.address} onChange={e => handleInputChange('address', e.target.value)} />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">ছবি</h3>
                      <div className="space-y-2">
                          <div className="flex items-center gap-4">
                              <div className="w-24 h-24 rounded-md border flex items-center justify-center bg-muted overflow-hidden">
                                  {photoPreview ? (
                                      <Image src={photoPreview} alt="Staff photo" width={96} height={96} className="object-cover w-full h-full" />
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

                <div className="flex justify-end pt-4 border-t mt-4">
                  <Button type="submit">সেভ করুন</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                    <Skeleton className="h-7 w-48" />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-7 w-48" />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-2"><Skeleton className="h-5 w-20" /><Skeleton className="h-10 w-full" /></div>
                          <div className="space-y-2"><Skeleton className="h-5 w-20" /><Skeleton className="h-10 w-full" /></div>
                          <div className="space-y-2 md:col-span-2"><Skeleton className="h-5 w-20" /><Skeleton className="h-20 w-full" /></div>
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-7 w-24" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-24 w-24 rounded-md" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                <div className="flex justify-end pt-4 border-t mt-4">
                    <Skeleton className="h-10 w-24" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
