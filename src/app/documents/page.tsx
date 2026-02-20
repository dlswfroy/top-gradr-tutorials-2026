'use client';

import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DocumentsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
            <CardHeader>
                <CardTitle>ডকুমেন্ট</CardTitle>
                <CardDescription>
                    এখানে প্রয়োজনীয় ডকুমেন্ট ও ফাইল পরিচালনা করুন।
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>এই সেকশনটি নির্মাণাধীন।</p>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
