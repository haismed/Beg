
"use client";

import { useState } from "react";
import { auth, db, googleProvider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, getAdditionalUserInfo } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Mail, Lock, LogIn, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDeviceFingerprint } from "@/lib/fingerprint";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (error: any) {
      console.error("Login Error Code:", error.code);
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: "تأكد من البريد الإلكتروني وكلمة المرور.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const additionalInfo = getAdditionalUserInfo(result);
      const isNewUser = additionalInfo?.isNewUser;
      const user = result.user;

      if (isNewUser) {
        // Anti-Multi-Account check for new users
        const fingerprint = await getDeviceFingerprint();
        const deviceRef = doc(db, "devices", fingerprint);
        const deviceDoc = await getDoc(deviceRef);

        if (deviceDoc.exists()) {
          // Force delete user or just block data creation (Auth cleanup might be needed, but for now we block access)
          toast({
            variant: "destructive",
            title: "جهاز مسجل مسبقاً",
            description: "هذا الجهاز مسجل بحساب آخر. تم حظر إنشاء حساب جديد.",
          });
          // Note: In production, you might want to sign out or delete the auth user here
          setGoogleLoading(false);
          return;
        }

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          displayName: user.displayName || "مستخدم NokTek",
          email: user.email,
          photoURL: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
          totalPoints: 10,
          withdrawablePoints: 0,
          lockedPoints: 10,
          totalEarned: 10,
          followedTopics: [],
          createdAt: serverTimestamp(),
        });

        await setDoc(deviceRef, {
          uid: user.uid,
          email: user.email,
          createdAt: serverTimestamp()
        });

        toast({ title: "أهلاً بك في NokTek!", description: "تم إنشاء حسابك وحصلت على 10 نقاط ترحيبية." });
      }

      router.push("/");
    } catch (error: any) {
      console.error("Google Auth error:", error);
      toast({
        variant: "destructive",
        title: "خطأ في Google",
        description: "فشل تسجيل الدخول باستخدام حساب Google.",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl text-right">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="text-primary w-10 h-10 fill-primary" />
          </div>
          <h1 className="text-3xl font-black text-primary mb-2">NokTek</h1>
          <p className="text-muted-foreground">سجل دخولك لتستمتع بأفضل المحتوى</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pr-10 bg-background border-border text-right"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="absolute right-3 top-3 text-muted-foreground w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pr-10 bg-background border-border text-right"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock className="absolute right-3 top-3 text-muted-foreground w-4 h-4" />
            </div>
          </div>

          <Button type="submit" disabled={loading || googleLoading} className="w-full bg-primary hover:bg-primary/90 py-6 text-lg font-bold">
            {loading ? <Loader2 className="animate-spin" /> : (
              <span className="flex items-center gap-2">
                دخول
                <LogIn size={20} />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">أو عبر</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={handleGoogleLogin} 
            disabled={googleLoading || loading}
            className="w-full py-6 border-border hover:bg-muted/20"
          >
            {googleLoading ? <Loader2 className="animate-spin ml-2" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 ml-2" alt="Google" />}
            المتابعة مع Google
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          ليس لديك حساب؟{" "}
          <Link href="/signup" className="text-primary font-bold hover:underline">
            أنشئ حساباً جديداً
          </Link>
        </p>
      </div>
    </div>
  );
}
