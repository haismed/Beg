"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, Wallet, Lock, Loader2, Filter, Edit3, 
  Megaphone, Sparkles, ShoppingCart, 
  Send, Gavel, UserCircle, Store, LayoutDashboard, Settings,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { doc, query, collection, where, getDocs, serverTimestamp, runTransaction, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trackPlatformActivity } from "@/lib/platform-service";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

export default function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  if (loading || !user || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  const withdrawableBalance = userData.withdrawablePoints || 0;
  const maxTransfer = Math.floor(withdrawableBalance * 0.49);
  const inputAmount = Number(transferAmount) || 0;
  const isOverLimit = inputAmount > maxTransfer;

  const handleTransfer = async () => {
    if (!transferTarget || !transferAmount || !user || !userData) return;
    const amount = Math.floor(inputAmount);
    if (amount <= 0 || isOverLimit) return;

    const fee = Math.floor(amount * 0.07);
    const net = amount - fee;

    setTransferLoading(true);
    try {
      const q = query(collection(db, "users"), where("email", "==", transferTarget.trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "مستخدم غير موجود", description: "تأكد من البريد الإلكتروني للمستلم." });
        setTransferLoading(false);
        return;
      }

      const targetDoc = snap.docs[0];
      const targetUid = targetDoc.id;

      if (targetUid === user.uid) {
        toast({ variant: "destructive", title: "خطأ", description: "لا يمكنك التحويل لنفسك." });
        setTransferLoading(false);
        return;
      }

      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, "users", user.uid);
        const receiverRef = doc(db, "users", targetUid);
        
        const senderSnap = await transaction.get(senderRef);
        if (!senderSnap.exists()) throw "Sender not found";
        
        const currentWithdrawable = senderSnap.data().withdrawablePoints || 0;
        const currentMax = Math.floor(currentWithdrawable * 0.49);

        if (amount > currentWithdrawable) throw "رصيد غير كافي";
        if (amount > currentMax) throw "تجاوزت حد الـ 49%";

        transaction.update(senderRef, {
          withdrawablePoints: currentWithdrawable - amount,
          totalPoints: (senderSnap.data().totalPoints || 0) - amount
        });

        transaction.update(receiverRef, {
          withdrawablePoints: (targetDoc.data().withdrawablePoints || 0) + net,
          totalPoints: (targetDoc.data().totalPoints || 0) + net
        });
      });

      await trackPlatformActivity('fee', fee, user.uid, `رسوم تحويل نقاط (7%) من ${userData.displayName}`);
      
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount: -amount,
        type: 'transfer',
        description: `تحويل ${amount} نقطة إلى مستخدم - صافي: ${net}`,
        createdAt: serverTimestamp()
      });

      toast({ title: "تم التحويل بنجاح", description: `تم إرسال ${net} نقطة بنجاح (بعد خصم 7% رسوم).` });
      setIsTransferOpen(false);
      setTransferAmount("");
      setTransferTarget("");
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "فشل التحويل", description: typeof e === 'string' ? e : "حدث خطأ غير متوقع." });
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 text-right">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowRight />
            </Button>
          </Link>
          <h1 className="text-2xl font-black">الملف الشخصي</h1>
        </div>
        <div className="flex gap-2">
           <Link href="/settings/privacy">
             <Button variant="ghost" size="icon" className="rounded-xl border border-border">
                <Settings size={20} className="text-muted-foreground" />
             </Button>
           </Link>
           <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl font-bold gap-2 border-primary/30 text-primary">
                  <Send size={18} />
                  تحويل
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl bg-card border-border max-w-[95vw] sm:max-w-[450px]">
                <DialogHeader>
                  <VisuallyHidden.Root><DialogTitle>تحويل نقاط</DialogTitle></VisuallyHidden.Root>
                  <DialogTitle className="text-xl font-black text-right">تحويل نقاط للصداقة</DialogTitle>
                  <DialogDescription className="text-right text-xs leading-relaxed">
                    التحويل يتم بالنقاط فقط من رصيدك القابل للسحب. الحد الأقصى 49% لكل عملية. تطبق رسوم خدمة المنصة بنسبة 7%.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2 text-right">
                    <label className="text-xs font-bold mr-2">البريد الإلكتروني للمستلم</label>
                    <Input 
                      placeholder="name@example.com"
                      value={transferTarget}
                      onChange={(e) => setTransferTarget(e.target.value)}
                      className="rounded-xl h-12 text-right"
                    />
                  </div>
                  
                  <div className="space-y-2 text-right">
                    <div className="flex justify-between px-2 text-[10px] font-bold">
                       <span className="text-muted-foreground">الرصيد القابل للسحب: {withdrawableBalance.toFixed(1)}</span>
                       <span className="text-[#FFD700]">الحد المسموح: {maxTransfer} نقطة</span>
                    </div>
                    <label className="text-xs font-bold mr-2">كم نقطة تود إرسالها؟</label>
                    <Input 
                      type="number"
                      max={maxTransfer}
                      placeholder={`الحد الأقصى ${maxTransfer}`}
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className={`rounded-xl h-12 text-right text-lg font-black ${isOverLimit ? 'border-destructive ring-destructive/20' : ''}`}
                    />
                  </div>

                  {inputAmount > 0 && !isOverLimit && (
                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-2 animate-in fade-in slide-in-from-top-1">
                      <div className="flex justify-between text-xs font-bold flex-row-reverse">
                        <span className="text-muted-foreground">النقاط المخصومة منك:</span>
                        <span>{inputAmount} نقطة</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold flex-row-reverse text-destructive">
                        <span className="flex items-center gap-1">رسوم التحويل 7%: <Gavel size={10}/></span>
                        <span>-{Math.floor(inputAmount * 0.07)} نقطة</span>
                      </div>
                      <div className="h-px bg-border my-1" />
                      <div className="flex justify-between text-sm font-black flex-row-reverse">
                        <span className="text-primary">سيصل للصديق:</span>
                        <span className="text-lg">{Math.floor(inputAmount * 0.93)} نقطة</span>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex-col gap-3">
                  <Button 
                    onClick={handleTransfer} 
                    disabled={transferLoading || !transferTarget || !transferAmount || inputAmount <= 0 || isOverLimit || withdrawableBalance === 0} 
                    className="w-full h-14 rounded-2xl font-black text-lg shadow-lg"
                  >
                    {transferLoading ? <Loader2 className="animate-spin" /> : "تأكيد وإرسال النقاط الآن"}
                  </Button>
                </DialogFooter>
              </DialogContent>
           </Dialog>

          <Link href="/shop">
            <Button variant="outline" className="rounded-xl font-bold gap-2 bg-blue-500/10 border-blue-500/20 text-blue-600">
              <ShoppingCart size={18} />
              اشحن
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 mb-8 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
        <div className="absolute top-4 right-4 flex flex-col gap-2">
           {userData.isCreator && <Badge className="bg-primary text-white font-black rounded-full gap-1"><Sparkles size={12}/> مبدع</Badge>}
           <Link href={`/profile/${user.uid}`}>
             <Badge variant="outline" className="text-primary border-primary/20 cursor-pointer hover:bg-primary/5 rounded-full gap-1">
                <UserCircle size={10}/> عرض كعام
             </Badge>
           </Link>
        </div>
        <Avatar className="w-24 h-24 border-4 border-primary/20 mb-4 rounded-3xl">
          <AvatarImage src={user.photoURL} />
          <AvatarFallback className="rounded-3xl">{user.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-black mb-1">{user.displayName}</h2>
        <p className="text-xs text-primary font-mono mb-3">@{userData.username || user.uid.slice(0,8)}</p>
        
        <div className="flex gap-4 mb-4">
           <div className="text-center">
              <p className="font-black">{userData.stats?.friendsCount || 0}</p>
              <p className="text-[10px] text-muted-foreground">صديق</p>
           </div>
           <div className="text-center">
              <p className="font-black">{userData.stats?.postsCount || 0}</p>
              <p className="text-[10px] text-muted-foreground">منشور</p>
           </div>
        </div>

        <div className="flex gap-2">
          <Badge variant="secondary" className="px-4 py-1 rounded-full text-xs font-bold">
            إجمالي الثروة: {userData.totalPoints?.toFixed(0)}
          </Badge>
          <Link href="/fees">
            <Button size="sm" variant="ghost" className="text-[10px] text-primary font-bold gap-1 underline p-0 h-auto">
               جدول الرسوم
            </Button>
          </Link>
        </div>
      </div>

      {/* المحافظ الاقتصادية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="rounded-3xl border-none bg-green-500/10 overflow-hidden relative group">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-green-600 mb-1 flex items-center gap-1">
              <Wallet size={12} /> قابل للسحب (51%)
            </p>
            <p className="text-3xl font-black text-green-600">{withdrawableBalance.toFixed(1)}</p>
            <Link href="/wallet/withdraw">
               <Button className="w-full mt-4 h-10 rounded-xl bg-green-600 hover:bg-green-700 font-bold text-xs">
                  سحب كاش
               </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-amber-500/10 overflow-hidden relative">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-amber-600 mb-1 flex items-center gap-1">
              <Lock size={12} /> المجمد (49%)
            </p>
            <p className="text-3xl font-black text-amber-600">{(userData.lockedPoints || 0).toFixed(1)}</p>
            <Link href="/wallet/convert">
               <Button className="w-full mt-4 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs gap-1">
                  <RefreshCw size={12} /> تفعيل للإعلان
               </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-blue-500/10 overflow-hidden relative">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-blue-600 mb-1 flex items-center gap-1">
              <Megaphone size={12} /> الرصيد الإعلاني
            </p>
            <p className="text-3xl font-black text-blue-600">{((userData.adBalance || 0) + (userData.purchasedAdBalance || 0)).toFixed(1)}</p>
            <Link href="/shop">
               <Button variant="outline" className="w-full mt-4 h-10 rounded-xl border-blue-600 text-blue-600 font-bold text-xs gap-1">
                  <ShoppingCart size={12} /> المتجر
               </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* شبكة الأدوار الجديدة (تاجر، مبدع، معلن) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        
        {/* 1. زر وضع التاجر - Seller Mode */}
        {!userData.isSeller ? (
          <Link href="/seller/onboarding" className="w-full">
            <Button 
              variant="outline" 
              className="w-full border-purple-500 text-purple-400 hover:bg-purple-500/10 h-14 rounded-2xl font-bold"
            >
              <Store className="ml-2 h-4 w-4" />
              افتح متجرك
            </Button>
          </Link>
        ) : (
          <Link href="/seller/dashboard" className="w-full">
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 h-14 rounded-2xl font-black"
            >
              <LayoutDashboard className="ml-2 h-4 w-4" />
              لوحة التاجر
            </Button>
          </Link>
        )}

        {/* 2. زر وضع المبدع - Creator Mode */}
        {userData.isCreator ? (
          <Link href="/creator/ads" className="w-full">
            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 h-14 rounded-2xl font-black"
            >
              <Sparkles className="ml-2 h-4 w-4" />
              لوحة المبدع
            </Button>
          </Link>
        ) : (
          <Link href="/creator/onboarding" className="w-full">
            <Button 
              variant="outline"
              className="w-full border-orange-500 text-orange-400 hover:bg-orange-500/10 h-14 rounded-2xl font-bold"
            >
              <Sparkles className="ml-2 h-4 w-4" />
              كن مؤثراً
            </Button>
          </Link>
        )}

        {/* 3. زر أطلق حملتك - Ads */}
        <Link href="/ads/create" className="w-full">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-black"
          >
            <Megaphone className="ml-2 h-4 w-4" />
            أطلق حملتك
          </Button>
        </Link>

      </div>

      <div className="bg-card border border-border rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
           <h3 className="font-bold flex items-center gap-2">
              <Filter size={18} className="text-primary" />
              تخصصاتي ({userData.followedTopics?.length || 0}/3)
           </h3>
           <Link href="/topics">
              <Button variant="ghost" size="sm" className="text-primary gap-1 font-bold">
                 <Edit3 size={14} />
                 تعديل
              </Button>
           </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {userData.followedTopics?.map((topicId: string) => (
             <Badge key={topicId} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1.5 rounded-xl text-sm font-bold">
               {topicId}
             </Badge>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
