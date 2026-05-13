
'use client';

import { useAuth } from "@/context/auth-context";
import { useEffect, useState, use } from "react";
import { getUserProfile } from "@/lib/profile-service";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ShieldCheck, Lock, Loader2, Sparkles, MessageCircle, Star, Heart, Calendar } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import FriendshipButton from "@/components/FriendshipButton";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    const result = await getUserProfile(userId, user?.uid);
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [userId, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10" /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center font-bold">المستخدم غير موجود</div>;

  const { profile } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 text-right">
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight />
          </Button>
        </Link>
        <h1 className="text-xl font-black">ملف المستخدم</h1>
        <div className="w-10" />
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 mb-8 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
        {profile.isVerified && (
          <div className="absolute top-4 right-4">
             <Badge className="bg-primary text-white font-black rounded-full gap-1"><ShieldCheck size={12}/> موثق</Badge>
          </div>
        )}
        
        <Avatar className="w-28 h-24 border-4 border-primary/20 mb-4 rounded-3xl">
          <AvatarImage src={profile.photoURL} />
          <AvatarFallback className="rounded-3xl">{profile.displayName[0]}</AvatarFallback>
        </Avatar>
        
        <h2 className="text-2xl font-black mb-1">{profile.displayName}</h2>
        <p className="text-primary font-mono text-xs mb-3">@{profile.username}</p>
        
        <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed italic">
          {profile.bio || "لا يوجد وصف حالياً."}
        </p>

        <div className="flex gap-4 mb-6">
           <div className="text-center">
              <p className="font-black text-lg">{profile.stats?.friendsCount || 0}</p>
              <p className="text-[10px] text-muted-foreground font-bold">صديق</p>
           </div>
           <div className="w-px h-8 bg-border self-center" />
           <div className="text-center">
              <p className="font-black text-lg">{profile.stats?.postsCount || 0}</p>
              <p className="text-[10px] text-muted-foreground font-bold">منشور</p>
           </div>
           <div className="w-px h-8 bg-border self-center" />
           <div className="text-center">
              <p className="font-black text-lg">{profile.stats?.totalLikes || 0}</p>
              <p className="text-[10px] text-muted-foreground font-bold">إعجاب</p>
           </div>
        </div>

        <div className="flex gap-3 w-full">
           <div className="flex-1">
              <FriendshipButton 
                targetUserId={userId} 
                currentUserId={user?.uid || ""} 
                initialStatus={profile.friendshipStatus}
                requestedBy={profile.requestedBy}
                onStatusChange={fetchProfile}
              />
           </div>
           <Button variant="outline" className="flex-1 rounded-xl font-bold gap-2">
              <MessageCircle size={18} />
              رسالة
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="rounded-3xl border-border bg-card overflow-hidden">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1">
              <Star size={12} className="text-yellow-500" /> إجمالي النقاط
            </p>
            <div className="flex items-center gap-2">
               {profile.totalPoints !== null ? (
                 <p className="text-2xl font-black text-primary">{profile.totalPoints.toLocaleString()}</p>
               ) : (
                 <div className="flex items-center gap-1 text-muted-foreground">
                   <Lock size={14} />
                   <span className="text-[10px] font-bold">مخفي بالخصوصية</span>
                 </div>
               )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border bg-card overflow-hidden">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar size={12} /> تاريخ الانضمام
            </p>
            <p className="text-xs font-black">
              {profile.joinedAt?.seconds ? formatDistanceToNow(profile.joinedAt.seconds * 1000, { addSuffix: true, locale: ar }) : "قريباً"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
         <h3 className="font-black text-lg flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            آخر النشاطات
         </h3>
         
         {profile.friendshipStatus === 'accepted' || profile.friendshipStatus === 'self' ? (
            <div className="text-center py-10 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
               <p className="text-muted-foreground text-sm font-bold italic">لا توجد منشورات عامة متاحة حالياً.</p>
            </div>
         ) : (
            <Card className="rounded-3xl border-dashed border-2 border-border bg-muted/10">
               <CardContent className="p-10 text-center space-y-4">
                  <Lock className="mx-auto text-muted-foreground opacity-30" size={40} />
                  <p className="text-sm font-bold text-muted-foreground">يجب أن تكونوا أصدقاء لمشاهدة المنشورات الخاصة.</p>
               </CardContent>
            </Card>
         )}
      </div>

      <BottomNav />
    </div>
  );
}
