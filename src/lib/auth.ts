
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
import { defaultPermissions } from './permissions';


export async function signUp(email: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> {
  const auth = getAuth();
  const db = getFirestore();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('role', '==', 'admin'), limit(1));
    const adminSnapshot = await getDocs(adminQuery);
    
    let role: UserRole;
    let displayName = '';

    // If no admin exists in the system, the first user becomes the admin
    if (adminSnapshot.empty) {
      role = 'admin';
      displayName = 'System Admin';
    } else {
      // Check if this email is registered as a staff/teacher
      const staffRef = collection(db, 'staff');
      const teacherQuery = query(staffRef, where('email', '==', email.toLowerCase()), limit(1));
      const teacherSnapshot = await getDocs(teacherQuery);

      if (teacherSnapshot.empty) {
        // If not admin and not in staff, we still allow signup as teacher but limited access
        role = 'teacher';
        displayName = email.split('@')[0];
      } else {
        role = 'teacher';
        const staffData = teacherSnapshot.docs[0].data();
        displayName = staffData.nameBn || '';
      }
    }

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      role: role,
      displayName: displayName,
      isOnline: true,
      permissions: defaultPermissions[role] || [],
    });

    return { success: true, role: role };

  } catch (error: any) {
    console.error("Signup error:", error);
    if (error.code === 'auth/email-already-in-use') {
        return { success: false, error: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি একাউন্ট তৈরি করা আছে।' };
    }
    return { success: false, error: 'নিবন্ধন করা যায়নি। দয়া করে ফায়ারবেস কনসোলে Email/Password অপশনটি চালু আছে কিনা চেক করুন।' };
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

    if (!userDoc.exists()) {
        // Fallback for cases where Auth user exists but Firestore doc doesn't
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            role: role,
            isOnline: true,
            permissions: defaultPermissions[role] || [],
        });
        return { success: true };
    }

    if (userDoc.data().role !== role) {
      await firebaseSignOut(auth);
      return { success: false, error: 'আপনার ভূমিকা (role) সঠিক নয়। আপনি কি ভুল ট্যাবে লগইন করার চেষ্টা করছেন?' };
    }

    await setDoc(userDocRef, { isOnline: true }, { merge: true });

    return { success: true };
  } catch (error: any) {
     console.error("Signin error:", error);
     if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      return { success: false, error: 'আপনার ইমেইল অথবা পাসওয়ার্ড ভুল।' };
    }
    return { success: false, error: 'লগইন করা যায়নি। দয়া করে সঠিক ইমেইল ও পাসওয়ার্ড ব্যবহার করুন।' };
  }
}

export async function signOut() {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  
  if (user) {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, { isOnline: false }, { merge: true });
    } catch (e) {
      console.error("Error setting offline status on logout:", e);
    }
  }
  
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
