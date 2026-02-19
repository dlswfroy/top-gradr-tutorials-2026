'use client';
import { ReactNode, useMemo } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';

// Singleton instances to prevent re-initialization
let app: FirebaseApp | undefined;
let firestore: Firestore | undefined;

// Initialize Firebase on the client-side only
if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  firestore = getFirestore(app);
}

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const instances = useMemo(() => {
    // During SSR, app and firestore are undefined.
    if (!app || !firestore) {
        return null;
    }
    return { app, firestore };
  }, []);

  if (!instances) {
    // Render children without the provider on the server
    // or if initialization somehow failed.
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      app={instances.app}
      firestore={instances.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
