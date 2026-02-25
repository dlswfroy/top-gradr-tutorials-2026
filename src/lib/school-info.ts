
'use client';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface SchoolInfo {
  id?: string;
  name: string;
  nameEn?: string;
  eiin: string;
  code: string;
  address: string;
  logoUrl: string;
}

export const defaultSchoolInfo: SchoolInfo = {
    name: 'বীরগঞ্জ পৌর উচ্চ বিদ্যালয়',
    nameEn: 'Birganj Pouro High School',
    eiin: '123456',
    code: '7890',
    address: 'Upazila: Birganj, Post: Birganj, Zila: Dinajpur',
    logoUrl: 'https://storage.googleapis.com/project-spark-348216.appspot.com/2024-08-02T19:39:10.570Z/user_uploads/c9e99a77-400e-4363-9562-b13c321484f9/school-logo.png?v=18'
};

const SCHOOL_INFO_DOC_PATH = 'school/info';

export const getSchoolInfo = async (db: Firestore): Promise<SchoolInfo> => {
    const docRef = doc(db, SCHOOL_INFO_DOC_PATH);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...defaultSchoolInfo, ...docSnap.data() } as SchoolInfo;
        } else {
            // If doc doesn't exist, create it with default data
            await saveSchoolInfo(db, defaultSchoolInfo);
            return defaultSchoolInfo;
        }
    } catch (e) {
        console.error("Error getting school info:", e);
        // On error, return default but don't save. Might be a permissions issue.
        return defaultSchoolInfo;
    }
};

export const saveSchoolInfo = async (db: Firestore, info: Partial<SchoolInfo>): Promise<void> => {
  const docRef = doc(db, SCHOOL_INFO_DOC_PATH);
  const dataToSave = { ...info };
  // Don't save id in the document
  if ('id' in dataToSave) {
    delete dataToSave.id;
  }

  return setDoc(docRef, dataToSave, { merge: true })
    .catch(async (serverError) => {
      console.error("Error saving school info:", serverError);
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'write',
        requestResourceData: dataToSave,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
    });
};
