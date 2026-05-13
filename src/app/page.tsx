
"use client";

import { useAuth } from "@/context/auth-context";
import BottomNav from "@/components/BottomNav";
import PostFeed from "@/components/PostFeed";
import Leaderboard from "@/components/Leaderboard";
import { LogOut, Zap, TrendingUp, ShieldCheck, Trophy, LayoutGrid, LogIn, Plus, Sparkles, Filter, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { user, loading, logout, userData, loginDemo } = useAuth();
  const [activeTab, setActiveTab] = useState("for-you");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-bounce">
          <Zap className="text-primary w-12 h-12" />
        </div>
      </div>
    );
  }

  const followedTopics = userData?.followedTopics || [];
  const hasFollowedTopics = followedTopics.length > 0;
  const isTestAccount = userData?.isTestAccount || userData?.isAdmin;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 bg-card/50 p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Zap className="text-primary fill-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-primary">NokTek</h1>
              {isTestAccount && (
                <Badge variant="outline" className="text-[9px] bg-primary/5 text-primary border-primary/20 gap-1 h-5">
                  <Beaker size={10} />
                  🧪 حساب تجريبي
                </Badge>
              )}
            </div>
            {user ? (
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="w-6 h-6 border border-primary/20">
                   <AvatarImage src={user.photoURL} />
                   <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <p className="text-xs font-bold text-foreground">{user.displayName}</p>
                <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold">
                  النقاط: {userData?.totalPoints?.toFixed(1) || 0}
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">اقتصاد التفاعل العربي</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {user ? (
            <>
              <Link href="/create">
                <Button size="sm" className="gap-2 font-bold bg-primary text-white">
                  <Plus size={16} />
                  نقطة جديدة
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground hover:text-destructive gap-2">
                <LogOut size={16} />
                خروج
              </Button>
            </>
          ) : (
            <Button size="sm" className="gap-2 font-bold" onClick={() => loginDemo()}>
              <LogIn size={16} />
              دخول تجريبي
            </Button>
          )}
        </div>
      </header>

      {!user || !hasFollowedTopics ? (
        <div className="pulse-card rounded-3xl p-8 text-white mb-8 overflow-hidden relative group">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-right">
              <h2 className="text-3xl font-black mb-3 flex items-center gap-2 justify-center md:justify-start">
                <Sparkles size={28} className="animate-pulse" />
                خصص تجربتك
              </h2>
              <p className="text-white/90 text-sm font-medium leading-relaxed max-w-md">
                اختر المجالات التي تهمك لنعرض لك أفضل محتوى مخصص لك. الحد الأقصى 3 مجالات.
              </p>
            </div>
            <Link href="/topics">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-black rounded-2xl h-14 px-8">
                اختر مجالاتك الآن
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary to-secondary opacity-80" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="for-you" onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-card border border-border p-1 h-14 rounded-2xl">
              <TabsTrigger value="for-you" className="flex-1 rounded-xl font-bold h-full data-[state=active]:bg-primary data-[state=active]:text-white">
                المميز لك
              </TabsTrigger>
              <TabsTrigger value="all" className="flex-1 rounded-xl font-bold h-full data-[state=active]:bg-primary data-[state=active]:text-white">
                الكل
              </TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2 whitespace-nowrap">
                  {activeTab === "for-you" ? <Sparkles size={16} /> : <Filter size={16} />}
                  {activeTab === "for-you" ? "بناءً على تخصصاتك" : "أحدث المنشورات في كل المجالات"}
                </h3>
                <div className="h-[1px] flex-1 bg-border" />
              </div>

              <TabsContent value="for-you" className="mt-0">
                <PostFeed filterByTopics={followedTopics} />
              </TabsContent>
              <TabsContent value="all" className="mt-0">
                <PostFeed />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="space-y-8">
          <section>
            <Leaderboard />
          </section>
          
          <section className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <LayoutGrid size={18} className="text-secondary" />
              اختصارات NokTek
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/leaders">
                <Button variant="outline" className="w-full justify-start gap-2 h-12 border-border/50">
                  <Trophy size={18} className="text-yellow-500" />
                  قائمة المتصدرين
                </Button>
              </Link>
              <Link href="/topics">
                <Button variant="outline" className="w-full justify-start gap-2 h-12 border-border/50">
                  <Filter size={18} className="text-primary" />
                  تعديل المجالات
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
