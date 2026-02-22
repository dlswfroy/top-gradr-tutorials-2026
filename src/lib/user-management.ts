
'use client';
import {
  collection,
  getDocs,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import { User, userFromDoc } from './user';

const USERS_COLLECTION_PATH = 'users';

export const getUsers = async (db: Firestore): Promise<User[]> => {
  const usersQuery = query(collection(db, USERS_COLLECTION_PATH), orderBy('email'));
  try {
    const querySnapshot = await getDocs(usersQuery);
    return querySnapshot.docs.map(doc => userFromDoc(doc));
  } catch (e) {
    console.error('Error getting users:', e);
    // Let the global error handler deal with permission errors.
    return [];
  }
};
