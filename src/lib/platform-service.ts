import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, collection, addDoc, Timestamp } from "firebase/firestore";

const TOTAL_SUPPLY = 22000000;
const REWARD_POOL = TOTAL_SUPPLY * 0.49;

export const ANTI_ABUSE_LIMITS = {
  MAX_WATCH_SECONDS_24H: 28800,     // 8 hours
};

export const ANTI_FRAUD_LIMITS = {
  MIN_TRUST_SCORE_FOR_REWARDS: 50,
  VELOCITY_LIMIT_PER_HOUR: 50,
};

export const COMMENT_REWARDS = {
  BASIC: 2,
  PREMIUM: 4
};

export async function initPlatformStats() {
  const ref = doc(db, "platform", "stats");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      totalSupply: TOTAL_SUPPLY,
      rewardPool: REWARD_POOL,
      distributedRewards: 0,
      mintRateHour: 1200,
      burnRateHour: 1150,
      activeUsers: 450,
      fraudAttemptsToday: 0,
      stageCompletersToday: 0,
      latency: 120,
      rewardPoolClosed: false,
      emergencyMode: false,
      alerts: [
        { message: "النظام مستقر وجاهز للإطلاق", severity: "INFO", time: "الآن" }
      ],
      updatedAt: serverTimestamp()
    });
  }

  const configRef = doc(db, "platform", "config");
  const configSnap = await getDoc(configRef);
  if (!configSnap.exists()) {
    await setDoc(configRef, {
      emergencyMode: false,
      updatedAt: serverTimestamp()
    });
  }
}

export async function isRewardPoolOpen() {
  const ref = doc(db, "platform", "stats");
  const snap = await getDoc(ref);
  if (!snap.exists()) return true;
  return !snap.data().rewardPoolClosed;
}

export async function trackPlatformActivity(type: 'user' | 'post' | 'reward' | 'fee', amount: number = 0, userId?: string, description?: string) {
  const ref = doc(db, "platform", "stats");
  const updates: any = { updatedAt: serverTimestamp() };

  if (type === 'user') updates.activeUsers = increment(1);
  if (type === 'reward') {
    updates.distributedRewards = increment(amount);
    updates.mintRateHour = increment(amount / 24);
  }
  if (type === 'fee' || type === 'post') {
    // تحديث معدل الحرق في الإحصائيات
    updates.burnRateHour = increment(amount > 0 ? amount / 24 : 0.1);
  }

  await updateDoc(ref, updates);
  return amount;
}
