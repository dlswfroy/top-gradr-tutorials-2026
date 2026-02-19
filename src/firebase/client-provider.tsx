'use client';
import { ReactNode, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';

// Singleton instances
let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;
let firestore: ReturnType<typeof getFirestore>;

if (typeof window !== 'undefined') {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestore = getFirestore(app);
}

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const instances = useMemo(() => {
    if (typeof window === 'undefined') {
      return { app: null, auth: null, firestore: null };
    }
    return { app, auth, firestore };
  }, []);

  if (!instances.app || !instances.auth || !instances.firestore) {
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      app={instances.app}
      auth={instances.auth}
      firestore={instances.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
