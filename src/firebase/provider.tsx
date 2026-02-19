'use client';
import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';

import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

type FirebaseContextType = {
  app: FirebaseApp | null;
  firestore: Firestore | null;
};

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  firestore: null,
});

type FirebaseProviderProps = {
  children: ReactNode;
  app: FirebaseApp;
  firestore: Firestore;
};

export function FirebaseProvider({
  children,
  app,
  firestore,
}: FirebaseProviderProps) {
  const value = useMemo(
    () => ({
      app,
      firestore,
    }),
    [app, firestore]
  );
  return (
    <FirebaseContext.Provider value={value}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}

export function useFirebaseApp() {
  return useContext(FirebaseContext)?.app;
}

export function useAuth() {
  // Authentication has been removed from this project.
  return null;
}

export function useFirestore() {
  return useContext(FirebaseContext)?.firestore;
}
