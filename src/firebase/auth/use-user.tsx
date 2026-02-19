'use client';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { useAuth } from '@/firebase/provider';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (userState) => {
      setUser(userState);
      // We are only done loading once we have a definitive user state.
      // Since anonymous auth is used, we should always get a user.
      setLoading(!userState);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
