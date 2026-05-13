"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Mail, Lock, User as UserIcon, UserPlus, Loader2, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { generateReferralCode, getUserByReferralCode, processReferralReward } from "@/lib/referral-service";
import { isRewardPoolOpen, trackPlatformActivity } from "@/lib/platform-service";

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fingerprint = await getDeviceFingerprint();
      const deviceRef = doc(db, "devices", fingerprint);
      const deviceDoc = await getDoc(deviceRef);
      
      if (deviceDoc.exists()) {
        toast({ variant: "destructive", title: "جهاز مسجل مسبقاً" });
        setLoading(false);
        return;
      }

      let inviter = null;
      if (referralCode.trim()) {
        inviter = await getUserByReferralCode(referralCode.trim());
        if (!inviter) {
          toast({ variant: "destructive", title: "كود غير صالح" });
          setLoading(false);
          return;
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName });

      const poolOpen = await isRewardPoolOpen();
      const initialPoints = poolOpen ? 10 : 0;
      
      // تطبيق تقسيم 51/49
      const withdrawablePart = Math.floor(initialPoints * 0.51);
      const lockedPart = initialPoints - withdrawablePart;

      const userData = {
        uid: user.uid,
        displayName: displayName,
        email: email,
        photoURL: `https://picsum.photos/seed/${user.uid}/200/200`,
        totalPoints: initialPoints,
        withdrawablePoints: withdrawablePart,
        lockedPoints: lockedPart,
        totalEarned: initialPoints,
        referralCode: generateReferralCode(displayName),
        referredBy: inviter?.id || null,
        followedTopics: [],
        trustScore: 100,
        deviceId: fingerprint,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), userData);
      await setDoc(deviceRef, { uid: user.uid, email: user.email, createdAt: serverTimestamp() });

      if (initialPoints > 0) await trackPlatformActivity('reward', initialPoints, user.uid);
      await trackPlatformActivity('user');

      if (inviter) await processReferralReward(inviter.id, user.uid, inviter.displayName, displayName);

      toast({ title: "تم إنشاء الحساب" });
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "فشل التسجيل" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-card border rounded-3xl p-8 shadow-2xl text-right">
        <div className="text-center mb-10">
          <Zap className="text-primary w-10 h-10 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-primary mb-2">NokTek</h1>
          <p className="text-muted-foreground">انضم إلى اقتصاد التفاعل</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="space-y-2">
            <Label>الاسم المستعار</Label>
            <Input placeholder="مثال: ضاحك الليل" className="text-right" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input type="email" placeholder="name@example.com" className="text-right" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>كلمة المرور</Label>
            <Input type="password" placeholder="••••••••" className="text-right" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label className="text-primary font-bold">كود الدعوة (اختياري)</Label>
            <Input placeholder="NOK4K9" className="text-right font-mono" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-bold mt-4">
            {loading ? <Loader2 className="animate-spin" /> : "إنشاء الحساب"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          لديك حساب؟ <Link href="/login" className="text-primary font-bold">سجل دخولك هنا</Link>
        </p>
      </div>
    </div>
  );
}