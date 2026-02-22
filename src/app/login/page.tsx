'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { signIn, signUp } from '@/lib/auth';
import type { UserRole } from '@/lib/user';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, loading } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);

    if(loading || user) {
        return <div className="flex min-h-screen items-center justify-center">লোড হচ্ছে...</div>
    }

    const handleAuthAction = async (action: 'signIn' | 'signUp', role: UserRole) => {
        setIsLoading(true);
        try {
            if (action === 'signIn') {
                const result = await signIn(email, password, role);
                if (result.success) {
                    toast({ title: 'লগইন সফল হয়েছে' });
                } else {
                    throw new Error(result.error);
                }
            } else {
                const result = await signUp(email, password);
                 if (result.success) {
                    toast({ title: 'সাইন আপ সফল হয়েছে', description: `আপনাকে একজন ${result.role} হিসেবে নিবন্ধন করা হয়েছে।` });
                } else {
                    throw new Error(result.error);
                }
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'একটি ত্রুটি ঘটেছে',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>স্কুল ম্যানেজমেন্ট সিস্টেম</CardTitle>
                    <CardDescription>আপনার ভূমিকা নির্বাচন করে লগইন বা সাইন আপ করুন</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="teacher-login">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="teacher-login">শিক্ষক লগইন</TabsTrigger>
                            <TabsTrigger value="admin-login">এডমিন লগইন</TabsTrigger>
                            <TabsTrigger value="signup">সাইন আপ</TabsTrigger>
                        </TabsList>

                        <TabsContent value="teacher-login">
                            <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('signIn', 'teacher'); }} className="space-y-4 pt-4">
                                <AuthFormFields />
                                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'লোড হচ্ছে...' : 'শিক্ষক হিসেবে লগইন'}</Button>
                            </form>
                        </TabsContent>
                        
                        <TabsContent value="admin-login">
                           <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('signIn', 'admin'); }} className="space-y-4 pt-4">
                                <AuthFormFields />
                                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'লোড হচ্ছে...' : 'এডমিন হিসেবে লগইন'}</Button>
                            </form>
                        </TabsContent>
                        
                        <TabsContent value="signup">
                            <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('signUp', 'teacher'); }} className="space-y-4 pt-4">
                                <AuthFormFields />
                                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'লোড হচ্ছে...' : 'সাইন আপ'}</Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );

    function AuthFormFields() {
        return (
            <>
                <div className="space-y-2">
                    <Label htmlFor="email">ইমেইল</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">পাসওয়ার্ড</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
            </>
        );
    }
}
