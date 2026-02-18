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
import { Calendar as CalendarIcon, Upload } from 'lucide-react';
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast"


export default function AddStudentPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [date, setDate] = useState<Date>()
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
        // Here you would typically handle form data submission to a server/database
        console.log("Form submitted");

        toast({
            title: "শিক্ষার্থী যোগ হয়েছে",
            description: "নতুন শিক্ষার্থী সফলভাবে তালিকায় যোগ করা হয়েছে।",
        });

        // Redirect to the student list page
        router.push('/student-list');
    };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>নতুন শিক্ষার্থী যোগ করুন</CardTitle>
            <CardDescription>নতুন শিক্ষার্থীর তথ্য পূরণ করুন।</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="student-name-bn">শিক্ষার্থীর নাম (বাংলা)</Label>
                <Input id="student-name-bn" placeholder="শিক্ষার্থীর নাম বাংলায় লিখুন" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-name-en">Student's Name (English)</Label>
                <Input id="student-name-en" placeholder="Enter student's name in English" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father-name-bn">পিতার নাম (বাংলা)</Label>
                <Input id="father-name-bn" placeholder="পিতার নাম বাংলায় লিখুন" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father-name-en">Father's Name (English)</Label>
                <Input id="father-name-en" placeholder="Enter father's name in English" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mother-name-bn">মাতার নাম (বাংলা)</Label>
                <Input id="mother-name-bn" placeholder="মাতার নাম বাংলায় লিখুন" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mother-name-en">Mother's Name (English)</Label>
                <Input id="mother-name-en" placeholder="Enter mother's name in English" />
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
                <Select required>
                  <SelectTrigger id="class">
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
                <Input id="roll" type="number" placeholder="রোল নম্বর লিখুন" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">মোবাইল নম্বর</Label>
                <Input id="mobile" placeholder="মোবাইল নম্বর লিখুন" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">ঠিকানা</Label>
                <Textarea id="address" placeholder="ঠিকানা লিখুন" />
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
                    <Input id="photo" type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('photo')?.click()}>
                        ছবি আপলোড করুন
                    </Button>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="destructive">ডিলিট</Button>
                <Button type="button" variant="outline">এডিট</Button>
                <Button type="submit">সেভ</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
