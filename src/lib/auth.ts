
'use client';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  limit
} from 'firebase/firestore';
import type { UserRole } from './user';


export async function signUp(email: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> {
  const auth = getAuth();
  const db = getFirestore();
  try {
    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('role', '==', 'admin'), limit(1));
    const adminSnapshot = await getDocs(adminQuery);
    
    let role: UserRole;

    if (adminSnapshot.empty) {
      // First user becomes admin
      role = 'admin';
    } else {
      // Check if email exists in staff collection as a teacher
      const staffRef = collection(db, 'staff');
      const teacherQuery = query(staffRef, where('email', '==', email), where('staffType', '==', 'teacher'), limit(1));
      const teacherSnapshot = await getDocs(teacherQuery);

      if (teacherSnapshot.empty) {
        return { success: false, error: 'আপনার ইমেইলটি শিক্ষক হিসেবে নিবন্ধিত নয়। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।' };
      }
      role = 'teacher';
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      role: role,
    });

    return { success: true, role: role };

  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
        return { success: false, error: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি একাউন্ট তৈরি করা আছে।' };
    }
    return { success: false, error: error.message };
  }
}

export async function signIn(email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> {
  const auth = getAuth();
  const db = getFirestore();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists() || userDoc.data().role !== role) {
      await firebaseSignOut(auth);
      return { success: false, error: 'আপনার ভূমিকা (role) সঠিক নয় অথবা ব্যবহারকারী পাওয়া যায়নি।' };
    }

    return { success: true };
  } catch (error: any) {
     if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      return { success: false, error: 'আপনার ইমেইল অথবা পাসওয়ার্ড ভুল।' };
    }
    return { success: false, error: error.message };
  }
}

export async function signOut() {
  const auth = getAuth();
  return firebaseSignOut(auth);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user || !user.email) {
    return { success: false, error: 'ব্যবহারকারী লগইন করা নেই।' };
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error: any) {
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      return { success: false, error: 'আপনার বর্তমান পাসওয়ার্ডটি ভুল।' };
    }
    if (error.code === 'auth/weak-password') {
        return { success: false, error: 'নতুন পাসওয়ার্ডটি খুবই দুর্বল।' };
    }
    console.error("Password change error:", error);
    return { success: false, error: 'পাসওয়ার্ড পরিবর্তন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।' };
  }
}
