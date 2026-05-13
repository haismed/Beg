
"use client";

import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, limit } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, Megaphone, Users, CheckCircle, Target, Loader2, Gavel, Image as ImageIcon, Video as VideoIcon, Type, Link as LinkIcon, X, Sparkles, Hash 
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trackPlatformActivity } from "@/lib/platform-service";
import { extractHashtags, validateHashtagLimit } from "@/lib/hashtag-service";

const TOPICS_LIST = [
  { id: "tech", name: "التقنية", icon: "💻" },
  { id: "business", name: "ريادة الأعمال", icon: "💼" },
  { id: "design", name: "التصميم", icon: "🎨" },
  { id: "marketing", name: "التسويق", icon: "📈" },
  { id: "health", name: "الصحة", icon: "🏥" },
  { id: "education", name: "التعليم", icon: "📚" },
  { id: "crypto", name: "العملات الرقمية", icon: "₿" },
  { id: "ai", name: "الذكاء الاصطناعي", icon: "🤖" },
];

export default function AdvertisePage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topicId, setTopicId] = useState("");
  const [budget, setBudget] = useState("100");
  const [externalLink, setExternalLink] = useState("");
  const [campaignType, setCampaignType] = useState<"BASIC" | "PREMIUM">("BASIC");
  const [requiredHashtag, setRequiredHashtag] = useState("");
  const [mediaType, setMediaType] = useState<"text" | "image" | "video">("text");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 State
  const [creators, setCreators] = useState<any[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [fetchingCreators, setFetchingCreators] = useState(false);

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mediaType === "image" && file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "حجم الملف كبير", description: "الحد الأقصى للصور هو 5MB." });
      return;
    }
    if (mediaType === "video") {
      if (file.size > 50 * 1024 * 1024) {
        toast({ variant: "destructive", title: "حجم الملف كبير", description: "الحد الأقصى للفيديو هو 50MB." });
        return;
      }
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 60) {
          toast({ variant: "destructive", title: "فيديو طويل جداً", description: "الحد الأقصى لمدّة الإعلان هو 60 ثانية." });
          setMediaUrl(null);
        }
      }
      video.src = URL.createObjectURL(file);
    }
    const reader = new FileReader();
    reader.onload = (event) => setMediaUrl(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const totalBudget = Number(budget);
  const platformFee = totalBudget * 0.20; // 20% Fixed
  const creatorsCut = totalBudget * 0.51; // 51% Creator
  const engagersReserve = totalBudget * 0.29; // 29% Engagers

  const handleNextToStep2 = async () => {
    if (!title || !content || !topicId || !budget) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى ملء جميع الحقول الإلزامية." });
      return;
    }

    if (campaignType === "PREMIUM" && !requiredHashtag.trim()) {
      toast({ variant: "destructive", title: "حملة مميزة", description: "يجب تحديد هاشتاق مطلوب لهذه الحملة." });
      return;
    }

    const tags = extractHashtags(content);
    if (!validateHashtagLimit(tags)) {
      toast({ variant: "destructive", title: "سبام هاشتاق", description: "الحد الأقصى 10 هاشتاقات في الوصف." });
      return;
    }

    if (campaignType === "PREMIUM" && !content.toLowerCase().includes(requiredHashtag.toLowerCase())) {
      toast({ variant: "destructive", title: "هاشتاق مفقود", description: "وصف الإعلان يجب أن يتضمن الهاشتاق المطلوب." });
      return;
    }

    setStep(2);
    setFetchingCreators(true);
    try {
      const q = query(collection(db, "users"), where("isCreator", "==", true), where("followedTopics", "array-contains", topicId), limit(20));
      const snap = await getDocs(q);
      setCreators(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } finally {
      setFetchingCreators(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!user || !userData) return;
    if (userData.totalPoints < totalBudget) {
      toast({ variant: "destructive", title: "رصيد غير كافي", description: `تحتاج لـ ${totalBudget} نقطة.` });
      return;
    }

    setLoading(true);
    try {
      const adDoc = await addDoc(collection(db, "ads"), {
        advertiserId: user.uid, advertiserName: userData.displayName, title, content, topicId, budget: totalBudget, netBudget: creatorsCut, status: "active", mediaType, mediaUrl, externalLink, campaignType, requiredHashtag: requiredHashtag.startsWith('#') ? requiredHashtag : `#${requiredHashtag}`, createdAt: serverTimestamp(), targetCreators: selectedCreators
      });

      for (const cid of selectedCreators) {
        const creator = creators.find(c => c.id === cid);
        await addDoc(collection(db, "adPlacements"), {
          adId: adDoc.id, creatorId: cid, advertiserId: user.uid, price: creator?.adPrice || 0, status: "pending", createdAt: serverTimestamp(), adTitle: title, adContent: content, mediaUrl, mediaType, externalLink, campaignType, requiredHashtag: requiredHashtag.startsWith('#') ? requiredHashtag : `#${requiredHashtag}`
        });
      }

      await updateDoc(doc(db, "users", user.uid), {
        totalPoints: increment(-totalBudget),
        lockedPoints: increment(selectedCreators.length > 0 ? (creators.find(c => c.id === selectedCreators[0])?.adPrice || 0) : 0) // Simplified for demo
      });

      await trackPlatformActivity('fee', platformFee + engagersReserve, user.uid, "رسوم خدمة وحوافز تفاعل (49%)");

      toast({ title: "تم إطلاق الحملة", description: `تم خصم ${totalBudget} نقطة بنجاح.` });
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 text-right">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowRight /></Button></Link>
        <h1 className="text-2xl font-black flex items-center gap-2"><Megaphone className="text-primary" /> إعلان جديد</h1>
      </div>

      <div className="flex justify-between mb-8 px-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{s}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="rounded-3xl border-border bg-card overflow-hidden shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-2 bg-muted/30 p-1 rounded-2xl">
               <button onClick={() => setCampaignType("BASIC")} className={`py-3 rounded-xl font-bold transition-all ${campaignType === 'BASIC' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}>باقة عادية</button>
               <button onClick={() => setCampaignType("PREMIUM")} className={`py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${campaignType === 'PREMIUM' ? 'bg-primary text-white' : 'text-muted-foreground'}`}><Sparkles size={14}/> باقة Premium</button>
            </div>

            {campaignType === 'PREMIUM' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                 <label className="text-xs font-black flex items-center gap-1 text-primary">
                    <Hash size={14}/> الهاشتاق المطلوب للمكافأة (مثال: NokTek)
                 </label>
                 <Input value={requiredHashtag} onChange={(e) => setRequiredHashtag(e.target.value)} placeholder="اكتب الهاشتاق بدون #" className="h-12 rounded-xl text-left font-mono" />
                 <p className="text-[9px] text-muted-foreground">المستخدمين سيحصلون على 4 نقاط بدلاً من 2 عند استخدام هذا الهاشتاق.</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold mr-2">عنوان الإعلان</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="خصم 50%..." className="h-12 rounded-xl" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold mr-2">محتوى الإعلان</label>
              <div className="space-y-4">
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="اكتب نص الإعلان... (لا تنسى الهاشتاق المطلوب لو الباقة Premium)" className="min-h-[120px] rounded-xl" />
                <div className="flex gap-2">
                  <Button type="button" variant={mediaType === 'image' ? 'default' : 'outline'} onClick={() => { setMediaType('image'); fileInputRef.current?.click(); }} className="flex-1 rounded-xl gap-2 text-xs font-bold"><ImageIcon size={16} /> صورة</Button>
                  <Button type="button" variant={mediaType === 'video' ? 'default' : 'outline'} onClick={() => { setMediaType('video'); fileInputRef.current?.click(); }} className="flex-1 rounded-xl gap-2 text-xs font-bold"><VideoIcon size={16} /> فيديو</Button>
                  <Button type="button" variant={mediaType === 'text' ? 'default' : 'outline'} onClick={() => { setMediaType('text'); setMediaUrl(null); }} className="flex-1 rounded-xl gap-2 text-xs font-bold"><Type size={16} /> نص</Button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept={mediaType === 'image' ? "image/*" : "video/*"} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold mr-2 flex items-center gap-1"><LinkIcon size={14} className="text-primary" /> رابط خارجي</label>
              <Input value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://..." className="h-12 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold mr-2">المجال</label>
                <Select value={topicId} onValueChange={setTopicId}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="اختر..." /></SelectTrigger>
                  <SelectContent className="rounded-xl">{TOPICS_LIST.map(t => <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold mr-2">الميزانية</label>
                <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="h-12 rounded-xl font-black" />
              </div>
            </div>
            <Button onClick={handleNextToStep2} className="w-full h-14 rounded-2xl text-lg font-black gap-2">التالي: اختر المبدعين <Users size={20} /></Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
         <div className="space-y-4">
            <h3 className="font-black text-xl mb-4">اختر المبدعين لدعمك</h3>
            {fetchingCreators ? <Loader2 className="animate-spin mx-auto mt-10" /> : (
              creators.map(c => (
                <Card key={c.id} className={`rounded-3xl border-2 transition-all cursor-pointer ${selectedCreators.includes(c.id) ? 'border-primary bg-primary/5' : 'border-border'}`} onClick={() => {
                  setSelectedCreators(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]);
                }}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Avatar><AvatarImage src={c.photoURL}/><AvatarFallback>{c.displayName[0]}</AvatarFallback></Avatar>
                       <div>
                          <p className="font-bold">{c.displayName}</p>
                          <p className="text-[10px] text-muted-foreground">السعر: {c.adPrice} نقطة</p>
                       </div>
                    </div>
                    {selectedCreators.includes(c.id) && <CheckCircle className="text-primary" />}
                  </CardContent>
                </Card>
              ))
            )}
            <Button onClick={() => setStep(3)} disabled={selectedCreators.length === 0} className="w-full h-14 rounded-2xl font-black text-lg mt-6">التالي: مراجعة الدفع</Button>
         </div>
      )}

      {step === 3 && (
        <Card className="rounded-3xl border-primary bg-primary/5 overflow-hidden shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <h3 className="text-2xl font-black">جاهز للانطلاق؟</h3>
            <div className="bg-card border border-border p-4 rounded-2xl space-y-3 text-right" dir="rtl">
               <div className="flex justify-between text-sm font-bold flex-row-reverse"><span className="text-muted-foreground">إجمالي الميزانية:</span><span>{totalBudget} نقطة</span></div>
               <div className="flex justify-between text-sm font-bold flex-row-reverse text-[#FFD700]"><span>رسوم تشغيل وإدارة (20%):</span><span>-{platformFee.toFixed(0)} نقطة</span></div>
               <div className="flex justify-between text-sm font-bold flex-row-reverse text-green-500"><span>مكافآت المتفاعلين (29%):</span><span>-{engagersReserve.toFixed(0)} نقطة</span></div>
               <div className="h-px bg-border" />
               <div className="flex justify-between text-lg font-black flex-row-reverse"><span className="text-primary">الصافي للمبدعين (51%):</span><span className="text-green-500">{creatorsCut.toFixed(0)} نقطة</span></div>
            </div>
            <Button onClick={handleLaunchCampaign} disabled={loading} className="w-full h-16 rounded-2xl text-xl font-black gap-2">
              {loading ? <Loader2 className="animate-spin" /> : <>إطلاق الحملة <Megaphone size={24} /></>}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
