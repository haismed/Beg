
"use client";

import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { useEffect, useState, use, useRef } from "react";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Send, MessageCircle, Clock, Sparkles, CheckCircle2, Lock, Zap, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { initEngagement, getEngagement, rewardEngagement, validateComment, EngagementData } from "@/lib/engagement-service";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { COMMENT_REWARDS } from "@/lib/platform-service";

export default function PostDetailsPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params);
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [seconds, setSeconds] = useState(0);
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [likeWaitSeconds, setLikeWaitSeconds] = useState(0);
  const [commentWaitSeconds, setCommentWaitSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      const docSnap = await getDoc(doc(db, "posts", postId));
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setPost(data);
        if (user) {
          await initEngagement(postId, user.uid);
          const eng = await getEngagement(postId, user.uid);
          setEngagement(eng);
        }
      }
      setLoading(false);
    };

    fetchPost();

    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [postId, user]);

  const allRewardsDone = engagement?.tier4_reached && engagement?.likeRewarded && engagement?.commentRewarded && engagement?.shareRewarded;

  useEffect(() => {
    if (!user || loading || !post || !isActive || allRewardsDone) return;

    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1;
        
        // Tiers Logic
        if (next === 45 && !engagement?.tier1_reached) handleWatchReward('view', 15, 45);
        if (next === 180 && !engagement?.tier2_reached) handleWatchReward('tier2', 10, 135);
        if (next === 600 && !engagement?.tier3_reached) handleWatchReward('tier3', 10, 420);
        if (next === 601 && !engagement?.tier4_reached) handleWatchReward('tier4', 15, 1);

        return next;
      });
      
      if (likeWaitSeconds > 0) setLikeWaitSeconds(p => p - 1);
      if (commentWaitSeconds > 0) setCommentWaitSeconds(p => p - 1);

    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, loading, post, isActive, engagement, likeWaitSeconds, commentWaitSeconds, allRewardsDone]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      setIsActive(visible);
      if (!visible && !allRewardsDone) toast({ title: "العداد توقف", description: "يجب البقاء في الصفحة للربح." });
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [allRewardsDone]);

  const handleWatchReward = async (type: any, pts: number, secs: number) => {
    if (!user) return;
    const res = await rewardEngagement(user.uid, postId, type, pts, secs);
    if (res.success) {
      toast({ title: `+${pts} نقطة`, description: `تم الوصول لمستوى مشاهدة جديد.` });
      const eng = await getEngagement(postId, user.uid);
      setEngagement(eng);
    }
  };

  const handleLikeClick = async () => {
    if (!user || !engagement || !post) return;
    if (post.isSponsored && !engagement.tier1_reached) {
      toast({ variant: "destructive", title: "مشاهدة مطلوبة", description: "شاهد 45 ثانية أولاً لفتح المكافآت." });
      return;
    }
    if (engagement.likeRewarded) return;

    setLikeWaitSeconds(10);
    toast({ title: "جاري المعالجة", description: "انتظر 10 ثواني..." });

    setTimeout(async () => {
      const res = await rewardEngagement(user.uid, postId, 'like', 1, 10);
      if (res.success) {
        toast({ title: "كسبت 1 نقطة", description: "شكراً لتفاعلك." });
        const eng = await getEngagement(postId, user.uid);
        setEngagement(eng);
      }
    }, 10000);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !post || !engagement) return;
    if (post.isSponsored && !engagement.likeRewarded) {
      toast({ variant: "destructive", title: "تفاعل مطلوب", description: "أعجب بالمنشور أولاً." });
      return;
    }

    const validation = validateComment(newComment, post);
    if (!validation.valid) {
      toast({ variant: "destructive", title: "خطأ في التعليق", description: validation.reason });
      return;
    }

    try {
      await addDoc(collection(db, "posts", postId, "comments"), {
        text: newComment,
        authorId: user.uid,
        authorName: userData?.displayName || user.displayName,
        authorPhotoURL: userData?.photoURL || user.photoURL,
        createdAt: serverTimestamp(),
      });
      updateDoc(doc(db, "posts", postId), { commentCount: increment(1) });

      if (!engagement.commentRewarded) {
        const rewardType = validation.type === 'PREMIUM' ? 'comment_premium' : 'comment';
        const points = validation.type === 'PREMIUM' ? COMMENT_REWARDS.PREMIUM : COMMENT_REWARDS.BASIC;
        
        setCommentWaitSeconds(15);
        toast({ title: "جاري المعالجة", description: "انتظر 15 ثانية لمراجعة التعليق..." });
        
        setTimeout(async () => {
          const res = await rewardEngagement(user.uid, postId, rewardType, points, 15);
          if (res.success) {
            toast({ 
              title: validation.type === 'PREMIUM' ? "كسبت 4 نقاط!" : "كسبت 2 نقطة", 
              description: validation.type === 'PREMIUM' ? "شكراً لاستخدام الهاشتاق المطلوب." : "تم احتساب مكافأة التعليق." 
            });
            const eng = await getEngagement(postId, user.uid);
            setEngagement(eng);
          }
        }, 15000);
      }
      setNewComment("");
    } catch (e) {}
  };

  if (loading) return <div className="p-10 text-center animate-pulse">جاري التحميل...</div>;
  if (!post) return <div className="p-10 text-center">المنشور غير موجود</div>;

  const earnedPoints = (engagement?.tier1_reached ? 15 : 0) + 
                       (engagement?.tier2_reached ? 10 : 0) + 
                       (engagement?.tier3_reached ? 10 : 0) + 
                       (engagement?.tier4_reached ? 15 : 0) +
                       (engagement?.likeRewarded ? 1 : 0) + 
                       (engagement?.commentRewarded ? (engagement.commentType === 'PREMIUM' ? 4 : 2) : 0) + 
                       (engagement?.shareRewarded ? 3 : 0);

  const maxPoints = post.isSponsored ? (post.campaignType === 'PREMIUM' ? 73 : 71) : 21;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full"><ArrowRight /></Button>
          </Link>
          <h1 className="text-xl font-black">تفاصيل النقطة</h1>
        </div>
        {user && !allRewardsDone && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Clock size={14} className={isActive ? "animate-spin" : ""} />
              <span>{seconds}ث</span>
              <span className="text-muted-foreground mr-1">/ 10د+</span>
            </div>
            <Progress value={Math.min(100, (seconds / 600) * 100)} className="w-24 h-1" />
          </div>
        )}
      </div>

      {post.isSponsored && (
        <Card className="mb-6 rounded-3xl border-primary/20 bg-primary/5 p-5">
           <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-black flex items-center gap-2 text-primary">
                 <Sparkles size={16}/> مكافأتك: {earnedPoints}/{maxPoints} نقطة
              </p>
              {allRewardsDone && (
                 <Badge className="bg-green-500/20 text-green-500 border-none">✅ اكتملت المكافآت</Badge>
              )}
           </div>
           
           <div className="space-y-4">
              <div className="flex justify-around gap-2">
                 {[
                   { label: '45ث', done: engagement?.tier1_reached },
                   { label: '3د', done: engagement?.tier2_reached },
                   { label: '10د', done: engagement?.tier3_reached },
                   { label: '10د+', done: engagement?.tier4_reached },
                 ].map((t, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${t.done ? 'bg-primary border-primary text-white' : 'bg-background border-border text-muted-foreground'}`}>
                          {t.done ? <CheckCircle2 size={16}/> : <span className="text-[10px] font-bold">{i+1}</span>}
                       </div>
                       <span className="text-[8px] font-bold">{t.label}</span>
                    </div>
                 ))}
              </div>
              <div className="h-px bg-primary/10" />
              <div className="flex justify-around gap-2 opacity-80">
                 {[
                   { label: 'إعجاب', done: engagement?.likeRewarded },
                   { label: post.campaignType === 'PREMIUM' ? 'تعليق مميز' : 'تعليق', done: engagement?.commentRewarded },
                   { label: 'مشاركة', done: engagement?.shareRewarded },
                 ].map((t, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${t.done ? 'bg-secondary border-secondary text-white' : 'bg-background border-border text-muted-foreground'}`}>
                          {t.done ? <CheckCircle2 size={12}/> : <Zap size={10}/>}
                       </div>
                       <span className="text-[8px] font-bold">{t.label}</span>
                    </div>
                 ))}
              </div>
           </div>
        </Card>
      )}

      {post.campaignType === 'PREMIUM' && !engagement?.commentRewarded && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl mb-6 flex items-start gap-3">
          <AlertCircle className="text-yellow-600 shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-black text-yellow-700 text-sm">🎯 حملة مميزة: مكافأة مضاعفة!</h4>
            <p className="text-xs text-yellow-600 font-bold leading-relaxed">
              استخدم هاشتاق <span className="text-primary font-black select-all">{post.requiredHashtag}</span> في تعليقك لتحصل على 4 نقاط بدلاً من 2.
            </p>
          </div>
        </div>
      )}

      <PostCard 
        post={post} 
        onLikeOverride={handleLikeClick} 
        likeDisabled={allRewardsDone || (post.isSponsored && !engagement?.tier1_reached)} 
      />

      <div className="mt-8 space-y-6">
        <h3 className="font-bold flex items-center gap-2"><MessageCircle size={18} className="text-primary" /> النقاش ({comments.length})</h3>

        <form onSubmit={handleSendComment} className={`flex gap-2 bg-card p-3 rounded-2xl border transition-all ${(!post.isSponsored || engagement?.tier1_reached) ? 'border-primary/20 shadow-md' : 'border-border opacity-50'}`}>
          <Input 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={allRewardsDone || (post.isSponsored && !engagement?.tier1_reached) || commentWaitSeconds > 0}
            placeholder={commentWaitSeconds > 0 ? `انتظر ${commentWaitSeconds}ث...` : allRewardsDone ? "اكتملت المكافآت!" : "أضف تعليقاً مفيداً..."}
            className="flex-1 bg-background border-none h-12 rounded-xl"
          />
          <Button type="submit" disabled={!newComment.trim() || allRewardsDone || commentWaitSeconds > 0} className="h-12 w-12 rounded-xl p-0"><Send size={18} /></Button>
        </form>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-card/40 p-4 rounded-2xl border border-border/50 flex gap-3">
              <Avatar className="w-10 h-10"><AvatarImage src={comment.authorPhotoURL} /><AvatarFallback>{comment.authorName?.[0]}</AvatarFallback></Avatar>
              <div className="flex-1 text-right">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-black">{comment.authorName}</h4>
                  <span className="text-[10px] text-muted-foreground">{comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: ar }) : "الآن"}</span>
                </div>
                <p className="text-sm leading-relaxed">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
