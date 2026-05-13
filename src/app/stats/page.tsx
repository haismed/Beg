"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp, doc, updateDoc, increment, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wallet, Lock, Coins, TrendingUp, Clock, Megaphone, 
  ArrowRight, Activity, Eye, Heart, MessageCircle, Share2,
  Calendar, ArrowUpRight, ArrowDownRight, Loader2, Wrench, RefreshCw, Zap, Gavel, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function StatsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "platform", "stats"), (doc) => {
      if (doc.exists()) setPlatformStats(doc.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Hotfixed: Removed orderBy to avoid "The query requires an index" error
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Client-side sort by date
      data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setTransactions(data.slice(0, 10));
      setTxLoading(false);
    });
    return () => unsub();
  }, [user]);

  const refillMyPoints = async () => {
    if (!user || !userData?.isAdmin) return;
    setAdminLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        totalPoints: increment(1000),
        withdrawablePoints: increment(510),
        lockedPoints: increment(490)
      });
      toast({ title: "تم تعبئة الرصيد", description: "حصلت على 1000 نقطة إضافية بنجاح." });
    } catch (e) {
      console.error(e);
    } finally {
      setAdminLoading(false);
    }
  };

  const resetPlatformPoints = async () => {
    if (!user || !userData?.isAdmin) return;
    setAdminLoading(true);
    try {
      const ref = doc(db, "platform", "stats");
      await updateDoc(ref, {
        distributedRewards: 0,
        rewardPoolClosed: false,
        withdrawalOpen: false,
        updatedAt: new Date()
      });
      toast({ title: "تم إعادة الضبط", description: "تم تصفير عداد المكافآت العالمي." });
    } catch (e) {
      console.error(e);
    } finally {
      setAdminLoading(false);
    }
  };

  if (loading || !user || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  const pointValue = platformStats?.pointValueMAD || 0.01;
  const withdrawable = userData.withdrawablePoints || 0;
  const locked = userData.lockedPoints || 0;
  const total = userData.totalPoints || 0;
  
  const fees = platformStats?.fees || { transfer: 7, withdrawal: 7, maintenance: 3, adService: 20 };

  const stats = [
    { label: "الرصيد القابل للسحب (51%)", value: withdrawable, sub: `${(withdrawable * pointValue).toFixed(2)} د.م.`, icon: Wallet, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "النقاط المحجوزة (49%)", value: locked, sub: "للتعزيز والدورة القادمة", icon: Lock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "إجمالي الثروة الرقمية", value: total, sub: `${(total * pointValue).toFixed(2)} د.م.`, icon: Coins, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowRight />
            </Button>
          </Link>
          <h1 className="text-2xl font-black">لوحة الإحصائيات</h1>
        </div>
        {userData.isAdmin && <Badge className="bg-red-500 hover:bg-red-600 text-white font-black">Admin Access</Badge>}
      </div>

      {/* Admin Tools */}
      {userData.isAdmin && (
        <Card className="rounded-3xl border-red-500/30 bg-red-500/5 mb-8 overflow-hidden">
          <CardHeader className="bg-red-500/10 py-3">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-red-600">
              <Wrench size={16} />
              🔧 أدوات المطور (Admin Tools)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="border-red-500/50 text-red-600 hover:bg-red-500/10 rounded-xl h-14 font-bold flex flex-col gap-0"
              onClick={refillMyPoints}
              disabled={adminLoading}
            >
              <Zap size={18} />
              <span className="text-xs">شحن 1000 نقطة</span>
            </Button>
            <Button 
              variant="outline" 
              className="border-red-500/50 text-red-600 hover:bg-red-500/10 rounded-xl h-14 font-bold flex flex-col gap-0"
              onClick={resetPlatformPoints}
              disabled={adminLoading}
            >
              <RefreshCw size={18} />
              <span className="text-xs">ريست رصيد المنصة</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Fees Display */}
      <div className="mb-8">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
          <Gavel size={18} />
          رسوم المنصة والخدمات
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4 rounded-2xl text-center">
            <p className="text-[10px] text-muted-foreground font-bold mb-1">تحويل</p>
            <p className="text-lg font-black">{fees.transfer}%</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl text-center">
            <p className="text-[10px] text-muted-foreground font-bold mb-1">سحب</p>
            <p className="text-lg font-black">{fees.withdrawal}%</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl text-center">
            <p className="text-[10px] text-muted-foreground font-bold mb-1">تفعيل</p>
            <p className="text-lg font-black">{fees.maintenance}%</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl text-center">
            <p className="text-[10px] text-muted-foreground font-bold mb-1">إعلانات</p>
            <p className="text-lg font-black">{fees.adService}ن</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        {stats.map((s, i) => (
          <Card key={i} className="rounded-3xl border-border bg-card overflow-hidden transition-all hover:scale-[1.02]">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center`}>
                  <s.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold">{s.label}</p>
                  <p className="text-2xl font-black">{s.value.toLocaleString()}</p>
                  <p className={`text-[10px] font-bold ${s.color}`}>{s.sub}</p>
                </div>
              </div>
              <ArrowUpRight className="text-muted-foreground opacity-20" size={32} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Log */}
      <div className="mb-8">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Calendar className="text-primary" size={18} />
          آخر المعاملات والرسوم
        </h3>
        <div className="space-y-3">
          {txLoading ? <Loader2 className="animate-spin mx-auto" /> : transactions.map((tx) => (
            <div key={tx.id} className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {tx.amount > 0 ? <ArrowUpRight size={20} /> : tx.type === 'transfer' ? <Send size={20} /> : <ArrowDownRight size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold">{tx.description}</p>
                  <p className="text-[10px] text-muted-foreground">{tx.createdAt?.toDate ? formatDistanceToNow(tx.createdAt.toDate(), { addSuffix: true, locale: ar }) : "قريباً"}</p>
                </div>
              </div>
              <div className="text-left">
                <p className={`font-black ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground">نقطة</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}