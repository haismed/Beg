"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Crown, Medal, UserCheck } from "lucide-react";

export default function Leaderboard() {
  const [creators, setCreators] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("totalPoints", "desc"), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCreators(data);
    });
    return () => unsubscribe();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="text-yellow-400 w-5 h-5" />;
      case 1: return <Medal className="text-gray-300 w-5 h-5" />;
      case 2: return <Medal className="text-amber-600 w-5 h-5" />;
      default: return <Trophy className="text-primary w-4 h-4 opacity-50" />;
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="text-primary" />
          صُنّاع الأسبوع
        </h2>
        <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-1 rounded">المتصدرون</span>
      </div>

      <div className="space-y-4">
        {creators.map((creator, index) => (
          <div key={creator.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-6 text-center font-bold text-sm text-muted-foreground">
                {getRankIcon(index)}
              </div>
              <Avatar className="w-10 h-10 border-2 border-primary/10">
                <AvatarImage src={creator.photoURL} alt={creator.displayName} />
                <AvatarFallback>{creator.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm">{creator.displayName}</p>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                   <UserCheck size={10} className="text-green-500" />
                   <span>عضو موثق</span>
                </div>
              </div>
            </div>
            <div className="text-left">
              <span className="font-black text-primary text-sm">{(creator.totalPoints || 0).toFixed(0)}</span>
              <span className="text-[10px] text-muted-foreground mr-1">نقطة</span>
            </div>
          </div>
        ))}
        {creators.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4 italic">لا يوجد مبدعون بعد..</p>
        )}
      </div>
    </div>
  );
}
