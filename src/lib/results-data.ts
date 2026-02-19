'use client';

export interface StudentResult {
  studentId: string;
  written?: number;
  mcq?: number;
  practical?: number;
}

export interface ClassResult {
  academicYear: string;
  className: string;
  group?: string; // for 9-10
  subject: string;
  fullMarks: number;
  results: StudentResult[];
}

const RESULTS_STORAGE_KEY = 'resultsData';

export const getResultsFromStorage = (): ClassResult[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const data = window.localStorage.getItem(RESULTS_STORAGE_KEY);
    const results: ClassResult[] = data ? JSON.parse(data) : [];

    // Normalize subject names to fix old data
    return results.map(res => {
        if (res.subject === 'ধর্ম শিক্ষা') {
            return { ...res, subject: 'ধর্ম ও নৈতিক শিক্ষা' };
        }
        return res;
    });

  } catch (error) {
    console.error("Error reading results from localStorage", error);
    return [];
  }
};

const saveResultsToStorage = (records: ClassResult[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("Error saving results to localStorage", error);
  }
};

export const saveClassResults = (newResult: ClassResult) => {
  const allResults = getResultsFromStorage();
  const existingIndex = allResults.findIndex(
    r =>
      r.academicYear === newResult.academicYear &&
      r.className === newResult.className &&
      r.subject === newResult.subject &&
      r.group === newResult.group
  );

  if (existingIndex !== -1) {
    allResults[existingIndex] = newResult;
  } else {
    allResults.push(newResult);
  }
  saveResultsToStorage(allResults);
};

export const getResultsForClass = (
  academicYear: string,
  className: string,
  subject: string,
  group?: string
): ClassResult | undefined => {
    const allResults = getResultsFromStorage();
    return allResults.find(
      r =>
        r.academicYear === academicYear &&
        r.className === className &&
        r.subject === subject &&
        r.group === (group || undefined)
    );
};

export const getAllResults = (): ClassResult[] => getResultsFromStorage();

export const deleteClassResult = (academicYear: string, className: string, subject: string, group?: string): boolean => {
    const allResults = getResultsFromStorage();
    const resultsToKeep = allResults.filter(r => 
        !(r.academicYear === academicYear &&
        r.className === className &&
        r.subject === subject &&
        r.group === (group || undefined))
    );
    if (allResults.length > resultsToKeep.length) {
        saveResultsToStorage(resultsToKeep);
        return true;
    }
    return false;
}
