
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Gem, TrendingUp, Users, Trophy, Zap, Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function EconomyBar() {
  const [stats, setStats] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    // جلب الإحصائيات العامة للمنصة
    const unsubStats = onSnapshot(doc(db, "platform", "stats"), (doc) => {
      if (doc.exists()) setStats(doc.data());
    });

    // جلب إعدادات القيمة والمسبح من config/app
    const unsubConfig = onSnapshot(doc(db, "config", "app"), (doc) => {
      if (doc.exists()) setConfig(doc.data());
    });

    return () => {
      unsubStats();
      unsubConfig();
    };
  }, []);

  // قيم افتراضية في حال عدم وجود بيانات في Firebase
  const pointValue = config?.pointValue || 0.01;
  const rewardPool = config?.rewardPool || 10.7;
  const distributed = stats?.distributedRewards || 0;
  const totalSupply = "22M";

  return (
    <TooltipProvider>
      <div className="sticky top-0 z-[100] h-12 w-full bg-gradient-to-r from-[#1A0B2E] to-black border-b border-white/5 shadow-xl backdrop-blur-md flex items-center px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-2 md:gap-8">
          
          {/* المخزون */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Gem size={14} className="text-white opacity-80" />
            <span className="text-[12px] md:text-[14px] font-bold text-white uppercase tracking-wider">
              المخزون: <span className="font-black">{totalSupply}</span>
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          {/* القيمة */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 whitespace-nowrap cursor-help group">
                <TrendingUp size={14} className="text-[#4ADE80] group-hover:scale-110 transition-transform" />
                <span className="text-[12px] md:text-[14px] font-bold text-[#4ADE80]">
                  القيمة: <span className="font-black">{pointValue} د.م.</span>
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-card border-border text-foreground p-3 rounded-xl shadow-2xl max-w-[200px] text-right">
              <p className="text-xs leading-relaxed font-bold">
                قيمة النقطة الحالية. قابلة للارتفاع مع كل مرحلة جديدة من نمو المنصة 📈
              </p>
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          {/* الموزع */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Users size={14} className="text-[#A78BFA]" />
            <span className="text-[12px] md:text-[14px] font-bold text-[#A78BFA]">
              الموزع: <span className="font-black">{(distributed / 1000000).toFixed(2)}M</span>
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/10 hidden lg:block" />

          {/* مسبح المكافآت */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 whitespace-nowrap cursor-help bg-gradient-to-r from-yellow-500/10 to-amber-500/10 px-3 py-1 rounded-full border border-yellow-500/20 group relative overflow-hidden">
                <Trophy size={14} className="text-yellow-400 group-hover:rotate-12 transition-transform" />
                <span className="text-[11px] md:text-[14px] font-black bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                  مسبح المكافآت: {rewardPool}M <span className="text-[9px] md:text-[10px]">نقطة</span>
                </span>
                {/* تأثير اللمعان */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-card border-border text-foreground p-3 rounded-xl shadow-2xl max-w-[250px] text-right">
              <p className="text-xs leading-relaxed font-bold">
                🏆 مسبح المكافآت: صندوق يمول كل النقاط اللي تكسبها من التفاعل. كل ما قل الرقم = الطلب يزيد!
              </p>
            </TooltipContent>
          </Tooltip>

          {/* أيقونة الجوال السريعة */}
          <div className="md:hidden flex items-center">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
               <Zap size={14} className="text-primary fill-primary" />
            </div>
          </div>

        </div>
      </div>
    </TooltipProvider>
  );
}
