'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { getSchoolInfo, saveSchoolInfo, SchoolInfo } from '@/lib/school-info';

type SchoolInfoContextType = {
  schoolInfo: SchoolInfo;
  updateSchoolInfo: (newInfo: SchoolInfo) => void;
};

const SchoolInfoContext = createContext<SchoolInfoContextType | undefined>(undefined);

export function SchoolInfoProvider({ children }: { children: ReactNode }) {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(getSchoolInfo());

  useEffect(() => {
    // This effect ensures that the state is updated if localStorage changes in another tab.
    const handleStorageChange = () => {
      setSchoolInfo(getSchoolInfo());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSchoolInfo = useCallback((newInfo: SchoolInfo) => {
    saveSchoolInfo(newInfo);
    setSchoolInfo(newInfo);
  }, []);

  const value = useMemo(() => ({
    schoolInfo,
    updateSchoolInfo,
  }), [schoolInfo, updateSchoolInfo]);

  return (
    <SchoolInfoContext.Provider value={value}>
      {children}
    </SchoolInfoContext.Provider>
  );
}

export function useSchoolInfo() {
  const context = useContext(SchoolInfoContext);
  if (context === undefined) {
    throw new Error('useSchoolInfo must be used within a SchoolInfoProvider');
  }
  return context;
}
