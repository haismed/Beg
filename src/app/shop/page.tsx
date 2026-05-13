
"use client";

import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { buyPoints, checkShopEligibility } from "@/lib/wallet-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ShoppingCart, Lock, Sparkles, Loader2, Gift, Beaker, ShieldCheck, Rocket, Zap, Wallet } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { convertToAdBalance } from "@/lib/boost-service";

export default function PointShopPage() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [madAmount, setMadAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [convAmount, setConvAmount] = useState("");
  const [convLoading, setConvLoading] = useState(false);

  if (!user || !userData) return null;

  const handleBuy = async () => {
    const amount = Number(madAmount);
    if (!amount || amount <= 0 || amount > 100) {
      toast({ variant: "destructive", title: "خطأ", description: "الحد الأقصى للشراء 100 درهم." });
      return;
    }
    setLoading(true);
    try {
      await buyPoints(user.uid, amount);
      toast({ title: "تم الشراء بنجاح", description: `تمت إضافة النقاط لرصيدك الإعلاني.` });
      router.push("/profile");
    } catch (e: any) {
      toast({ variant: "destructive", title: "فشل العملية", description: e.message });
    } finally { setLoading(false); }
  };

  const handleConvert = async () => {
    const amount = Number(convAmount);
    if (!amount || amount <= 0) return;
    setConvLoading(true);
    try {
      await convertToAdBalance(user.uid, amount);
      toast({ title: "تم التحويل بنجاح", description: "رصيدك الإعلاني جاهز للاستخدام." });
      setConvAmount("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
    } finally { setConvLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 text-right">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight />
          </Button>
        </Link>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <ShoppingCart className="text-primary" />
          متجر النقاط الممول
        </h1>
      </div>

      <div className="space-y-8">
         <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
               <Badge className="bg-white/20 text-white border-none mb-4 flex items-center gap-1 w-fit"><Rocket size={12}/> رصيد التعزيز</Badge>
               <h2 className="text-3xl font-black mb-2">اشحن رصيدك الإعلاني</h2>
               <p className="text-sm opacity-90">النقاط الإعلانية مخصصة لتعزيز ظهور منشوراتك ومضاعفة أرباح جمهورك.</p>
            </div>
            <Zap className="absolute -bottom-4 -left-4 w-32 h-32 opacity-20 rotate-12" />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-3xl border-border bg-card">
               <CardHeader><CardTitle className="text-lg font-black flex items-center gap-2 justify-end">شراء باقات <Wallet className="text-primary"/></CardTitle></CardHeader>
               <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                     {[
                       { mad: 10, pts: 100, label: 'باقة المبدع' },
                       { mad: 45, pts: 500, label: 'باقة النجم' },
                       { mad: 80, pts: 1000, label: 'باقة الأساطير' }
                     ].map(b => (
                        <button key={b.mad} onClick={() => setMadAmount(b.mad.toString())} className="flex justify-between items-center p-3 rounded-xl border border-border hover:border-primary transition-all">
                           <span className="font-black text-primary">{b.pts} ن</span>
                           <span className="text-xs font-bold">{b.label} ({b.mad} د.م.)</span>
                        </button>
                     ))}
                  </div>
                  <Input type="number" placeholder="أو ادخل مبلغا آخر (درهم)" value={madAmount} onChange={e => setMadAmount(e.target.value)} className="h-12 rounded-xl text-center" />
                  <Button onClick={handleBuy} disabled={loading || !madAmount} className="w-full h-12 rounded-xl font-black gap-2">
                     {loading ? <Loader2 className="animate-spin" /> : <>شراء الآن <ShoppingCart size={18}/></>}
                  </Button>
               </CardContent>
            </Card>

            <Card className="rounded-3xl border-border bg-card">
               <CardHeader><CardTitle className="text-lg font-black flex items-center gap-2 justify-end">تحويل من المجمد <Lock className="text-orange-500"/></CardTitle></CardHeader>
               <CardContent className="space-y-4">
                  <p className="text-[10px] text-muted-foreground font-bold leading-relaxed">يمكنك تحويل نقاطك من المحفظة المغلقة إلى الرصيد الإعلاني لتعزيز منشوراتك مجاناً.</p>
                  <div className="bg-orange-500/5 p-3 rounded-xl text-center mb-4">
                     <p className="text-[10px] text-orange-600 font-bold">رصيدك المجمد الحالي: {userData.lockedPoints?.toFixed(0)} ن</p>
                  </div>
                  <Input type="number" placeholder="كم نقطة تود تحويلها؟" value={convAmount} onChange={e => setConvAmount(e.target.value)} className="h-12 rounded-xl text-center" />
                  <Button onClick={handleConvert} disabled={convLoading || !convAmount} variant="outline" className="w-full h-12 rounded-xl font-black gap-2 border-orange-500 text-orange-600">
                     {convLoading ? <Loader2 className="animate-spin" /> : <>تحويل للتعزيز <Rocket size={18}/></>}
                  </Button>
               </CardContent>
            </Card>
         </div>

         <div className="bg-primary/5 p-6 rounded-3xl border border-dashed border-primary/20 text-center">
            <p className="text-xs font-bold text-muted-foreground leading-relaxed">
               تنبيه: النقاط الإعلانية <span className="text-primary">غير قابلة للسحب</span>. تُستخدم حصراً لتعزيز المنشورات ورفع قيمة المكافآت لجمهورك لزيادة التفاعل الحقيقي.
            </p>
         </div>
      </div>
    </div>
  );
}
