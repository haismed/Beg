
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Send, Loader2, AlertCircle, Image as ImageIcon, Video, Link as LinkIcon, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackPlatformActivity, isRewardPoolOpen } from "@/lib/platform-service";
import { Badge } from "@/components/ui/badge";

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

export default function CreatePostPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [loading, setLoading] = useState(false);

  // تعريف المتغير لإصلاح خطأ ReferenceError
  const isSpecialAccount = userData?.isTestAccount || userData?.isAdmin || false;

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  const getCost = () => activeTab === "video" ? 3 : 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim() || !selectedTopic) return;

    const cost = getCost();
    
    if (!isSpecialAccount && (userData?.totalPoints || 0) < cost) {
      toast({ variant: "destructive", title: "رصيد غير كافي" });
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();

      let lockedDecrease = 0;
      let withdrawableDecrease = 0;

      if (!isSpecialAccount) {
        if (data?.lockedPoints >= cost) {
          lockedDecrease = cost;
        } else {
          lockedDecrease = data?.lockedPoints || 0;
          withdrawableDecrease = cost - lockedDecrease;
        }
      }

      const postData = {
        title,
        text: content,
        authorId: user.uid,
        authorName: userData?.displayName || user.displayName,
        authorPhotoURL: userData?.photoURL || user.photoURL,
        createdAt: serverTimestamp(),
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        totalSecondsSpent: 0,
        engagementScore: 0,
        topicId: selectedTopic,
        topicName: TOPICS_LIST.find(t => t.id === selectedTopic)?.name || "عام",
        contentType: activeTab,
        mediaUrl: (activeTab === 'image' || activeTab === 'video') ? mediaUrl : null,
        externalLink: activeTab === 'link' ? externalLink : null
      };

      await addDoc(collection(db, "posts"), postData);
      
      if (!isSpecialAccount) await trackPlatformActivity('post');

      const poolOpen = await isRewardPoolOpen();
      const rewardAmount = poolOpen ? 5 : 0; 

      const updatePayload: any = {
        postsCount: increment(1)
      };

      if (!isSpecialAccount) {
        const withdrawableReward = Math.floor(rewardAmount * 0.51);
        const lockedReward = rewardAmount - withdrawableReward;

        updatePayload.totalPoints = increment(-cost + rewardAmount);
        updatePayload.totalEarned = increment(rewardAmount);
        updatePayload.withdrawablePoints = increment(-withdrawableDecrease + withdrawableReward); 
        updatePayload.lockedPoints = increment(-lockedDecrease + lockedReward);
      } else {
        updatePayload.totalPoints = increment(rewardAmount);
        updatePayload.totalEarned = increment(rewardAmount);
        updatePayload.withdrawablePoints = increment(rewardAmount);
      }

      await updateDoc(userRef, updatePayload);

      if (rewardAmount > 0 && !isSpecialAccount) {
        await trackPlatformActivity('reward', rewardAmount, user.uid, `مكافأة نشر ${activeTab}`);
      }

      toast({ title: "تم النشر" });
      router.push("/");
    } catch (error) {
      toast({ variant: "destructive", title: "فشل النشر" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <Link href="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowRight /></Button></Link>
        <h1 className="text-2xl font-black">نشر جديد</h1>
        {isSpecialAccount && <Badge className="bg-primary/20 text-primary">🧪 تجريبي</Badge>}
      </div>

      <Tabs defaultValue="text" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card h-16 rounded-2xl p-1 border">
          <TabsTrigger value="text" className="rounded-xl font-bold"><Type size={16} /></TabsTrigger>
          <TabsTrigger value="image" className="rounded-xl font-bold"><ImageIcon size={16} /></TabsTrigger>
          <TabsTrigger value="video" className="rounded-xl font-bold"><Video size={16} /></TabsTrigger>
          <TabsTrigger value="link" className="rounded-xl font-bold"><LinkIcon size={16} /></TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-card border p-6 rounded-3xl">
          <Select value={selectedTopic} onValueChange={setSelectedTopic} required>
            <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="اختر المجال..." /></SelectTrigger>
            <SelectContent className="rounded-xl">
              {TOPICS_LIST.filter(t => userData?.followedTopics?.includes(t.id)).map(topic => (
                <SelectItem key={topic.id} value={topic.id}>{topic.icon} {topic.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input placeholder="العنوان..." value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-xl" required />

          {(activeTab === 'image' || activeTab === 'video') && (
            <Input placeholder="رابط الميديا..." value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} className="h-12 rounded-xl" required />
          )}

          {activeTab === 'link' && (
            <Input placeholder="الرابط..." value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className="h-12 rounded-xl" required />
          )}

          <Textarea placeholder="المحتوى..." value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[140px] rounded-xl" required />

          <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl text-lg font-bold gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <>نشر - {getCost()} نقاط <Send size={20} /></>}
          </Button>
        </form>
      </Tabs>
    </div>
  );
}
