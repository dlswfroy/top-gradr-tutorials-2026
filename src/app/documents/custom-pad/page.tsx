'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSchoolInfo } from '@/context/SchoolInfoContext';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Staff } from '@/lib/staff-data';

const toBengaliNumber = (str: string | number) => {
    if (!str && str !== 0) return '';
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(str).replace(/[0-9]/g, (w) => bengaliDigits[parseInt(w, 10)]);
};


export default function CustomPadPage() {
    const db = useFirestore();
    const { schoolInfo, isLoading: isSchoolInfoLoading } = useSchoolInfo();

    const [headmaster, setHeadmaster] = useState<Staff | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!db) return;

        const fetchHeadmaster = async () => {
            setIsLoading(true);
            
            const staffSnapshot = await getDocs(query(
                collection(db, 'staff'),
                where('isActive', '==', true),
                where('designation', 'in', ['প্রধান শিক্ষক', 'প্রধান শিক্ষক (ভারপ্রাপ্ত)'])
            ));
            
            if (!staffSnapshot.empty) {
                const hmDoc = staffSnapshot.docs[0];
                setHeadmaster({ id: hmDoc.id, ...hmDoc.data() } as Staff);
            }

            setIsLoading(false);
        };
        fetchHeadmaster();
    }, [db]);

    if (isLoading || isSchoolInfoLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100">লোড হচ্ছে...</div>;
    }
    
    const issueDate = toBengaliNumber(format(new Date(), "d MMMM, yyyy", { locale: bn }));

    return (
        <div className="bg-gray-100 p-8 font-body">
            <div className="fixed top-8 right-8 z-50 no-print">
                <Button onClick={() => window.print()} size="lg" className="shadow-lg">
                    <Printer className="mr-2 h-5 w-5" />
                    প্রিন্ট করুন
                </Button>
            </div>

            <div className="w-[210mm] h-[297mm] bg-white mx-auto shadow-lg printable-area relative font-['SolaimanLipi'] text-black flex flex-col">
                {/* Header Section */}
                <header 
                    className="h-[100px] p-2 relative text-center bg-white border-b-2 border-gray-300"
                    style={{
                        backgroundImage: `
                            repeating-linear-gradient(to right, #eaf5e8, #eaf5e8 1px, transparent 1px, transparent 10px),
                            repeating-linear-gradient(to bottom, #eaf5e8, #eaf5e8 1px, transparent 1px, transparent 10px)
                        `,
                        backgroundSize: '10px 10px'
                    }}
                >
                    <div className="flex justify-between items-center h-full">
                        <div className="w-24 h-24 flex items-center justify-center">
                            {schoolInfo.logoUrl && <Image src={schoolInfo.logoUrl} alt="School Logo" width={80} height={80} className="object-contain" />}
                        </div>
                        <div className="text-center text-green-800">
                            <p className="text-lg">প্রধান শিক্ষকের কার্যালয়</p>
                            <h1 className="text-4xl font-bold" style={{color: '#2d572c'}}>{schoolInfo.name}</h1>
                            <p className="text-sm">স্থাপিতঃ ২০১৯ খ্রিঃ</p>
                            <p className="text-xs mt-1">{schoolInfo.address} | মোবাইলঃ ০১৭১৭৫৭৬০৩০</p>
                            <p className="text-xs text-red-600 font-semibold">ই-মেইল: birganjpourohsch2019@gmail.com</p>
                        </div>
                        <div className="w-24 h-24"></div>
                    </div>
                </header>
                 <div className="px-10 pt-4 pb-2 flex justify-between text-sm font-medium">
                    <span contentEditable={true} suppressContentEditableWarning={true} className="outline-none focus:ring-1 focus:ring-blue-400 no-print-outline">স্মারক নং- </span>
                    <span contentEditable={true} suppressContentEditableWarning={true} className="outline-none focus:ring-1 focus:ring-blue-400 no-print-outline">তারিখঃ {issueDate}</span>
                </div>

                {/* Watermark */}
                {schoolInfo.logoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <Image src={schoolInfo.logoUrl} alt="School Logo Watermark" width={350} height={350} className="opacity-10" />
                    </div>
                )}
                
                {/* Body Section */}
                <main 
                    className="px-10 py-6 z-10 relative text-justify flex-grow leading-loose text-base outline-none focus:ring-1 focus:ring-blue-400 no-print-outline"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                >
                    <p>আপনার ডকুমেন্ট এখানে লিখুন...</p>
                </main>
                
                {/* Footer Section */}
                <footer className="px-10 pb-16 z-10 text-right mt-auto">
                    <div className="inline-block text-center">
                        <div className="w-64 border-t-2 border-dotted border-black pt-2">
                            <p className="font-semibold">{headmaster?.nameBn || '[প্রধান শিক্ষকের নাম]'}</p>
                            <p>{headmaster?.designation || 'প্রধান শিক্ষক'}</p>
                            <p>{schoolInfo.name}</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
