
"use client";

import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, query, where, getDocs, limit, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, ShieldCheck, TrendingUp, Info, AlertTriangle, Loader2, Gavel } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trackPlatformActivity } from "@/lib/platform-service";

export default function CreatorSetupPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [adPrice, setAdPrice] = useState("25");
  const [loading, setLoading] = useState(false);
  const [checkingStats, setCheckingStats] = useState(true);
  const [stats, setStats] = useState({ friendsCount: 0, postsCount: 0 });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const checkEligibility = async () => {
      const friendsQ = query(
        collection(db, "friendRequests"),
        where("toUid", "==", user.uid),
        where("status", "==", "accepted")
      );
      const friendsSnap = await getDocs(friendsQ);
      
      const postsQ = query(
        collection(db, "posts"),
        where("authorId", "==", user.uid),
        limit(5)
      );
      const postsSnap = await getDocs(postsQ);

      setStats({
        friendsCount: friendsSnap.size,
        postsCount: postsSnap.size
      });
      setCheckingStats(false);
    };

    checkEligibility();
  }, [user, router]);

  const handleActivate = async () => {
    if (!user || !userData) return;
    
    const fee = 3;
    if (userData.totalPoints < fee) {
      toast({ variant: "destructive", title: "رصيد غير كافي", description: "تحتاج لـ 3 نقاط رسوم صيانة لتفعيل الوضع." });
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isCreator: true,
        adPrice: Number(adPrice),
        adRevenue: 0,
        avgEngagement: 0,
        totalReach: stats.friendsCount,
        friendsCount: stats.friendsCount,
        totalPoints: increment(-fee),
        lockedPoints: increment(-fee) // Deduct from locked first in logic
      });

      await trackPlatformActivity('fee', fee, user.uid, "رسوم صيانة تفعيل وضع المبدع");

      toast({ title: "أهلاً بك في عالم المبدعين", description: "تم تفعيل وضع المبدع بنجاح وخصم 3 نقاط رسوم صيانة." });
      router.push("/profile");
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "خطأ", description: "فشل تفعيل وضع المبدع." });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStats) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  const isEligible = stats.friendsCount >= 20 && stats.postsCount >= 2;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight />
          </Button>
        </Link>
        <h1 className="text-2xl font-black">وضع المبدع (Creator Mode)</h1>
      </div>

      <div className="pulse-card rounded-3xl p-8 text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <Sparkles className="mb-4 w-10 h-10" />
          <h2 className="text-3xl font-black mb-2">كن مؤثراً على NokTek</h2>
          <p className="text-sm opacity-90 leading-relaxed">
            حول تفاعلك وأصدقاءك إلى مصدر دخل. عندما تفعل وضع المبدع، يمكن للمعلنين طلب النشر على حسابك مقابل نقاط.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="rounded-3xl border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="text-primary" />
              شروط الانضمام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`flex items-center justify-between p-3 rounded-xl border ${stats.friendsCount >= 20 ? 'border-green-500/20 bg-green-500/5' : 'border-border'}`}>
              <span className="text-sm font-bold">20 صديق على الأقل</span>
              <span className={`text-xs font-black ${stats.friendsCount >= 20 ? 'text-green-500' : 'text-muted-foreground'}`}>
                {stats.friendsCount} / 20
              </span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-xl border ${stats.postsCount >= 2 ? 'border-green-500/20 bg-green-500/5' : 'border-border'}`}>
              <span className="text-sm font-bold">منشورين (نقطتين) على الأقل</span>
              <span className={`text-xs font-black ${stats.postsCount >= 2 ? 'text-green-500' : 'text-muted-foreground'}`}>
                {stats.postsCount} / 2
              </span>
            </div>
          </CardContent>
        </Card>

        {isEligible ? (
          <Card className="rounded-3xl border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="text-primary" />
                إعدادات السعر والرسوم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-background/50 border border-border p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gavel size={16} className="text-muted-foreground" />
                  <span className="text-sm font-bold">رسوم صيانة التفعيل (مرة واحدة)</span>
                </div>
                <span className="text-lg font-black text-primary">3 نقاط</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">سعر المنشور الإعلاني الخاص بك</label>
                <Input 
                  type="number" 
                  value={adPrice} 
                  onChange={(e) => setAdPrice(e.target.value)}
                  className="h-14 rounded-xl text-xl font-black bg-background border-border"
                />
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Info size={12} />
                  نقترح البدء بسعر 10-50 نقطة حسب قوة تفاعل حسابك.
                </p>
              </div>

              <Button 
                onClick={handleActivate} 
                className="w-full h-14 rounded-2xl text-lg font-black shadow-lg"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : "دفع الرسوم وتفعيل وضع المبدع"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Alert variant="destructive" className="rounded-2xl border-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-bold">غير مؤهل حالياً</AlertTitle>
            <AlertDescription>
              يجب عليك تحقيق شروط الانضمام أولاً لتتمكن من تفعيل وضع المبدع والبدء بالكسب.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
