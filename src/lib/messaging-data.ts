
'use client';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  Firestore,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface MessageLog {
  id: string;
  recipientsCount: number;
  type: 'all' | 'class' | 'individual' | 'absent';
  className?: string;
  content: string;
  sentAt: Date;
  senderUid: string;
  senderName: string;
}

export type NewMessageLog = Omit<MessageLog, 'id' | 'sentAt'>;

const MESSAGES_COLLECTION = 'messageLogs';

export const logMessage = async (db: Firestore, logData: NewMessageLog) => {
  // Generate a fresh document reference with a unique ID to avoid "already exists" errors
  const docRef = doc(collection(db, MESSAGES_COLLECTION));
  const dataToSave = {
    ...logData,
    sentAt: serverTimestamp(),
  };

  try {
    return await setDoc(docRef, dataToSave);
  } catch (serverError: any) {
    console.error("Error logging message:", serverError);
    // Only treat as permission error if the code indicates so
    if (serverError.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: MESSAGES_COLLECTION,
            operation: 'create',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
    throw serverError;
  }
};

export const getMessageLogs = async (db: Firestore): Promise<MessageLog[]> => {
  const q = query(collection(db, MESSAGES_COLLECTION), orderBy('sentAt', 'desc'));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            sentAt: data.sentAt instanceof Timestamp ? data.sentAt.toDate() : new Date(data.sentAt),
        } as MessageLog;
    });
  } catch (e) {
    console.error("Error getting message logs:", e);
    return [];
  }
};
