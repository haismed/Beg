
"use client";

import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, Gavel, Scale, AlertTriangle, Info } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 text-right">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight />
          </Button>
        </Link>
        <h1 className="text-2xl font-black flex items-center gap-2 text-primary">
          <ShieldCheck />
          الحماية والقوانين
        </h1>
      </div>

      <div className="space-y-6">
        <section className="bg-card border border-border p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4 text-secondary flex-row-reverse">
            <Gavel />
            <h2 className="text-xl font-bold">المسؤولية القانونية</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            المحتوى المنشور على NokTek هو مسؤولية ناشره بالكامل. المنصة توفر الأدوات للتعبير ولكنها لا تتبنى الأفكار المنشورة.
          </p>
        </section>

        <section className="bg-primary/5 border border-primary/20 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4 text-primary flex-row-reverse">
            <Info />
            <h2 className="text-xl font-bold">4. رسوم خدمات المنصة</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            المنصة تتقاضى رسوم خدمات واضحة ومحددة مقابل تشغيل وصيانة النظام الاقتصادي المركزي ومعالجة التحويلات المالية. يمكنك الاطلاع على تفاصيل كافة الرسوم والنسب في صفحة <Link href="/fees" className="text-primary font-bold underline">رسوم خدمات المنصة</Link>.
          </p>
        </section>

        <section className="bg-card border border-border p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4 text-primary flex-row-reverse">
            <Scale />
            <h2 className="text-xl font-bold">حقوق الملكية</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            NokTek هي منصة للمحتوى الأصلي فقط. يمنع سرقة المحتوى أو نسبه لغير أهله. أي انتهاك لحقوق الملكية الفكرية سيؤدي إلى حذف المحتوى فوراً وحظر الحساب.
          </p>
        </section>

        <section className="bg-destructive/10 border border-destructive/20 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4 text-destructive flex-row-reverse">
            <AlertTriangle />
            <h2 className="text-xl font-bold">سياسة الحذف</h2>
          </div>
          <p className="text-destructive font-medium leading-relaxed">
            نحن نلتزم بمجتمع آمن ومبهج. أي محتوى يحرض على الكراهية، العنف، أو يتضمن إساءة مباشرة سيتم حذفه دون سابق إنذار وتصفير نقاط المستخدم.
          </p>
        </section>

        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground font-bold">آخر تحديث: أبريل 2026</p>
          <p className="text-xs text-muted-foreground mt-1 italic">NokTek - تفاعلك هو قيمتك</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
