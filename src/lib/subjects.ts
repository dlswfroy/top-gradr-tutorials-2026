
export interface Subject {
    name: string;
    practical: boolean;
}

const subjectsFor6to8: Subject[] = [
    { name: 'বাংলা প্রথম', practical: false },
    { name: 'বাংলা দ্বিতীয়', practical: false },
    { name: 'ইংরেজি প্রথম', practical: false },
    { name: 'ইংরেজি দ্বিতীয়', practical: false },
    { name: 'গণিত', practical: false },
    { name: 'ধর্ম শিক্ষা', practical: false },
    { name: 'তথ্য ও যোগাযোগ প্রযুক্তি', practical: false },
    { name: 'সাধারণ বিজ্ঞান', practical: false },
    { name: 'বাংলাদেশ ও বিশ্ব পরিচয়', practical: false },
    { name: 'কৃষি শিক্ষা', practical: false },
];

const commonSubjectsFor9to10: Subject[] = [
    { name: 'বাংলা প্রথম', practical: false },
    { name: 'বাংলা দ্বিতীয়', practical: false },
    { name: 'ইংরেজি প্রথম', practical: false },
    { name: 'ইংরেজি দ্বিতীয়', practical: false },
    { name: 'গণিত', practical: false },
    { name: 'ধর্ম শিক্ষা', practical: false },
    { name: 'তথ্য ও যোগাযোগ প্রযুক্তি', practical: false },
    { name: 'কৃষি শিক্ষা', practical: true },
];

const scienceSubjects: Subject[] = [
    { name: 'বাংলাদেশ ও বিশ্ব পরিচয়', practical: false },
    { name: 'পদার্থ', practical: true },
    { name: 'রসায়ন', practical: true },
    { name: 'জীব বিজ্ঞান', practical: true },
];

const artsSubjects: Subject[] = [
    { name: 'সাধারণ বিজ্ঞান', practical: false },
    { name: 'ইতিহাস ও বিশ্ব সভ্যতা', practical: false },
    { name: 'ভূগোল ও পরিবেশ', practical: false },
    { name: 'পৌরনীতি ও নাগরিকতা', practical: false },
];

const commerceSubjects: Subject[] = [
    { name: 'সাধারণ বিজ্ঞান', practical: false },
    { name: 'হিসাব বিজ্ঞান', practical: false },
    { name: 'ফিন্যান্স ও ব্যাংকিং', practical: false },
    { name: 'ব্যবসায় উদ্যোগ', practical: false },
];

export const getSubjects = (className: string, group?: string): Subject[] => {
    if (['6', '7', '8'].includes(className)) {
        return subjectsFor6to8;
    }
    if (['9', '10'].includes(className)) {
        let subjects = [...commonSubjectsFor9to10];
        if (group === 'science') {
            subjects = [...subjects, ...scienceSubjects];
        } else if (group === 'arts') {
            subjects = [...subjects, ...artsSubjects];
        } else if (group === 'commerce') {
            subjects = [...subjects, ...commerceSubjects];
        }
        return subjects;
    }
    return [];
};
