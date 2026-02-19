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
  writeBatch,
  QueryDocumentSnapshot
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

const feeCollectionFromDoc = (docSnap: QueryDocumentSnapshot): FeeCollection | null => {
    const data = docSnap.data();
    if (!data) return null;

    let collectionDate: Date | null = null;

    if (data.collectionDate) {
        // Handle Firestore Timestamp
        if (typeof data.collectionDate.toDate === 'function') {
            collectionDate = data.collectionDate.toDate();
        } 
        // Handle ISO date string
        else if (typeof data.collectionDate === 'string') {
            const parsed = new Date(data.collectionDate);
            if (!isNaN(parsed.getTime())) {
                collectionDate = parsed;
            }
        } 
        // Handle plain object with seconds/nanoseconds (can happen when data is serialized/deserialized)
        else if (typeof data.collectionDate.seconds === 'number' && typeof data.collectionDate.nanoseconds === 'number') {
            collectionDate = new Timestamp(data.collectionDate.seconds, data.collectionDate.nanoseconds).toDate();
        }
    }
    
    if (!collectionDate) {
        console.error(`Invalid or missing collectionDate for feeCollection document: ${docSnap.id}`);
        return null;
    }

    return {
        id: docSnap.id,
        ...data,
        collectionDate: collectionDate,
    } as FeeCollection;
}

export const getFeeCollectionsForStudent = async (db: Firestore, studentId: string, academicYear: string): Promise<FeeCollection[]> => {
  const q = query(
    collection(db, FEE_COLLECTION_PATH),
    where("studentId", "==", studentId),
    where("academicYear", "==", academicYear)
  );
  try {
    const querySnapshot = await getDocs(q);
    const collections = querySnapshot.docs
        .map(feeCollectionFromDoc)
        .filter((item): item is FeeCollection => item !== null);

    return collections.sort((a, b) => b.collectionDate.getTime() - a.collectionDate.getTime());
  } catch (e) {
    console.error("Error getting fee collections:", e);
    return [];
  }
};
