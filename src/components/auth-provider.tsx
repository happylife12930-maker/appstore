'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  role: 'admin' | 'tester' | 'client';
  permissions: string[];
  name: string;
  email: string;
  phone?: string;
  clientId?: string; // المعرف المربوط بجدول العملاء
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // الاستماع المباشر لبروفايل المستخدم في Firestore
        const docRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              uid: firebaseUser.uid,
              role: data.role || 'client',
              permissions: data.permissions || [],
              name: data.name || "مستفيد",
              email: data.email || firebaseUser.email || "",
              phone: data.phone || "",
              clientId: data.clientId || "", // نضمن تحميل الـ clientId هنا
            });
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Auth Profile Error:", err);
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [db, router, pathname]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);