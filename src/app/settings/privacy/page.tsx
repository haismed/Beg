
'use client';

import { useAuth } from "@/context/auth-context";
import { useState, useEffect } from "react";
import { updatePrivacySettings } from "@/lib/profile-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ShieldCheck, Lock, Users, Eye, Globe, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function PrivacySettingsPage() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [privacy, setPrivacy] = useState<any>(null);

  useEffect(() => {
    if (userData?.privacy) {
      setPrivacy(userData.privacy);
    } else {
      setPrivacy({
        profileVisibility: "public",
        showPoints: "friends",
        showPosts: "public",
        showEarnings: false,
        allowFriendRequests: true
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updatePrivacySettings(user.uid, privacy);
      toast({ title: "تم حفظ الإعدادات", description: "تم تحديث تفضيلات الخصوصية بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الحفظ، حاول مرة أخرى." });
    } finally {
      setLoading(false);
    }
  };

  if (!privacy) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 text-right">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight />
          </Button>
        </Link>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <ShieldCheck className="text-primary" />
          إعدادات الخصوصية
        </h1>
      </div>

      <div className="space-y-6">
        <Card className="rounded-3xl border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Eye size={20} className="text-primary" />
              ظهور الملف الشخصي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="font-bold">من يمكنه رؤية ملفك وتفاصيلك؟</Label>
              <Select value={privacy.profileVisibility} onValueChange={(v) => setPrivacy({...privacy, profileVisibility: v})}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="public">للجميع (العامة) 🌍</SelectItem>
                  <SelectItem value="friends">للأصدقاء فقط 👥</SelectItem>
                  <SelectItem value="private">خاص بي فقط 🔒</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">من يمكنه رؤية رصيد نقاطك؟</Label>
              <Select value={privacy.showPoints} onValueChange={(v) => setPrivacy({...privacy, showPoints: v})}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="public">للجميع</SelectItem>
                  <SelectItem value="friends">للأصدقاء فقط</SelectItem>
                  <SelectItem value="private">إخفاء عن الجميع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users size={20} className="text-primary" />
              التواصل والطلبات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl">
              <Switch 
                checked={privacy.allowFriendRequests} 
                onCheckedChange={(c) => setPrivacy({...privacy, allowFriendRequests: c})} 
              />
              <div className="text-right">
                <p className="font-bold text-sm">السماح بطلبات الصداقة</p>
                <p className="text-[10px] text-muted-foreground">تمكين الآخرين من إرسال طلبات لك</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl">
              <Switch 
                checked={privacy.showEarnings} 
                onCheckedChange={(c) => setPrivacy({...privacy, showEarnings: c})} 
              />
              <div className="text-right">
                <p className="font-bold text-sm">إظهار الأرباح التراكمية</p>
                <p className="text-[10px] text-muted-foreground">عرض إجمالي ما ربحته من المنصة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave} 
          disabled={loading} 
          className="w-full h-14 rounded-2xl font-black text-lg shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin" /> : "حفظ التغييرات"}
        </Button>
      </div>
    </div>
  );
}
