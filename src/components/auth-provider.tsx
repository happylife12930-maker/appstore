
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  role: 'admin' | 'tester' | 'client';
  permissions: string[];
  name: string;
  email: string;
  phone?: string;
  clientId?: string;
  status: 'active' | 'inactive';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // تحقق لحظي من حالة الحساب - إذا تم تعطيله اخرج فوراً
            if (data.status === 'inactive') {
              signOut(auth);
              setProfile(null);
              setLoading(false);
              return;
            }

            setProfile({
              uid: firebaseUser.uid,
              role: data.role || 'client',
              permissions: data.permissions || [],
              name: data.name || "مستفيد",
              email: data.email || firebaseUser.email || "",
              phone: data.phone || "",
              clientId: data.clientId || "",
              status: data.status || 'active'
            });
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.warn("Auth Profile Listener Error:", err);
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          router.push('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
