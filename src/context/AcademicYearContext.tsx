'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';

type AcademicYearContextType = {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: string[];
};

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const [selectedYear, setSelectedYear] = useState<string>(() => new Date().getFullYear().toString());
  
  const availableYears = useMemo(() => {
    const startYear = 2020;
    const endYear = 2050;
    const years: string[] = [];
    for (let year = endYear; year >= startYear; year--) {
      years.push(String(year));
    }
    return years;
  }, []);

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
        setSelectedYear(new Date().getFullYear().toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({
    selectedYear,
    setSelectedYear,
    availableYears,
  }), [selectedYear, availableYears]);

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
}
