'use client';

import Image from 'next/image';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { deleteStaff, Staff } from '@/lib/staff-data';
import { Eye, FilePen, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, FirestoreError } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function StaffListPage() {
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [staffToView, setStaffToView] = useState<Staff | null>(null);
  const db = useFirestore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!db) return;
    setIsLoading(true);

    const staffQuery = query(collection(db, "staff"), orderBy("nameBn"));

    const unsubscribe = onSnapshot(staffQuery, (querySnapshot) => {
      const staffData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().joinDate?.toDate(),
      })) as Staff[];
      setAllStaff(staffData);
      setIsLoading(false);
    }, async (error: FirestoreError) => {
      const permissionError = new FirestorePermissionError({
        path: 'staff',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleDeleteStaff = (staffId: string) => {
    if (!db) return;
    deleteStaff(db, staffId).then(() => {
        toast({
            title: "রেকর্ড ডিলিট হয়েছে",
        });
    }).catch(() => {
        // The error is handled by the global error handler
    });
  };

  const staffTypeMap: { [key: string]: string } = { 'teacher': 'শিক্ষক', 'staff': 'কর্মচারী' };

  return (
    <>
    <div className="flex min-h-screen w-full flex-col bg-orange-50">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>শিক্ষক ও কর্মচারী তালিকা</CardTitle>
              <Link href="/add-staff">
                <Button>নতুন যোগ করুন</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
             {isClient ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>ছবি</TableHead>
                            <TableHead>নাম</TableHead>
                            <TableHead>পদবি</TableHead>
                            <TableHead>বিষয়</TableHead>
                            <TableHead>মোবাইল</TableHead>
                            <TableHead>ইমেইল</TableHead>
                            <TableHead>ধরণ</TableHead>
                            <TableHead className="text-right">কার্যক্রম</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                    লোড হচ্ছে...
                                </TableCell>
                            </TableRow>
                        ) : allStaff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                    কোনো শিক্ষক বা কর্মচারীর তথ্য পাওয়া যায়নি।
                                </TableCell>
                            </TableRow>
                        ) : (
                            allStaff.map((staff) => (
                            <TableRow key={staff.id}>
                                <TableCell>
                                <Image
                                    src={staff.photoUrl}
                                    alt={staff.nameBn}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover"
                                />
                                </TableCell>
                                <TableCell className="whitespace-nowrap font-medium">{staff.nameBn}</TableCell>
                                <TableCell className="whitespace-nowrap">{staff.designation}</TableCell>
                                <TableCell>{staff.subject || '-'}</TableCell>
                                <TableCell>{staff.mobile}</TableCell>
                                <TableCell>{staff.email || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant={staff.staffType === 'teacher' ? 'default' : 'secondary'}>
                                        {staffTypeMap[staff.staffType]}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="icon" onClick={() => setStaffToView(staff)}>
                                    <Eye className="h-4 w-4" />
                                    </Button>
                                    <Link href={`/edit-staff/${staff.id}`}>
                                    <Button variant="outline" size="icon" asChild>
                                        <span className="cursor-pointer">
                                        <FilePen className="h-4 w-4" />
                                        </span>
                                    </Button>
                                    </Link>
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
                                            এই কাজটি ফিরিয়ে আনা যাবে না। এটি তালিকা থেকে স্থায়ীভাবে এই রেকর্ডটি মুছে ফেলবে।
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteStaff(staff.id)}>
                                            ডিলিট করুন
                                        </AlertDialogAction>
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
             ) : (
                <div className="border rounded-md">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ছবি</TableHead>
                          <TableHead>নাম</TableHead>
                          <TableHead>পদবি</TableHead>
                          <TableHead>বিষয়</TableHead>
                          <TableHead>মোবাইল</TableHead>
                           <TableHead>ইমেইল</TableHead>
                           <TableHead>ধরণ</TableHead>
                          <TableHead className="text-right">কার্যক্রম</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Skeleton className="h-9 w-9" />
                                <Skeleton className="h-9 w-9" />
                                <Skeleton className="h-9 w-9" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
             )}
          </CardContent>
        </Card>
      </main>
    </div>
    <Dialog open={!!staffToView} onOpenChange={(isOpen) => !isOpen && setStaffToView(null)}>
        <DialogContent className="max-w-xl">
             {staffToView && (
                <>
                    <DialogHeader className="flex-row items-center gap-4">
                        <Image src={staffToView.photoUrl} alt={staffToView.nameBn} width={80} height={80} className="rounded-lg object-cover" />
                        <div>
                            <DialogTitle className="text-2xl mb-1">{staffToView.nameBn}</DialogTitle>
                            <DialogDescription>
                                {staffToView.designation}
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto pr-4">
                        <div className="space-y-4 py-4 text-sm">
                            <p><span className="font-medium text-muted-foreground">নাম (ইংরেজি):</span> {staffToView.nameEn || 'N/A'}</p>
                            <p><span className="font-medium text-muted-foreground">বিষয়:</span> {staffToView.subject || 'N/A'}</p>
                            <p><span className="font-medium text-muted-foreground">মোবাইল:</span> {staffToView.mobile}</p>
                            <p><span className="font-medium text-muted-foreground">ইমেইল:</span> {staffToView.email || 'N/A'}</p>
                            <p><span className="font-medium text-muted-foreground">যোগদানের তারিখ:</span> {staffToView.joinDate ? format(new Date(staffToView.joinDate), "d MMMM yyyy", { locale: bn }) : 'N/A'}</p>
                            <p><span className="font-medium text-muted-foreground">শিক্ষাগত যোগ্যতা:</span> {staffToView.education || 'N/A'}</p>
                            <p><span className="font-medium text-muted-foreground">ঠিকানা:</span> {staffToView.address || 'N/A'}</p>
                            <p><span className="font-medium text-muted-foreground">স্ট্যাটাস:</span> {staffToView.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</p>
                        </div>
                    </div>
                </>
             )}
        </DialogContent>
    </Dialog>
    </>
  );
}
