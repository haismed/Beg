
"use client";

import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Flag, 
  ShieldCheck, Lock, PlayCircle, Star, Sparkles, Zap, 
  CheckCircle2, Copy, Send, Rocket
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { rewardEngagement, getEngagement, recordShareClick } from "@/lib/engagement-service";
import { canUserFeaturePost, getRemainingTime, featurePost } from "@/lib/featured-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import BoostModal from "./BoostModal";

interface PostCardProps {
  post: any;
  onLikeOverride?: () => void;
  likeDisabled?: boolean;
}

export default function PostCard({ post, onLikeOverride, likeDisabled }: PostCardProps) {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [isFeatureLoading, setIsFeatureLoading] = useState(false);
  const [engData, setEngData] = useState<any>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBoostOpen, setIsBoostOpen] = useState(false);

  useEffect(() => {
    if (user) {
      getEngagement(post.id, user.uid).then(setEngData);
    }
  }, [user, post.id]);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}?ref=${user?.uid || 'anon'}` : '';
  const shareText = `شاهد هذا المحتوى المثير على NokTek: ${post.title || post.text.substring(0, 50)}...`;

  const handleLike = async () => {
    if (onLikeOverride) {
      onLikeOverride();
      return;
    }
    if (!user) {
      toast({ title: "دخول مطلوب", description: "سجل دخولك للتفاعل." });
      return;
    }
    try {
      updateDoc(doc(db, "posts", post.id), { likeCount: increment(1) });
    } catch (e) {}
  };

  const handleShareClick = async () => {
    if (!user) { toast({ title: "دخول مطلوب" }); return; }
    if (post.isSponsored && (!engData || !engData.tier1_reached)) {
      toast({ variant: "destructive", title: "مشاهدة مطلوبة", description: "شاهد 45 ثانية أولاً لفتح ميزة المشاركة." });
      return;
    }
    if (engData?.shareRewarded) {
       toast({ title: "تم حصد المكافأة", description: "لقد ربحت نقاط المشاركة لهذا المنشور مسبقاً." });
       setIsShareModalOpen(true); return;
    }
    await recordShareClick(post.id, user.uid);
    if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title: 'NokTek - اقتصاد التفاعل', text: shareText, url: shareUrl });
        processShareReward("Native");
      } catch (err) {}
    } else {
      setIsShareModalOpen(true);
    }
  };

  const processShareReward = (platform: string) => {
    toast({ title: "جاري المعالجة", description: `شكراً للمشاركة عبر ${platform}. انتظر 15 ثانية للمكافأة...` });
    setTimeout(async () => {
      const res = await rewardEngagement(user!.uid, post.id, 'share', 3, 15);
      if (res.success) {
        toast({ title: "🎉 كسبت نقاط مضاعفة!", description: "تمت إضافة مكافأة المشاركة بنجاح." });
        getEngagement(post.id, user!.uid).then(setEngData);
        updateDoc(doc(db, "posts", post.id), { shareCount: increment(1) });
      }
    }, 15000);
  };

  const handleFeature = async () => {
    if (!user || !userData) return;
    if (!canUserFeaturePost(userData.lastFeaturedPostAt)) {
      toast({ variant: "destructive", title: "مهلاً!", description: getRemainingTime(userData.lastFeaturedPostAt) });
      return;
    }
    setIsFeatureLoading(true);
    try {
      await featurePost(post.id, user.uid);
      toast({ title: "تم التميز!" });
    } finally { setIsFeatureLoading(false); }
  };

  const multiplier = (post.isBoosted && post.boostConfig?.remainingBudget > 0) ? (post.boostConfig.rewardMultiplier || 1) : 1;

  const earnedPoints = (engData?.tier1_reached ? 15 : 0) * multiplier + 
                       (engData?.tier2_reached ? 10 : 0) * multiplier + 
                       (engData?.tier3_reached ? 10 : 0) * multiplier + 
                       (engData?.tier4_reached ? 15 : 0) * multiplier +
                       (engData?.likeRewarded ? 1 : 0) * multiplier + 
                       (engData?.commentRewarded ? (engData.commentType === 'PREMIUM' ? 4 : 2) : 0) * multiplier + 
                       (engData?.shareRewarded ? 3 : 0) * multiplier;

  const maxPoints = (post.isSponsored ? (post.campaignType === 'PREMIUM' ? 73 : 71) : 21) * multiplier;

  return (
    <div className={`bg-card border rounded-3xl p-5 mb-5 shadow-sm hover:shadow-md transition-all text-right relative overflow-hidden ${post.isFeatured ? 'border-yellow-500/50 ring-2 ring-yellow-500/10' : 'border-border'} ${post.isSponsored ? 'border-primary/30 ring-1 ring-primary/10' : ''} ${post.isBoosted ? 'border-orange-500/40' : ''}`}>
      {post.isFeatured && (
        <div className="absolute top-0 left-0 bg-yellow-500 text-black px-3 py-1 rounded-br-2xl flex items-center gap-1 text-[10px] font-black z-10">
          <Star size={12} fill="currentColor" /> منشور مميز
        </div>
      )}

      {post.isBoosted && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 rounded-bl-2xl flex items-center gap-1 text-[10px] font-black z-10">
          <Rocket size={12} fill="currentColor" /> {post.boostConfig?.rewardMultiplier}x معزز
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4 flex-row-reverse">
        <div className="flex items-center gap-3 flex-row-reverse">
          <Avatar className="w-11 h-11 border-2 border-primary/10">
            <AvatarImage src={post.authorPhotoURL} />
            <AvatarFallback>{post.authorName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="text-right">
            <div className="flex items-center gap-1 flex-row-reverse">
               <h3 className="font-bold text-sm">{post.authorName}</h3>
               {post.isSponsored && <Badge variant="outline" className="text-[8px] h-4 bg-primary/10 text-primary gap-1 font-black">مبدع موثق <ShieldCheck size={8} /></Badge>}
            </div>
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="text-[10px] text-muted-foreground font-medium">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: ar }) : "الآن"}</span>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full font-bold">{post.topicName || "عام"}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {user?.uid === post.authorId && !post.isBoosted && (
             <Button variant="ghost" size="sm" onClick={() => setIsBoostOpen(true)} className="text-orange-500 font-black h-8 text-[10px] gap-1 hover:bg-orange-50">
               <Rocket size={12} /> تعزيز
             </Button>
           )}
           <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full h-8 w-8"><MoreHorizontal size={18} /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              {user && <DropdownMenuItem onClick={handleFeature} className="font-bold gap-2 text-yellow-500"><Sparkles size={14} /> تميز هذا المنشور</DropdownMenuItem>}
              <DropdownMenuItem className="text-destructive font-bold gap-2"><Flag size={14} /> إبلاغ</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className={`mb-4 p-3 rounded-2xl border transition-all ${post.isBoosted ? 'bg-orange-500/5 border-orange-500/20' : 'bg-primary/5 border-primary/10'}`}>
         <div className={`flex justify-between items-center text-[10px] font-black mb-2 ${post.isBoosted ? 'text-orange-600' : 'text-primary'}`}>
            <span>مكافأتك: {earnedPoints}/{maxPoints} نقطة {multiplier > 1 && `(${multiplier}x 🔥)`}</span>
            <div className="flex gap-2">
               <span className={engData?.tier1_reached ? 'text-green-500' : 'text-muted-foreground'}>{engData?.tier1_reached ? '✅' : '⭕'} مشاهدة</span>
               <span className={engData?.shareRewarded ? 'text-green-500' : 'text-muted-foreground'}>{engData?.shareRewarded ? '✅' : '⭕'} مشاركة</span>
            </div>
         </div>
         <Progress value={(earnedPoints / maxPoints) * 100} className={`h-1 ${post.isBoosted ? '[&>div]:bg-orange-500' : ''}`} />
         {post.isBoosted && (
           <div className="flex justify-around gap-2 mt-2 opacity-80 text-[8px] font-bold text-orange-700">
             <span>⭕ مشاهدة {15*multiplier}</span>
             <span>⭕ لايك {1*multiplier}</span>
             <span>⭕ تعليق {2*multiplier}</span>
             <span>⭕ مشاركة {3*multiplier}</span>
           </div>
         )}
      </div>

      <Link href={`/posts/${post.id}`}>
        {post.title && <h2 className="text-xl font-black mb-2">{post.title}</h2>}
        {post.mediaUrl && (
          <div className="rounded-2xl overflow-hidden mb-4 border border-border relative">
            {post.contentType === 'video' ? <><video src={post.mediaUrl} className="w-full h-auto max-h-[400px]" /><div className="absolute inset-0 flex items-center justify-center bg-black/20"><PlayCircle className="text-white w-16 h-16 opacity-80" /></div></> : <img src={post.mediaUrl} className="w-full h-auto object-cover max-h-[400px]" />}
          </div>
        )}
        <p className="text-md mb-6 leading-relaxed whitespace-pre-wrap font-medium dir-rtl text-muted-foreground line-clamp-3">{post.text}</p>
      </Link>

      <div className="flex items-center justify-between border-t border-border pt-4 flex-row-reverse">
        <div className="flex items-center gap-2 flex-row-reverse">
          <button onClick={handleLike} disabled={likeDisabled} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors flex-row-reverse ${likeDisabled ? 'opacity-50 cursor-not-allowed bg-muted/50' : 'text-muted-foreground hover:bg-red-500/10 hover:text-red-500'}`}>
            {likeDisabled ? <Lock size={16} /> : <Heart size={20} className={post.likeCount > 0 ? "fill-red-500 text-red-500" : ""} />}
            <span className="text-sm font-bold">{post.likeCount || 0}</span>
          </button>
          <Link href={`/posts/${post.id}`}>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors flex-row-reverse">
              <MessageCircle size={20} /> <span className="text-sm font-bold">{post.commentCount || 0}</span>
            </button>
          </Link>
        </div>
        <button onClick={handleShareClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors flex-row-reverse ${engData?.shareRewarded ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:bg-secondary/10 hover:text-secondary'}`}>
          {engData?.shareRewarded ? <CheckCircle2 size={20} /> : <Share2 size={20} />}
          <span className="text-xs font-bold">{engData?.shareRewarded ? 'تمت المشاركة' : 'مشاركة'}</span>
        </button>
      </div>

      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="rounded-3xl bg-card border-border max-w-[90vw] sm:max-w-[450px]">
          <DialogHeader>
            <VisuallyHidden.Root><DialogTitle>مشاركة واكسب نقاط</DialogTitle></VisuallyHidden.Root>
            <h3 className="text-xl font-black text-right mb-2">شارك واكسب +{3*multiplier} نقاط 🔄</h3>
            <p className="text-xs text-muted-foreground text-right leading-relaxed">
              المكافأة تُحتسب مرة واحدة لكل منشور. يُشترط البقاء 15 ثانية بعد الضغط لضمان جودة المشاركة.
            </p>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-6">
            <Button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank'); processShareReward("WhatsApp"); setIsShareModalOpen(false); }} className="h-14 rounded-2xl bg-[#25D366] font-black text-white"><Send className="rotate-[-45deg] mr-2" /> واتساب</Button>
            <Button onClick={async () => { await navigator.clipboard.writeText(shareUrl); toast({ title: "تم نسخ الرابط" }); processShareReward("Copy Link"); setIsShareModalOpen(false); }} variant="outline" className="h-14 rounded-2xl gap-2 font-black border-border"><Copy size={18} /> نسخ الرابط</Button>
          </div>
        </DialogContent>
      </Dialog>

      <BoostModal 
        post={post} 
        userId={user?.uid || ""} 
        isOpen={isBoostOpen} 
        onClose={() => setIsBoostOpen(false)} 
      />
    </div>
  );
}
