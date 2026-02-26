'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Upload } from 'lucide-react';
import { format } from "date-fns";
import { bn } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { addHoliday, getHolidays, deleteHoliday, Holiday, NewHolidayData, createInitialHolidays } from '@/lib/holiday-data';
import { useSchoolInfo } from '@/context/SchoolInfoContext';
import type { SchoolInfo } from '@/lib/school-info';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, FirestoreError, doc, updateDoc, where, limit } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/lib/user';
import { getUsers, updateUserPermissions, deleteUserRecord } from '@/lib/user-management';
import { changePassword } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { availablePermissions, defaultPermissions } from '@/lib/permissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


function SchoolInfoSettings() {
    const { schoolInfo, updateSchoolInfo, isLoading } = useSchoolInfo();
    const { toast } = useToast();
    const [info, setInfo] = useState(schoolInfo);
    const [logoPreview, setLogoPreview] = useState<string | null>(schoolInfo.logoUrl);

    useEffect(() => {
        setInfo(schoolInfo);
        setLogoPreview(schoolInfo.logoUrl);
    }, [schoolInfo]);

    const handleInputChange = (field: keyof SchoolInfo, value: string) => {
        setInfo(prev => ({...prev, [field]: value}));
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setLogoPreview(result);
                handleInputChange('logoUrl', result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = () => {
        updateSchoolInfo(info).then(() => {
            toast({
                title: 'তথ্য সংরক্ষিত হয়েছে',
            });
        }).catch(() => {
            // Error handled by listener
        });
    };
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10" /></div>
                        </div>
                    </div>
                        <div className="space-y-4">
                        <Skeleton className="h-5 w-16" />
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-24 h-24 rounded-md" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t justify-end pt-6">
                    <Skeleton className="h-10 w-36" />
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>প্রতিষ্ঠানের সাধারণ তথ্য</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="schoolName">প্রতিষ্ঠানের নাম (বাংলা)</Label>
                            <Input id="schoolName" value={info.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolNameEn">School Name (English)</Label>
                            <Input id="schoolNameEn" value={info.nameEn || ''} onChange={(e) => handleInputChange('nameEn', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="eiin">EIIN</Label>
                            <Input id="eiin" value={info.eiin} onChange={(e) => handleInputChange('eiin', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolCode">স্কুল কোড</Label>
                            <Input id="schoolCode" value={info.code} onChange={(e) => handleInputChange('code', e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">ঠিকানা</Label>
                            <Textarea id="address" value={info.address} onChange={(e) => handleInputChange('address', e.target.value)} />
                        </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">লোগো</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-md border flex items-center justify-center bg-muted overflow-hidden">
                                {logoPreview ? (
                                    <Image src={logoPreview} alt="School Logo" width={96} height={96} className="object-contain w-full h-full" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
                                        <Upload className="h-8 w-8" />
                                        <span>লোগো</span>
                                    </div>
                                )}
                            </div>
                            <Input id="logo" name="logo" type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
                            <Button type="button" variant="outline" onClick={() => document.getElementById('logo')?.click()}>
                                লোগো আপলোড করুন
                            </Button>
                        </div>
                    </div>
              </div>
            </CardContent>
            <CardFooter className="border-t justify-end pt-6">
                <Button onClick={handleSaveChanges}>পরিবর্তন সেভ করুন</Button>
            </CardFooter>
        </Card>
    );
}

function HolidaySettings() {
    const db = useFirestore();
    const { toast } = useToast();
    const { hasPermission } = useAuth();
    const canManageSettings = hasPermission('manage:settings');
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [newHolidayDescription, setNewHolidayDescription] = useState('');

    const fetchHolidays = useCallback(async () => {
        if (!db) return;
        setIsLoading(true);
        try {
            const data = await getHolidays(db);
            setHolidays(data);
        } catch (e) {
            console.error("Failed to fetch holidays", e);
        } finally {
            setIsLoading(false);
        }
    }, [db]);

    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);

    const handleAddHolidays = async () => {
        if (!db) return;
        if (!startDate || !newHolidayDescription) {
            toast({
                variant: 'destructive',
                title: 'তথ্য অসম্পূর্ণ',
                description: 'অনুগ্রহ করে শুরুর তারিখ এবং ছুটির কারণ পূরণ করুন।',
            });
            return;
        }

        const loopEndDate = endDate || startDate;

        if (loopEndDate < startDate) {
            toast({
                variant: 'destructive',
                title: 'তারিখ নির্বাচনে ভুল',
                description: 'শেষের তারিখ শুরুর তারিখের আগে হতে পারে না।',
            });
            return;
        }

        let currentDate = new Date(startDate);
        const promises: Promise<any>[] = [];

        while (currentDate <= loopEndDate) {
            const holidayData: NewHolidayData = {
                date: format(currentDate, 'yyyy-MM-dd'),
                description: newHolidayDescription,
            };
            promises.push(addHoliday(db, holidayData));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (promises.length === 0) return;

        try {
            const results = await Promise.all(promises);
            let addedCount = 0;
            let duplicateCount = 0;

            results.forEach(result => {
                if (result) {
                    addedCount++;
                } else {
                    duplicateCount++;
                }
            });

            let toastTitle = '';
            let toastDescription = '';
            
            if (addedCount > 0) {
                toastTitle = 'ছুটি যোগ হয়েছে';
                toastDescription = `${addedCount.toLocaleString('bn-BD')}টি নতুন ছুটি যোগ হয়েছে।`;
                if (duplicateCount > 0) {
                    toastDescription += ` ${duplicateCount.toLocaleString('bn-BD')}টি ছুটি ইতিমধ্যে বিদ্যমান থাকায় যোগ করা হয়নি।`;
                }
                toast({ title: toastTitle, description: toastDescription });
                setStartDate(undefined);
                setEndDate(undefined);
                setNewHolidayDescription('');
                fetchHolidays(); // Refetch
            } else if (duplicateCount > 0) {
                toastTitle = 'ছুটি যোগ করা যায়নি';
                toastDescription = `আপনি যে তারিখগুলো দিয়েছেন, সেগুলোতে ইতিমধ্যে ছুটি রয়েছে।`;
                toast({ title: toastTitle, description: toastDescription, variant: 'destructive' });
            }
        } catch (e) {
            // Error is handled inside addHoliday and emitted.
        }
    };


    const handleDeleteHoliday = (id: string) => {
        if (!db) return;
        deleteHoliday(db, id).then(() => {
            toast({
                title: 'ছুটি মুছে ফেলা হয়েছে',
            });
            fetchHolidays(); // Refetch
        }).catch(() => {
            // Error handled by listener
        });
    };

    const handleResetHolidays = async () => {
        if (!db) return;
        setIsLoading(true);
        try {
            const defaultHolidays = await createInitialHolidays(db);
            setHolidays(defaultHolidays);
            toast({ title: "ছুটির তালিকা রিসেট হয়েছে", description: "তালিকাটি ডিফল্ট ছুটিতে রিসেট করা হয়েছে।" });
        } catch (e) {
            console.error("Failed to reset holidays", e);
            toast({ variant: 'destructive', title: 'রিসেট করা যায়নি' });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>নতুন ছুটি যোগ করুন</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 items-end gap-4">
                        <div className="w-full space-y-2">
                            <Label htmlFor="holiday-start-date">শুরুর তারিখ</Label>
                            <DatePicker value={startDate} onChange={setStartDate} />
                        </div>
                        <div className="w-full space-y-2">
                            <Label htmlFor="holiday-end-date">শেষের তারিখ</Label>
                            <DatePicker value={endDate} onChange={setEndDate} placeholder="শুরুর তারিখের সমান" />
                        </div>
                        <div className="w-full sm:col-span-2 space-y-2">
                            <Label htmlFor="holiday-description">ছুটির কারণ</Label>
                            <Input
                                id="holiday-description"
                                value={newHolidayDescription}
                                onChange={(e) => setNewHolidayDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6 justify-end">
                    <Button onClick={handleAddHolidays} disabled={!canManageSettings}>যোগ করুন</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>ছুটির তালিকা</CardTitle>
                    <CardDescription>সরকারি এবং অন্যান্য সকল ছুটির তালিকা। তালিকাটি ভুল দেখালে রিসেট করতে পারেন।</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ক্রমিক নং</TableHead>
                                    <TableHead>তারিখ</TableHead>
                                    <TableHead>কারণ</TableHead>
                                    <TableHead className="text-right">কার্যক্রম</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">লোড হচ্ছে...</TableCell>
                                    </TableRow>
                                ) : holidays.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            কোনো অতিরিক্ত ছুটি যোগ করা হয়নি।
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    holidays.map((holiday, index) => (
                                        <TableRow key={holiday.id}>
                                            <TableCell>{(index + 1).toLocaleString('bn-BD')}</TableCell>
                                            <TableCell>{format(new Date(holiday.date.replace(/-/g, '/')), "d MMMM yyyy", { locale: bn })}</TableCell>
                                            <TableCell>{holiday.description}</TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon" disabled={!canManageSettings}>
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
                </CardContent>
                <CardFooter className="border-t pt-6 justify-end">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" disabled={!canManageSettings}>তালিকা রিসেট করুন</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    এটি ডাটাবেস থেকে ২০২৬ সালের সকল ছুটি মুছে ফেলে ডিফল্ট তালিকা দিয়ে প্রতিস্থাপন করবে। এই কাজটি ফিরিয়ে আনা যাবে না।
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetHolidays}>
                                    রিসেট করুন
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </div>
    );
}

function PermissionDialog({ user, open, onOpenChange, onPermissionsUpdate }: { user: User, open: boolean, onOpenChange: (open: boolean) => void, onPermissionsUpdate: () => void }) {
    const db = useFirestore();
    const { toast } = useToast();
    const [permissions, setPermissions] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (user) {
            const initialPermissions = user.permissions && user.permissions.length > 0 ? user.permissions : (defaultPermissions[user.role] || []);
            setPermissions(new Set(initialPermissions));
        }
    }, [user]);

    const handlePermissionChange = (permissionId: string, checked: boolean | string) => {
        setPermissions(prev => {
            const newPermissions = new Set(prev);
            if (checked) {
                newPermissions.add(permissionId);
            } else {
                newPermissions.delete(permissionId);
            }
            return newPermissions;
        });
    };

    const handleSave = async () => {
        if (!db || !user) return;
        try {
            await updateUserPermissions(db, user.uid, Array.from(permissions));
            toast({ title: 'পারমিশন আপডেট হয়েছে' });
            onPermissionsUpdate();
            onOpenChange(false);
        } catch (error) {
            // Error is handled by the data function
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>পারমিশন সম্পাদনা করুন</DialogTitle>
                    <DialogDescription>
                        {user.email} এর জন্য পারমিশন নির্ধারণ করুন।
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        {availablePermissions.map(permission => (
                            <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`perm-${permission.id}`}
                                    checked={permissions.has(permission.id)}
                                    onCheckedChange={(checked) => handlePermissionChange(permission.id, checked)}
                                    disabled={user.role === 'admin'}
                                />
                                <label
                                    htmlFor={`perm-${permission.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {permission.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>বাতিল</Button>
                    <Button onClick={handleSave} disabled={user.role === 'admin'}>সেভ করুন</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function UserManagementSettings() {
    const db = useFirestore();
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);

    const fetchUsers = useCallback(async () => {
        if (!db) return;
        setIsLoading(true);
        try {
            const data = await getUsers(db);
            setUsers(data);
        } catch (error) {
            // Permission errors are handled by the global listener
        } finally {
            setIsLoading(false);
        }
    }, [db]);
    
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDeleteUser = async (userToDelete: User) => {
        if (!db || !currentUser || userToDelete.uid === currentUser.uid) return;
        
        try {
            await deleteUserRecord(db, userToDelete.uid);
            toast({ title: 'ব্যবহারকারী মুছে ফেলা হয়েছে'});
            fetchUsers(); // Refresh the list
        } catch (error) {
             // Error is handled in deleteUserRecord
        }
    }
    
    const openPermissionDialog = (user: User) => {
        setSelectedUser(user);
        setIsPermissionDialogOpen(true);
    };

    const roleMap: { [key: string]: string } = { admin: 'এডমিন', teacher: 'শিক্ষক' };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>ব্যবহারকারী ম্যানেজমেন্ট</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="border rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>নাম</TableHead>
                                    <TableHead>ইমেইল</TableHead>
                                    <TableHead>ভূমিকা (Role)</TableHead>
                                    <TableHead className="text-right">কার্যক্রম</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">লোড হচ্ছে...</TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            কোনো ব্যবহারকারী পাওয়া যায়নি।
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map(user => (
                                        <TableRow key={user.uid}>
                                            <TableCell className="font-medium">{user.displayName || '-'}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                                    {roleMap[user.role] || user.role}
                                                </Badge>
                                            </TableCell>
                                             <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                     <Button variant="outline" size="sm" onClick={() => openPermissionDialog(user)} disabled={user.role === 'admin'}>
                                                        পারমিশন
                                                     </Button>
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm" disabled={user.uid === currentUser?.uid}>
                                                                ডিলিট
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    এই ব্যবহারকারীকে স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি ফিরিয়ে আনা যাবে না।
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteUser(user)}>
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
                </CardContent>
            </Card>
            {selectedUser && (
                <PermissionDialog
                    user={selectedUser}
                    open={isPermissionDialogOpen}
                    onOpenChange={setIsPermissionDialogOpen}
                    onPermissionsUpdate={fetchUsers}
                />
            )}
        </>
    );
}

function ProfileSettings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const db = useFirestore();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isPhotoSaving, setIsPhotoSaving] = useState(false);
    const [displayName, setDisplayName] = useState<string | null>(null);

    useEffect(() => {
        setPhotoPreview(user?.photoUrl || null);
        
        if (user && db) {
          if (user.role === 'teacher' && user.email) {
            const staffQuery = query(collection(db, 'staff'), where('email', '==', user.email), limit(1));
            const unsubscribe = onSnapshot(staffQuery, (snapshot) => {
              if (!snapshot.empty) {
                setDisplayName(snapshot.docs[0].data().nameBn);
              } else {
                setDisplayName(user.displayName || null);
              }
            });
            return () => unsubscribe();
          } else {
            setDisplayName(user.displayName || 'Super Admin');
          }
        }
    }, [user, db]);

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({
                    variant: "destructive",
                    title: "ফাইল ತುಂಬಾ বড়",
                    description: "অনুগ্রহ করে ২ মেগাবাইটের কম আকারের ছবি আপলোড করুন।",
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSavePhoto = async () => {
        if (!db || !user || !photoPreview) return;

        setIsPhotoSaving(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { photoUrl: photoPreview });
            toast({ title: 'প্রোফাইল ছবি আপডেট হয়েছে' });
        } catch (e) {
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}`,
                operation: 'update',
                requestResourceData: { photoUrl: '...truncated...' },
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsPhotoSaving(false);
        }
    }
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: 'পাসওয়ার্ড মিলেনি', description: 'নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড একই হতে হবে।' });
            return;
        }
        if (newPassword.length < 6) {
             toast({ variant: 'destructive', title: 'পাসওয়ার্ডটি খুবই দুর্বল', description: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
            return;
        }

        setIsSaving(true);
        const result = await changePassword(currentPassword, newPassword);
        setIsSaving(false);

        if (result.success) {
            toast({ title: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।'});
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            toast({ variant: 'destructive', title: 'একটি ত্রুটি ঘটেছে', description: result.error });
        }
    }
    
    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader>
                    <CardTitle>প্রোফাইল তথ্য</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <Label>নাম</Label>
                        <p className="text-sm text-muted-foreground">{displayName || '-'}</p>
                    </div>
                     <div>
                        <Label>ইমেইল</Label>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                     <div>
                        <Label>ভূমিকা (Role)</Label>
                        <p className="text-sm text-muted-foreground">{user?.role === 'admin' ? 'এডমিন' : 'শিক্ষক'}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>প্রোফাইল ছবি</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={photoPreview || ''} alt={user?.email || 'User'} />
                            <AvatarFallback>{user?.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                        <Input id="photo" name="photo" type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('photo')?.click()}>
                            <Upload className="mr-2" />
                            ছবি পরিবর্তন
                        </Button>
                    </div>
                </CardContent>
                 <CardFooter>
                     <Button onClick={handleSavePhoto} disabled={isPhotoSaving || !photoPreview}>
                        {isPhotoSaving ? 'সেভ হচ্ছে...' : 'ছবি সেভ করুন'}
                    </Button>
                </CardFooter>
            </Card>

             <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>পাসওয়ার্ড পরিবর্তন করুন</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">বর্তমান পাসওয়ার্ড</Label>
                            <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">নতুন পাসওয়ার্ড</Label>
                            <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">নতুন পাসওয়ার্ড নিশ্চিত করুন</Label>
                            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'সেভ হচ্ছে...' : 'পাসওয়ার্ড সেভ করুন'}</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

export default function SettingsPage() {
    const [isClient, setIsClient] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        setIsClient(true);
    }, []);

    const isAdmin = user?.role === 'admin';

    return (
        <div className="flex min-h-screen w-full flex-col bg-indigo-50">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>সেটিংস</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isClient ? (
                            <Tabs defaultValue="profile">
                                <TabsList className="inline-flex h-auto flex-wrap items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                                    <TabsTrigger value="profile">প্রোফাইল</TabsTrigger>
                                    {isAdmin && <TabsTrigger value="school-info">প্রতিষ্ঠানের তথ্য</TabsTrigger>}
                                    {isAdmin && <TabsTrigger value="holidays">অতিরিক্ত ছুটি</TabsTrigger>}
                                    {isAdmin && <TabsTrigger value="user-management">ব্যবহারকারী</TabsTrigger>}
                                </TabsList>
                                <TabsContent value="profile" className="pt-4">
                                    <ProfileSettings />
                                </TabsContent>
                                {isAdmin && (
                                    <>
                                        <TabsContent value="school-info" className="pt-4">
                                            <SchoolInfoSettings />
                                        </TabsContent>
                                        <TabsContent value="holidays" className="pt-4">
                                           <HolidaySettings />
                                        </TabsContent>
                                        <TabsContent value="user-management" className="pt-4">
                                            <UserManagementSettings />
                                        </TabsContent>
                                    </>
                                )}
                            </Tabs>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid w-full grid-cols-3 h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                                    <div className="inline-flex items-center justify-center rounded-sm bg-background shadow-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
                                    <div className="inline-flex items-center justify-center rounded-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
                                     <div className="inline-flex items-center justify-center rounded-sm h-8 w-full"><Skeleton className="h-4 w-24" /></div>
                                </div>
                                <SchoolInfoSettings />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
