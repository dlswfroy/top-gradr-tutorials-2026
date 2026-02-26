'use client';
import type { DocumentData } from 'firebase/firestore';

export type UserRole = 'admin' | 'teacher';

export interface User {
  uid: string;
  email: string | null;
  role: UserRole;
  photoUrl?: string;
  displayName?: string;
}

export const userFromDoc = (doc: DocumentData): User => {
    const data = doc.data();
    return {
        uid: doc.id,
        email: data.email,
        role: data.role,
        photoUrl: data.photoUrl,
        displayName: data.displayName,
    } as User;
}
