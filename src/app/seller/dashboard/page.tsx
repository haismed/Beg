
'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, Package, ShoppingBag, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SellerDashboardPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-24 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowRight className="rotate-180" />
            </Button>
          </Link>
          <h1 className="text-2xl font-black">لوحة تحكم التاجر</h1>
        </div>
        <Button className="rounded-xl font-bold gap-2 bg-purple-600 hover:bg-purple-700">
           <Plus size={18} /> منتج جديد
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
         <Card className="rounded-3xl border-none bg-purple-500/10">
            <CardContent className="p-6">
               <p className="text-xs font-bold text-purple-600 mb-1 flex items-center gap-1"><TrendingUp size={12}/> مبيعاتك</p>
               <p className="text-3xl font-black text-purple-600">0.0</p>
               <p className="text-[9px] text-purple-500/70 mt-1">إجمالي النقاط المحصلة</p>
            </CardContent>
         </Card>
         <Card className="rounded-3xl border-none bg-blue-500/10">
            <CardContent className="p-6">
               <p className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1"><ShoppingBag size={12}/> الطلبات</p>
               <p className="text-3xl font-black text-blue-600">0</p>
               <p className="text-[9px] text-blue-500/70 mt-1">بانتظار المعالجة والشحن</p>
            </CardContent>
         </Card>
      </div>

      <div className="bg-card border border-border p-12 rounded-3xl text-center space-y-6">
         <Package size={64} className="mx-auto text-purple-500 opacity-20" />
         <h2 className="text-xl font-bold">لا توجد منتجات حالياً</h2>
         <p className="text-muted-foreground text-sm">ابدأ بإضافة أول منتج لك لتبدأ في استقبال الطلبات مقابل النقاط.</p>
         <Button variant="outline" className="border-purple-500 text-purple-600 rounded-xl font-bold">إضافة منتج الآن</Button>
      </div>
    </div>
  );
}
