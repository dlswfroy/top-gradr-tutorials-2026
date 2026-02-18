'use client';

export interface Holiday {
  id: number;
  date: string; // YYYY-MM-DD
  description: string;
}

const HOLIDAYS_STORAGE_KEY = 'holidaysData';

export const getHolidaysFromStorage = (): Holiday[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const data = window.localStorage.getItem(HOLIDAYS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading holidays from localStorage", error);
    return [];
  }
};

const saveHolidaysToStorage = (holidays: Holiday[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(HOLIDAYS_STORAGE_KEY, JSON.stringify(holidays));
  } catch (error) {
    console.error("Error saving holidays to localStorage", error);
  }
};

export const getHolidays = (): Holiday[] => {
  const holidays = getHolidaysFromStorage();
  return [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const addHoliday = (holidayData: Omit<Holiday, 'id'>): Holiday | null => {
  const holidays = getHolidaysFromStorage();
  const exists = holidays.some(h => h.date === holidayData.date);
  if (exists) {
      return null;
  }
  const maxId = holidays.reduce((max, h) => (h.id > max ? h.id : max), 0);
  const newHoliday: Holiday = {
    ...holidayData,
    id: maxId + 1,
  };
  const newHolidays = [...holidays, newHoliday];
  saveHolidaysToStorage(newHolidays);
  return newHoliday;
};

export const deleteHoliday = (id: number): boolean => {
  const holidays = getHolidaysFromStorage();
  const updatedHolidays = holidays.filter((h) => h.id !== id);
  if (holidays.length !== updatedHolidays.length) {
    saveHolidaysToStorage(updatedHolidays);
    return true;
  }
  return false;
};

export const isHoliday = (date: string): Holiday | undefined => {
    const holidays = getHolidaysFromStorage();
    return holidays.find(h => h.date === date);
}
