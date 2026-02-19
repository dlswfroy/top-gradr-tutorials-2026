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
import { useToast } from "@/hooks/use-toast"
import { getStaffById, updateStaff, deleteStaff, Staff, UpdateStaffData } from '@/lib/staff-data';
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
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';


export default function EditStaffPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const db = useFirestore();
    
    const staffId = params.id as string;

    const [staff, setStaff] = useState<Staff | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!staffId || !db) return;

        const fetchStaff = async () => {
            setIsLoading(true);
            const staffData = await getStaffById(db, staffId);
            if (staffData) {
                setStaff(staffData);
                setPhotoPreview(staffData.photoUrl);
            } else {
                toast({
                    variant: "destructive",
                    title: "রেকর্ড পাওয়া যায়নি",
                });
                router.push('/staff');
            }
            setIsLoading(false);
        }
        fetchStaff();
    }, [staffId, router, toast, db]);

    const handleInputChange = (field: keyof UpdateStaffData, value: any) => {
        if (!staff) return;
        setStaff({ ...staff, [field]: value });
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

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!staff || !db) {
            toast({ variant: "destructive", title: "ত্রুটি" });
            return;
        }

        const { id, ...updatedData } = staff;
        
        try {
            await updateStaff(db, staffId, updatedData);
            toast({
                title: "তথ্য আপডেট হয়েছে",
            });
            router.push('/staff');
        } catch (error) {
            toast({
                variant: "destructive",
                title: "আপডেট ব্যর্থ হয়েছে",
            });
        }
    };

    const handleDelete = async () => {
        if (!db) return;
        try {
            await deleteStaff(db, staffId);
            toast({
                title: "রেকর্ড ডিলিট করা হয়েছে",
            });
            router.push('/staff');
        } catch (error) {
            toast({
                variant: "destructive",
                title: "ডিলিট ব্যর্থ হয়েছে",
            });
        }
    }
    
  if (isLoading || !staff) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
             <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-80" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {[...Array(3)].map((_, i) => (
                                <div className="space-y-4" key={i}>
                                    <Skeleton className="h-7 w-48" />
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <div className="space-y-2"><Skeleton className="h-5 w-20" /><Skeleton className="h-10 w-full" /></div>
                                        <div className="space-y-2"><Skeleton className="h-5 w-20" /><Skeleton className="h-10 w-full" /></div>
                                        <div className="space-y-2"><Skeleton className="h-5 w-20" /><Skeleton className="h-10 w-full" /></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
             </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>শিক্ষক/কর্মচারীর তথ্য এডিট করুন</CardTitle>
            <CardDescription>প্রয়োজনীয় তথ্য পরিবর্তন করুন।</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">সাধারণ তথ্য</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div className="space-y-2">
                          <Label htmlFor="employeeId">কর্মচারী আইডি</Label>
                          <Input id="employeeId" name="employeeId" placeholder="কর্মচারী আইডি" required value={staff.employeeId} onChange={e => handleInputChange('employeeId', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="nameBn">নাম (বাংলা)</Label>
                          <Input id="nameBn" name="nameBn" placeholder="নাম বাংলায়" required value={staff.nameBn} onChange={e => handleInputChange('nameBn', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="nameEn">Name (English)</Label>
                          <Input id="nameEn" name="nameEn" placeholder="Name in English" value={staff.nameEn} onChange={e => handleInputChange('nameEn', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="designation">পদবি</Label>
                          <Input id="designation" name="designation" placeholder="পদবি" required value={staff.designation} onChange={e => handleInputChange('designation', e.target.value)} />
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
                          <Input id="subject" name="subject" placeholder="বিষয় (যদি প্রযোজ্য হয়)" value={staff.subject} onChange={e => handleInputChange('subject', e.target.value)} />
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="joinDate">যোগদানের তারিখ</Label>
                          <Popover>
                              <PopoverTrigger asChild>
                                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !staff.joinDate && "text-muted-foreground")}>
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {staff.joinDate ? format(new Date(staff.joinDate), "PPP") : <span>একটি তারিখ নির্বাচন করুন</span>}
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                  <Calendar mode="single" selected={staff.joinDate} onSelect={date => handleInputChange('joinDate', date as Date)} initialFocus />
                              </PopoverContent>
                          </Popover>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="education">শিক্ষাগত যোগ্যতা</Label>
                          <Input id="education" name="education" placeholder="সর্বোচ্চ শিক্ষাগত যোগ্যতা" value={staff.education} onChange={e => handleInputChange('education', e.target.value)} />
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
                          <Input id="mobile" name="mobile" placeholder="মোবাইল নম্বর" required value={staff.mobile} onChange={e => handleInputChange('mobile', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="email">ইমেইল</Label>
                          <Input id="email" name="email" type="email" placeholder="ইমেইল" value={staff.email} onChange={e => handleInputChange('email', e.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="address">ঠিকানা</Label>
                          <Textarea id="address" name="address" placeholder="বর্তমান ঠিকানা" value={staff.address} onChange={e => handleInputChange('address', e.target.value)} />
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
                                ছবি পরিবর্তন করুন
                            </Button>
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
                        এই কাজটি ফিরিয়ে আনা যাবে না।
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
