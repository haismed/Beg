"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { trackPlatformActivity, initPlatformStats, isRewardPoolOpen } from "@/lib/platform-service";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: any | null;
  loading: boolean;
  userData: any | null;
  loginDemo: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userData: null,
  loginDemo: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initPlatformStats();
    const savedUser = localStorage.getItem("noktek_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setupUserListener(parsedUser.uid);
    } else {
      setLoading(false);
    }
  }, []);

  const setupUserListener = (uid: string) => {
    const userDocRef = doc(db, "users", uid);
    return onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        
        if (data.followedTopics?.length === 0 && 
            !["/topics", "/terms", "/login", "/signup"].includes(pathname)) {
          router.push("/topics");
        }
      }
      setLoading(false);
    });
  };

  const loginDemo = async () => {
    const fakeUser = {
      uid: "test-user-123",
      displayName: "مستخدم تجريبي",
      email: "test@noktek.com",
      photoURL: `https://picsum.photos/seed/noktek/150/150`,
    };

    const fingerprint = await getDeviceFingerprint();
    const deviceRef = doc(db, "devices", fingerprint);
    const deviceDoc = await getDoc(deviceRef);

    const userDocRef = doc(db, "users", fakeUser.uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      if (deviceDoc.exists()) {
        toast({ variant: "destructive", title: "جهاز مسجل مسبقاً" });
        return;
      }

      const poolOpen = await isRewardPoolOpen();
      const initialPoints = poolOpen ? 10 : 0;
      
      // تطبيق تقسيم 51/49
      const withdrawablePart = Math.floor(initialPoints * 0.51);
      const lockedPart = initialPoints - withdrawablePart;

      await setDoc(userDocRef, {
        ...fakeUser,
        totalPoints: initialPoints,
        withdrawablePoints: withdrawablePart,
        lockedPoints: lockedPart,
        totalEarned: initialPoints,
        followedTopics: [],
        createdAt: serverTimestamp(),
      });

      await setDoc(deviceRef, {
        uid: fakeUser.uid,
        email: fakeUser.email,
        createdAt: serverTimestamp()
      });

      await trackPlatformActivity('user');
      if (initialPoints > 0) await trackPlatformActivity('reward', initialPoints);
    }

    localStorage.setItem("noktek_user", JSON.stringify(fakeUser));
    setUser(fakeUser);
    setupUserListener(fakeUser.uid);
  };

  const logout = () => {
    localStorage.removeItem("noktek_user");
    setUser(null);
    setUserData(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, userData, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);