
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Scale, ShieldCheck, Wallet, Megaphone, RefreshCw, Gavel, Zap, TrendingUp, Heart, MessageCircle, Share2, PlayCircle, Clock, AlertTriangle, Info, Sparkles } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const REWARDS_TABLE = [
  { action: "انشر نقطة جديدة", reward: "5 نقاط", icon: "✨" },
  { action: "تعليق أساسي (3 كلمات)", reward: "2 نقطة", icon: "💬" },
  { action: "تعليق مميز (بالهاشتاق)", reward: "4 نقاط", icon: "🎯" },
  { action: "إعجاب بالمحتوى", reward: "1 نقطة", icon: "❤️" },
  { action: "مشاركة المنشور", reward: "3 نقاط", icon: "🔄" },
  { action: "مشاهدة فيديو (متدرج)", reward: "15-50 نقطة", icon: "▶️" },
];

export default function FeesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 text-right">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight />
          </Button>
        </Link>
        <h1 className="text-2xl font-black">رسوم خدمات المنصة</h1>
      </div>

      <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl mb-8">
        <div className="flex items-center gap-3 mb-4 text-primary flex-row-reverse">
          <Scale size={24} />
          <h2 className="text-xl font-bold">لماذا نفرض رسوم خدمات؟</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          قيمة النقطة في هذه المرحلة = 0.01 درهم مغربي. هذه القيمة قابلة للارتفاع في المراحل القادمة حسب نمو المنصة وزيادة الطلب، مما يمنح المستخدمين الأوائل ميزة. يتم توجيه كافة الرسوم إلى احتياطي المنصة لدعم مسبح المكافآت المستقبلي.
        </p>
      </div>

      <div className="mb-10 space-y-4">
        <h3 className="text-lg font-black flex items-center gap-2 flex-row-reverse text-secondary">
          <TrendingUp size={20} />
          توزيع ميزانية الحملة الإعلانية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-card border border-border p-4 rounded-2xl text-center">
            <p className="text-[10px] font-bold text-muted-foreground mb-1">الناشر/المبدع</p>
            <p className="text-2xl font-black text-primary">51%</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl text-center">
            <p className="text-[10px] font-bold text-muted-foreground mb-1">المتفاعلين (أنت)</p>
            <p className="text-2xl font-black text-green-500">29%</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl text-center">
            <p className="text-[10px] font-bold text-muted-foreground mb-1">رسوم المنصة</p>
            <p className="text-2xl font-black text-blue-500">20%</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
           <h3 className="text-lg font-black flex items-center gap-2 flex-row-reverse">
              <Zap size={20} className="text-yellow-500" />
              كيف تكسب النقاط؟
           </h3>
           <Card className="rounded-3xl overflow-hidden border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-right font-bold">النشاط</TableHead>
                    <TableHead className="text-left font-bold">المكافأة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {REWARDS_TABLE.map((row, i) => (
                    <TableRow key={i} className="border-border">
                      <TableCell className="text-right font-medium">
                        <span className="ml-2">{row.icon}</span>
                        {row.action}
                      </TableCell>
                      <TableCell className="text-left font-black text-primary">{row.reward}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </Card>
        </section>

        <section className="space-y-4">
           <h3 className="text-lg font-black flex items-center gap-2 flex-row-reverse text-amber-500">
              <RefreshCw size={20} />
              نظام المكافآت المرن للإعلانات
           </h3>
           <div className="bg-card border border-border p-6 rounded-3xl space-y-4 text-sm leading-relaxed">
              <p>التفاعل مع الإعلانات اختياري ومتدرج لضمان جودة الوصول:</p>
              <ul className="space-y-2 mr-4">
                 <li className="flex items-center gap-2 flex-row-reverse"><PlayCircle size={14} className="text-primary"/> 1. التفاعل الأساسي: مشاهدة 45ث = 15، لايك = +1، تعليق = +2، مشاركة = +3.</li>
                 <li className="flex items-center gap-2 flex-row-reverse"><Sparkles size={14} className="text-yellow-600"/> 2. التعليق المميز: استخدم الهاشتاق المطلوب لتحصل على +4 نقاط بدلاً من 2.</li>
                 <li className="flex items-center gap-2 flex-row-reverse"><Clock size={14} className="text-amber-500"/> 3. مكافأة المحتوى الطويل: 3د = +10، 10د = +10، 10د+ = +15.</li>
                 <li className="flex items-center gap-2 flex-row-reverse"><TrendingUp size={14} className="text-green-500"/> 4. الحد الأقصى للبوست الواحد: 73 نقطة (في الحملات المميزة).</li>
              </ul>
              <div className="bg-muted/30 p-3 rounded-xl border border-dashed text-[10px] font-bold">
                 كل مكافأة تحتسب مرة واحدة فقط. العداد الذكي يتوقف تلقائياً بعد اكتمال كل المكافآت المتاحة للبوست.
              </div>
           </div>
        </section>

        <section className="space-y-4">
           <h3 className="text-lg font-black flex items-center gap-2 flex-row-reverse text-destructive">
              <AlertTriangle size={20} />
              شروط الاستخدام العادل
           </h3>
           <div className="bg-destructive/5 border border-destructive/20 p-6 rounded-3xl space-y-3 text-xs leading-relaxed">
              <div className="flex items-start gap-2 flex-row-reverse">
                 <Clock size={16} className="text-destructive mt-1" />
                 <p><span className="font-black">الحد الأقصى اليومي:</span> 8 ساعات مشاهدة فعلية كل 24 ساعة (96 درهم كحد أقصى يومياً).</p>
              </div>
              <p>• العداد الذكي يتوقف تلقائياً عند إغلاق التطبيق أو توقف الفيديو لضمان التفاعل الحقيقي.</p>
              <p>• يتم مراجعة جودة التعليقات آلياً لمنع السبام وضمان فائدة المحتوى للمعلن.</p>
              <p>• يتم تصفير العداد اليومي تلقائياً الساعة 00:00 UTC.</p>
           </div>
        </section>

        <section className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-3xl space-y-4">
           <h3 className="font-bold flex items-center gap-2 flex-row-reverse text-blue-600">
              <Info size={18} />
              مثال حساب الأرباح (دورة كاملة)
           </h3>
           <div className="text-xs space-y-2 opacity-90">
              <p>حملة بـ 1000 درهم = 100,000 نقطة.</p>
              <ul className="space-y-1 mr-4">
                <li>• لو اكتفى الجميع بـ 45ث + تفاعل عادي (21ن): 1,380 مستخدم.</li>
                <li>• لو شاهد الجميع 10د+ + تعليق مميز (73ن): 397 مستخدم.</li>
                <li>• الحد الأقصى للمستخدم: 8 ساعات = 9600 نقطة = 96 درهم يومياً.</li>
              </ul>
           </div>
        </section>
      </div>

      <div className="mt-12 p-6 bg-muted/30 rounded-3xl text-center">
        <ShieldCheck className="mx-auto text-muted-foreground opacity-50 mb-3" size={32} />
        <p className="text-xs font-bold text-muted-foreground">
          نحن نلتزم بالشفافية الكاملة وتوزيع الثروة الرقمية بعدالة.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
