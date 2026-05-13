
'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Store, ShieldCheck, Zap, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function SellerOnboardingPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-24 text-right" dir="rtl">
      <div className="flex items-center gap-4 mb-10">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight className="rotate-180" />
          </Button>
        </Link>
        <h1 className="text-2xl font-black">تفعيل وضع التاجر</h1>
      </div>
      
      <div className="space-y-8">
        <div className="bg-purple-600/10 border border-purple-500/20 p-8 rounded-3xl text-center space-y-4">
           <Store size={64} className="mx-auto text-purple-500" />
           <h2 className="text-2xl font-black text-purple-600">ابدأ البيع على NokTek</h2>
           <p className="text-muted-foreground text-sm leading-relaxed">
             حول نقاطك وأرباحك إلى منتجات حقيقية، أو ابدأ بعرض خدماتك ومنتجاتك مقابل النقاط الرقمية.
           </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
           <Card className="rounded-3xl border-border bg-card overflow-hidden">
              <CardContent className="p-6 flex items-start gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="text-primary" />
                 </div>
                 <div>
                    <h3 className="font-bold mb-1">وصول سريع للعملاء</h3>
                    <p className="text-xs text-muted-foreground">منتجاتك ستظهر لآلاف المستخدمين النشطين في المنصة فوراً.</p>
                 </div>
              </CardContent>
           </Card>

           <Card className="rounded-3xl border-border bg-card overflow-hidden">
              <CardContent className="p-6 flex items-start gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="text-green-500" />
                 </div>
                 <div>
                    <h3 className="font-bold mb-1">نظام دفع آمن ومضمون</h3>
                    <p className="text-xs text-muted-foreground">يتم تحصيل النقاط وحجزها آلياً لضمان حقك وحق المشتري.</p>
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="pt-6">
           <Button className="w-full h-16 rounded-2xl font-black text-xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 gap-2">
              متابعة الإعداد <Sparkles />
           </Button>
           <p className="text-center text-[10px] text-muted-foreground mt-4">بالمتابعة أنت توافق على شروط التجار ورسوم الخدمة (2.5% لكل عملية بيع).</p>
        </div>
      </div>
    </div>
  );
}
