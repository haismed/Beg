
'use client';

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, collection, query, where, getDocs, runTransaction } from "firebase/firestore";

export type FriendshipStatus = "none" | "pending" | "accepted" | "blocked" | "self";

/**
 * جلب بروفايل مستخدم مع تطبيق فلاتر الخصوصية
 */
export async function getUserProfile(targetUserId: string, viewerId?: string) {
  const userRef = doc(db, "users", targetUserId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return null;
  const userData = userSnap.data();
  
  // قيم افتراضية للخصوصية للمستخدمين القدامى
  const privacy = userData.privacy || {
    profileVisibility: "public",
    showPoints: "friends",
    showPosts: "public",
    showEarnings: false,
    allowFriendRequests: true
  };

  // قيم افتراضية للإحصائيات للمستخدمين القدامى
  const stats = userData.stats || {
    friendsCount: 0,
    postsCount: 0,
    totalLikes: 0
  };

  // 1. تحديد حالة الصداقة
  let friendshipStatus: FriendshipStatus = "none";
  let requestedBy = "";

  if (viewerId === targetUserId) {
    friendshipStatus = "self";
  } else if (viewerId) {
    const friendshipId = [viewerId, targetUserId].sort().join('_');
    const friendSnap = await getDoc(doc(db, "friendships", friendshipId));
    if (friendSnap.exists()) {
      const fData = friendSnap.data();
      const rawStatus = fData.status;
      friendshipStatus = rawStatus === 'accepted' ? 'accepted' : rawStatus as FriendshipStatus;
      requestedBy = fData.requestedBy;
    }
  }

  // 2. منطق الصلاحيات
  const canView = (setting: string) => {
    if (friendshipStatus === "self") return true;
    if (setting === "public") return true;
    if (setting === "friends" && friendshipStatus === "accepted") return true;
    return false;
  };

  // 3. فلترة البيانات
  return {
    profile: {
      uid: userData.uid,
      displayName: userData.displayName,
      username: userData.username || userData.displayName.toLowerCase().replace(/\s/g, '_'),
      photoURL: userData.photoURL,
      bio: canView(privacy.profileVisibility) ? (userData.bio || "") : "محتوى خاص",
      isVerified: userData.isVerified || false,
      isCreator: userData.isCreator || false,
      stats: stats,
      joinedAt: userData.createdAt,
      totalPoints: canView(privacy.showPoints) ? (userData.totalPoints || 0) : null,
      withdrawablePoints: friendshipStatus === "self" ? userData.withdrawablePoints : null,
      friendshipStatus,
      requestedBy,
      allowFriendRequests: privacy.allowFriendRequests !== false
    },
    privacy
  };
}

/**
 * إرسال طلب صداقة
 */
export async function sendFriendRequest(fromId: string, toId: string) {
  const friendshipId = [fromId, toId].sort().join('_');
  const ref = doc(db, "friendships", friendshipId);
  
  await setDoc(ref, {
    users: [fromId, toId],
    status: "pending",
    requestedBy: fromId,
    requestedAt: serverTimestamp(),
    acceptedAt: null
  }, { merge: true });

  return { success: true };
}

/**
 * قبول طلب صداقة
 */
export async function acceptFriendRequest(accepterId: string, requesterId: string) {
  const friendshipId = [accepterId, requesterId].sort().join('_');
  const friendshipRef = doc(db, "friendships", friendshipId);

  await runTransaction(db, async (transaction) => {
    const fDoc = await transaction.get(friendshipRef);
    if (!fDoc.exists() || fDoc.data().status !== "pending") throw "Request not valid";

    transaction.update(friendshipRef, {
      status: "accepted",
      acceptedAt: serverTimestamp()
    });

    transaction.update(doc(db, "users", accepterId), {
      "stats.friendsCount": increment(1)
    });

    transaction.update(doc(db, "users", requesterId), {
      "stats.friendsCount": increment(1)
    });
  });

  return { success: true };
}

/**
 * تحديث إعدادات الخصوصية
 */
export async function updatePrivacySettings(userId: string, settings: any) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { privacy: settings });
}
