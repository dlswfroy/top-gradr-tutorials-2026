'use client';

import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AccountsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>হিসাব শাখা</CardTitle>
            <CardDescription>
              এই সেকশনটিระหว่าง নির্মাণ। এখানে ছাত্র-ছাত্রীদের বেতন, পরীক্ষার ফি এবং অন্যান্য আর্থিক লেনদেন পরিচালনা করা হবে।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>ভবিষ্যতে এখানে বিভিন্ন হিসাব সংক্রান্ত ফিচার যুক্ত করা হবে।</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
