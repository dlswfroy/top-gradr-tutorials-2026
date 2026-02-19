'use client';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  Firestore,
  DocumentData,
  WithFieldValue,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type FeeBreakdown = {
  tuitionCurrent?: number;
  tuitionAdvance?: number;
  tuitionDue?: number;
  tuitionFine?: number;
  examFeeHalfYearly?: number;
  examFeeAnnual?: number;
  examFeePreNirbachoni?: number;
  examFeeNirbachoni?: number;
  sessionFee?: number;
  admissionFee?: number;
  scoutFee?: number;
  developmentFee?: number;
  libraryFee?: number;
  tiffinFee?: number;
};

export type FeeCollection = {
  id: string; // Firestore doc ID
  studentId: string;
  academicYear: string;
  collectionDate: Date;
  description: string;
  totalAmount: number;
  transactionIds: string[]; // To link to cashbook entries
  breakdown: FeeBreakdown;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type NewFeeCollectionData = Omit<FeeCollection, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateFeeCollectionData = Partial<Omit<FeeCollection, 'id'| 'createdAt' | 'updatedAt'>>;


const FEE_COLLECTION_PATH = 'feeCollections';

const feeCollectionFromDoc = (doc: DocumentData): FeeCollection => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        collectionDate: data.collectionDate.toDate(),
    } as FeeCollection;
}

export const getFeeCollectionsForStudent = async (db: Firestore, studentId: string, academicYear: string): Promise<FeeCollection[]> => {
  const q = query(
    collection(db, FEE_COLLECTION_PATH),
    where("studentId", "==", studentId),
    where("academicYear", "==", academicYear),
    orderBy("collectionDate", "desc")
  );
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(feeCollectionFromDoc);
  } catch (e) {
    console.error("Error getting fee collections:", e);
    return [];
  }
};
