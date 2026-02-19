'use client';

export interface SchoolInfo {
  name: string;
  eiin: string;
  code: string;
  address: string;
  logoUrl: string;
}

const SCHOOL_INFO_STORAGE_KEY = 'schoolInfoData';

const defaultSchoolInfo: SchoolInfo = {
    name: 'বীরগঞ্জ পৌর উচ্চ বিদ্যালয়',
    eiin: '123456',
    code: '7890',
    address: 'Upazila: Birganj, Post: Birganj, Zila: Dinajpur',
    logoUrl: 'https://images.unsplash.com/photo-1695556575317-9d49e3dccf75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxzY2hvb2wlMjBjcmVzdHxlbnwwfHx8fDE3NzEyNTg0MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080'
};

export const getSchoolInfo = (): SchoolInfo => {
  if (typeof window === 'undefined') {
    return defaultSchoolInfo;
  }
  try {
    const data = window.localStorage.getItem(SCHOOL_INFO_STORAGE_KEY);
    // Merge saved data with defaults to ensure all fields are present
    const savedData = data ? JSON.parse(data) : {};
    return { ...defaultSchoolInfo, ...savedData };
  } catch (error) {
    console.error("Error reading school info from localStorage", error);
    return defaultSchoolInfo;
  }
};

export const saveSchoolInfo = (info: SchoolInfo): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(SCHOOL_INFO_STORAGE_KEY, JSON.stringify(info));
  } catch (error) {
    console.error("Error saving school info to localStorage", error);
  }
};
