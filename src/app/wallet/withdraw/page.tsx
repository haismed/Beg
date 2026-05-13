
"use client";

import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { withdrawPoints } from "@/lib/wallet-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Wallet, AlertCircle, ShieldCheck, Loader2, Landmark, Gavel } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function WithdrawWalletPage() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user || !userData) return null;

  const handleWithdraw = async () => {
    const points = Number(amount);
    if (!points || points < 100) {
      toast({ variant: "destructive", title: "خطأ", description: "الحد الأدنى للسحب 100 نقطة." });
      return;
    }

    setLoading(true);
    try {
      await withdrawPoints(user.uid, points);
      toast({ title: "تم إرسال الطلب", description: "سيتم مراجعة طلبك وتحويل المبلغ لحسابك البنكي قريباً." });
      router.push("/profile");
    } catch (e: any) {
      toast({ variant: "destructive", title: "فشل السحب", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const pointValue = 0.01;
  const netPoints = Math.floor(Number(amount) * 0.93);
  const netMAD = (netPoints * pointValue).toFixed(2);
  const feeMAD = (Number(amount) * 0.07 * pointValue).toFixed(2);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 text-right">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight />
          </Button>
        </Link>
        <h1 className="text-2xl font-black">سحب الأرباح النقدية</h1>
      </div>

      <div className="pulse-card rounded-3xl p-8 text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <Landmark className="mb-4 w-10 h-10 opacity-80" />
          <h2 className="text-2xl font-black mb-2">حول نقاطك إلى كاش</h2>
          <p className="text-sm opacity-90 leading-relaxed">
            الرصيد القابل للسحب (51%) هو نتاج تفاعلك الحقيقي. يمكنك سحبه فوراً بمجرد تخطيك حاجز 100 نقطة.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-border bg-card">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold mr-2">المبلغ المراد سحبه (بالنقاط)</label>
            <Input 
              type="number" 
              placeholder="100" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 rounded-2xl text-2xl font-black text-center"
            />
            <p className="text-[10px] text-center text-muted-foreground font-bold">
              رصيدك القابل للسحب المتاح: {userData.withdrawablePoints?.toFixed(1)} نقطة
            </p>
          </div>

          <div className="bg-green-500/5 border border-green-500/20 p-5 rounded-3xl space-y-3">
            <div className="flex justify-between text-sm flex-row-reverse">
              <span className="text-muted-foreground">إجمالي القيمة:</span>
              <span className="font-bold">{(Number(amount) * pointValue).toFixed(2)} د.م.</span>
            </div>
            <div className="flex justify-between text-sm flex-row-reverse text-destructive">
              <span className="flex items-center gap-1">رسوم خدمات المنصة (7%): <Gavel size={12}/></span>
              <span className="font-bold">-{feeMAD} د.م.</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="font-black text-lg">الصافي للتحويل:</span>
              <span className="text-3xl font-black text-green-600">{netMAD} <span className="text-xs">د.م.</span></span>
            </div>
          </div>

          <Button 
            onClick={handleWithdraw} 
            disabled={loading || !amount || Number(amount) < 100}
            className="w-full h-14 rounded-2xl text-lg font-black bg-green-600 hover:bg-green-700 gap-2 shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                تأكيد طلب السحب
                <Wallet size={20} />
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
             <p className="text-[10px] text-muted-foreground font-bold flex items-center justify-center gap-1">
                <ShieldCheck size={12} className="text-green-500" />
                دفع آمن عبر وكالات معتمدة
             </p>
             <Link href="/fees" className="text-[10px] text-primary underline font-bold">
                عرض تفاصيل رسوم الخدمات
             </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
