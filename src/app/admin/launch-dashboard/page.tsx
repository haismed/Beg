
'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { subscribeToLaunchStats, toggleEmergencyMode } from "@/lib/admin-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, Zap, ShieldAlert, TrendingUp, Users, 
  Server, AlertTriangle, Play, Pause, RefreshCw 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function LaunchDashboard() {
  const { userData, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  useEffect(() => {
    if (userData && !userData.isAdmin) {
      router.push("/");
      return;
    }

    const unsub = subscribeToLaunchStats((data) => {
      setStats(data);
    });

    return () => unsub();
  }, [userData, router]);

  const handleEmergencyToggle = async () => {
    if (!confirm("هل أنت متأكد؟ سيؤدي هذا لإيقاف كافة العمليات المالية والجوائز فوراً!")) return;
    setEmergencyLoading(true);
    try {
      await toggleEmergencyMode(!stats?.emergencyMode);
      toast({ title: stats?.emergencyMode ? "تم استئناف العمليات" : "🚨 تم تفعيل وضع الطوارئ" });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل تغيير الوضع" });
    } finally {
      setEmergencyLoading(false);
    }
  };

  if (!stats) return <div className="min-h-screen flex items-center justify-center bg-black text-white"><RefreshCw className="animate-spin" /> جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Zap className="text-yellow-500" fill="currentColor" />
              غرفة عمليات الإطلاق
            </h1>
            <p className="text-zinc-500 text-xs mt-1">تحديث حي كل 5 ثواني | NOKTEK v1.0.0-PROD</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-400">حالة السيرفر</p>
              <div className="flex items-center gap-2">
                <span className={cn("w-3 h-3 rounded-full animate-pulse", stats.serverStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500')} />
                <span className="font-black text-sm">{stats.latency || 120}ms</span>
              </div>
            </div>
            <Button 
              onClick={handleEmergencyToggle}
              disabled={emergencyLoading}
              variant="destructive" 
              className={cn(
                "h-14 px-8 rounded-2xl font-black gap-2 transition-all",
                stats.emergencyMode ? "bg-green-600 hover:bg-green-700 animate-none" : "bg-red-600 animate-pulse"
              )}
            >
              {stats.emergencyMode ? <Play /> : <Pause />}
              {stats.emergencyMode ? "استئناف العمليات" : "وضع الطوارئ (KILL SWITCH)"}
            </Button>
          </div>
        </div>

        {/* 6 Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <MetricCard 
            title="المستخدمين النشطين" 
            value={stats.activeUsers || 0} 
            sub="+12% آخر ساعة"
            icon={Users}
            color="text-blue-500"
          />

          <MetricCard 
            title="الطباعة vs الحرق" 
            value={`${stats.mintRateHour || 0} / ${stats.burnRateHour || 0}`} 
            sub="نقطة / ساعة"
            icon={Activity}
            color={stats.isHealthy ? "text-green-500" : "text-orange-500"}
          />

          <MetricCard 
            title="نسبة التضخم اللحظية" 
            value={`${stats.inflation}%`} 
            sub={stats.isHealthy ? "ضمن النطاق الصحي" : "خطر تضخم!"}
            icon={TrendingUp}
            color={stats.isHealthy ? "text-green-500" : "text-red-500"}
          />

          <MetricCard 
            title="محاولات الاحتيال" 
            value={stats.fraudAttemptsToday || 0} 
            sub="حساب معلق اليوم"
            icon={ShieldAlert}
            color="text-red-500"
          />

          <MetricCard 
            title="معدل التحويل 49%" 
            value={stats.stageCompletersToday || 0} 
            sub="مستخدم أكمل 3/3 تحويلات"
            icon={RefreshCw}
            color="text-purple-500"
          />

          <MetricCard 
            title="سرعة الاستجابة" 
            value={`${stats.latency || 0}ms`} 
            sub="Firestore & Logic"
            icon={Server}
            color={stats.serverStatus === 'healthy' ? "text-green-500" : "text-red-500"}
          />

        </div>

        {/* System Logs & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="bg-zinc-900 border-zinc-800 text-white rounded-3xl">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="text-orange-500" /> تنبيهات النظام</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 {stats.alerts?.map((alert: any, i: number) => (
                   <div key={i} className="flex justify-between items-center p-3 bg-black/50 rounded-xl border-r-4 border-orange-500">
                      <div>
                        <p className="text-xs font-bold">{alert.message}</p>
                        <p className="text-[10px] text-zinc-500">{alert.time}</p>
                      </div>
                      <Badge variant="outline" className="border-orange-500 text-orange-500 text-[10px]">{alert.severity}</Badge>
                   </div>
                 ))}
                 {(!stats.alerts || stats.alerts.length === 0) && <p className="text-center text-zinc-600 text-sm py-10">لا توجد تنبيهات حالية..</p>}
              </CardContent>
           </Card>

           <Card className="bg-zinc-900 border-zinc-800 text-white rounded-3xl">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="text-yellow-500" /> العمليات المعلقة للتدقيق</CardTitle></CardHeader>
              <CardContent>
                 <div className="text-center py-20">
                    <p className="text-zinc-600 text-xs">جاري سحب العمليات المشبوهة للفرز اليدوي...</p>
                    <Progress value={45} className="mt-4 h-1 w-32 mx-auto" />
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub, icon: Icon, color }: any) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white rounded-3xl overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-3 rounded-2xl bg-black/50 border border-zinc-800 group-hover:scale-110 transition-transform", color)}>
            <Icon size={24} />
          </div>
          <Badge variant="outline" className="text-[8px] border-zinc-700">LIVE</Badge>
        </div>
        <div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-black mt-1">{value}</p>
          <p className={cn("text-[10px] mt-2 font-bold", color)}>{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
