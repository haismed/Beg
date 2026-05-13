
"use client";

import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDocs,
  deleteDoc,
  orderBy,
  limit
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  UserPlus, 
  Check, 
  X, 
  Search, 
  Clock, 
  ArrowRight, 
  Users, 
  ShieldAlert,
  Loader2,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { canSendFriendRequest } from "@/lib/friends-service";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FriendsPage() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Check quota on mount
    const checkQuota = async () => {
      const status = await canSendFriendRequest(user.uid);
      setQuotaStatus(status);
    };
    checkQuota();

    // Listen for received requests
    const qReceived = query(
      collection(db, "friendRequests"),
      where("toUid", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsubReceived = onSnapshot(qReceived, (snap) => {
      setReceivedRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen for sent requests
    const qSent = query(
      collection(db, "friendRequests"),
      where("fromUid", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsubSent = onSnapshot(qSent, (snap) => {
      setSentRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubReceived();
      unsubSent();
    };
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      // Very simple search for demo purposes
      const q = query(
        collection(db, "users"),
        where("displayName", ">=", searchQuery),
        where("displayName", "<=", searchQuery + "\uf8ff"),
        limit(10)
      );
      const snap = await getDocs(q);
      setSearchResults(snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.uid !== user?.uid)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (targetUser: any) => {
    if (!user || !userData) return;

    // Re-check quota before sending
    const status = await canSendFriendRequest(user.uid);
    setQuotaStatus(status);
    
    if (!status.allowed) {
      toast({
        variant: "destructive",
        title: "حظر إرسال طلبات",
        description: status.message,
      });
      return;
    }

    try {
      await addDoc(collection(db, "friendRequests"), {
        fromUid: user.uid,
        fromName: userData.displayName,
        toUid: targetUser.uid,
        toName: targetUser.displayName,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      toast({ title: "تم إرسال الطلب", description: `بانتظار موافقة ${targetUser.displayName}` });
      setSearchResults(prev => prev.filter(u => u.uid !== targetUser.uid));
    } catch (e) {
      console.error(e);
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, "friendRequests", requestId));
      toast({ title: "تم الإلغاء", description: "تم سحب طلب الصداقة." });
      // Re-check quota after cancellation
      const status = await canSendFriendRequest(user?.uid || "");
      setQuotaStatus(status);
    } catch (e) {
      console.error(e);
    }
  };

  const respondToRequest = async (requestId: string, status: "accepted" | "rejected") => {
    try {
      await updateDoc(doc(db, "friendRequests", requestId), { status });
      toast({ 
        title: status === "accepted" ? "تم قبول الطلب" : "تم رفض الطلب",
        description: status === "accepted" ? "أصبحتم أصدقاء الآن!" : "تم حذف الطلب." 
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight />
          </Button>
        </Link>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Users className="text-primary" />
          الأصدقاء والتواصل
        </h1>
      </div>

      {quotaStatus && !quotaStatus.allowed && (
        <Alert variant="destructive" className="mb-6 rounded-3xl border-2 animate-pulse">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="font-black text-lg">تحذير تنظيف الطلبات</AlertTitle>
          <AlertDescription className="text-sm font-medium mt-1">
            {quotaStatus.message}
            <div className="mt-2 text-xs opacity-80">
              نسبة الطلبات القديمة: {quotaStatus.percentage}% (الحد الأقصى 51%)
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="find" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card h-14 rounded-2xl p-1 mb-8 border border-border">
          <TabsTrigger value="find" className="rounded-xl font-bold">بحث</TabsTrigger>
          <TabsTrigger value="received" className="rounded-xl font-bold relative">
            الواردة
            {receivedRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-[10px] flex items-center justify-center rounded-full">
                {receivedRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="rounded-xl font-bold">المرسلة</TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="space-y-6">
          <form onSubmit={handleSearch} className="relative group">
            <Input 
              placeholder="ابحث عن أصدقاء بالاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pr-12 rounded-2xl bg-card border-border focus:ring-primary/20 transition-all text-lg"
            />
            <Search className="absolute right-4 top-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Button type="submit" className="absolute left-2 top-2 h-10 px-6 rounded-xl font-bold" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "بحث"}
            </Button>
          </form>

          <div className="space-y-4">
            {searchResults.map((result) => (
              <Card key={result.id} className="rounded-2xl border-border bg-card/50 overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-primary/10">
                      <AvatarImage src={result.photoURL} />
                      <AvatarFallback>{result.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold">{result.displayName}</h4>
                      <p className="text-[10px] text-muted-foreground">النقاط: {result.totalPoints?.toFixed(1) || 0}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => sendRequest(result)}
                    className="rounded-xl font-bold gap-2"
                    disabled={quotaStatus && !quotaStatus.allowed}
                  >
                    <UserPlus size={16} />
                    إضافة
                  </Button>
                </CardContent>
              </Card>
            ))}
            {searchResults.length === 0 && searchQuery && !loading && (
              <p className="text-center py-10 text-muted-foreground italic">لا توجد نتائج مطابقة..</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="received">
          <div className="space-y-4">
            {receivedRequests.map((req) => (
              <Card key={req.id} className="rounded-2xl border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>{req.fromName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold">{req.fromName}</h4>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />
                        {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString('ar-SA') : "الآن"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="destructive" className="rounded-xl" onClick={() => respondToRequest(req.id, "rejected")}>
                      <X size={18} />
                    </Button>
                    <Button size="icon" className="rounded-xl bg-green-600 hover:bg-green-700" onClick={() => respondToRequest(req.id, "accepted")}>
                      <Check size={18} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {receivedRequests.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                <Users className="mx-auto text-muted-foreground opacity-20 mb-3" size={48} />
                <p className="text-muted-foreground font-bold">لا توجد طلبات واردة حالياً</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sent">
          <div className="space-y-4">
            {sentRequests.map((req) => {
              const isOld = req.createdAt?.toMillis ? (Date.now() - req.createdAt.toMillis() > 7 * 24 * 60 * 60 * 1000) : false;
              return (
                <Card key={req.id} className={`rounded-2xl border-border bg-card/50 ${isOld ? 'border-destructive/30 bg-destructive/5' : ''}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>{req.toName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold">{req.toName}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold">معلق</span>
                          {isOld && <span className="text-[10px] text-destructive font-black">قديم جداً! (يجب حذفه)</span>}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => cancelRequest(req.id)} className="text-destructive hover:bg-destructive/10 font-bold gap-2 rounded-xl">
                      <Trash2 size={16} />
                      إلغاء
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            {sentRequests.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                <UserPlus className="mx-auto text-muted-foreground opacity-20 mb-3" size={48} />
                <p className="text-muted-foreground font-bold">لم ترسل أي طلبات بعد</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  );
}
