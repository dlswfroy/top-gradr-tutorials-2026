'use client';

import Link from 'next/link';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    Search,
    BookMarked,
    Banknote,
    MessageSquare,
    User,
    FileText
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/firebase';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Student, studentFromDoc } from '@/lib/student-data';
import { useRouter } from 'next/navigation';

const NavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link href={href} className={cn("flex flex-col items-center justify-center gap-1 text-white transition-colors hover:text-white/80", isActive ? "text-white scale-110" : "text-white/60")}>
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
        </Link>
    );
};

export function BottomNav() {
    const { user } = useAuth();
    const db = useFirestore();
    const router = useRouter();
    const { selectedYear } = useAcademicYear();

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [lastFetchedYear, setLastFetchedYear] = useState('');
    
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

    const handleSearchOpen = async (open: boolean) => {
        setSearchOpen(open);
        if (open && db && (allStudents.length === 0 || lastFetchedYear !== selectedYear)) {
            setIsSearching(true);
            try {
                const q = query(collection(db, 'students'), where('academicYear', '==', selectedYear));
                const snap = await getDocs(q);
                setAllStudents(snap.docs.map(studentFromDoc));
                setLastFetchedYear(selectedYear);
            } catch (e) {
                console.error("Search fetch error:", e);
            }
            setIsSearching(false);
        }
    };

    const filteredResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        
        const bnToEn = (str: string) => str.replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d).toString());
        const q = searchQuery.trim().toLowerCase();
        const qEn = bnToEn(q);

        const isNumericQuery = /^\d+$/.test(qEn);

        return allStudents.filter(s => {
            const nameBn = (s.studentNameBn || '').toLowerCase();
            const nameEn = (s.studentNameEn || '').toLowerCase();
            
            const matchesName = nameBn.includes(q) || nameEn.includes(q);

            let matchesRoll = false;
            if (isNumericQuery) {
                matchesRoll = s.roll === parseInt(qEn, 10);
            }

            const idStr = (s.generatedId || '').toLowerCase();
            const matchesId = idStr.includes(qEn);
            
            return matchesName || matchesRoll || matchesId;
        }).slice(0, 10);
      }, [searchQuery, allStudents]);

    if (!user) {
        return null;
    }

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-sky-500 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] md:hidden">
                <div className="grid h-full grid-cols-7 items-center">
                    <NavLink href="/" icon={LayoutDashboard} label="ড্যাসবোর্ড" />
                    <NavLink href="/student-list" icon={Users} label="শিক্ষার্থী" />
                    <NavLink href="/attendance" icon={CalendarCheck} label="হাজিরা" />
                    
                    <Dialog open={searchOpen} onOpenChange={handleSearchOpen}>
                        <DialogTrigger asChild>
                            <div className="flex justify-center">
                                <button className="flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full bg-white text-sky-500 shadow-lg ring-4 ring-sky-500">
                                    <Search className="h-7 w-7" />
                                </button>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>শিক্ষার্থী খুঁজুন</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Input 
                                    placeholder="নাম বা রোল লিখে খুঁজুন..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                <div className="space-y-2">
                                    {isSearching ? (
                                        <p className="text-center text-sm text-muted-foreground py-4">ডাটা লোড হচ্ছে...</p>
                                    ) : filteredResults.length > 0 ? (
                                        <div className="max-h-[300px] overflow-y-auto pr-2">
                                            {filteredResults.map(s => (
                                                <div 
                                                    key={s.id} 
                                                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted cursor-pointer transition-colors mb-2 last:mb-0"
                                                    onClick={() => {
                                                        setSelectedStudent(s);
                                                        setIsProfileDialogOpen(true);
                                                        setSearchOpen(false);
                                                        setSearchQuery('');
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={s.photoUrl} />
                                                            <AvatarFallback>{s.studentNameBn?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-bold">{s.studentNameBn}</p>
                                                            <p className="text-[10px] text-muted-foreground">রোল: {s.roll.toLocaleString('bn-BD')} | শ্রেণি: {s.className}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : searchQuery.trim() ? (
                                        <p className="text-center text-sm text-muted-foreground py-4">কোনো তথ্য পাওয়া যায়নি।</p>
                                    ) : null}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <NavLink href="/results" icon={BookMarked} label="ফলাফল" />
                    <NavLink href="/accounts" icon={Banknote} label="হিসাব" />
                    <NavLink href="/messaging" icon={MessageSquare} label="মেসেজ" />
                </div>
            </div>
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                <DialogContent>
                    {selectedStudent && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={selectedStudent.photoUrl} />
                                        <AvatarFallback>{selectedStudent.studentNameBn?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <DialogTitle className="text-2xl">{selectedStudent.studentNameBn}</DialogTitle>
                                        <DialogDescription>
                                            রোল: {selectedStudent.roll.toLocaleString('bn-BD')} | শ্রেণি: {selectedStudent.className}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <Button variant="outline" onClick={() => { router.push(`/student-list?class=${selectedStudent.className}&highlight=${selectedStudent.id}`); setIsProfileDialogOpen(false); }}>
                                    <User className="mr-2 h-4 w-4" /> প্রোফাইল দেখুন
                                </Button>
                                <Button variant="outline" onClick={() => { router.push(`/student-profile?roll=${selectedStudent.roll}&className=${selectedStudent.className}`); setIsProfileDialogOpen(false); }}>
                                    <Banknote className="mr-2 h-4 w-4" /> ফি ও হাজিরা
                                </Button>
                                <Button variant="outline" onClick={() => { router.push(`/marksheet/${selectedStudent.id}?academicYear=${selectedStudent.academicYear}`); setIsProfileDialogOpen(false); }}>
                                    <BookMarked className="mr-2 h-4 w-4" /> মার্কশিট
                                </Button>
                                <Button variant="outline" onClick={() => { router.push(`/documents/testimonial/${selectedStudent.id}`); setIsProfileDialogOpen(false); }}>
                                    <FileText className="mr-2 h-4 w-4" /> প্রত্যয়ন পত্র
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}