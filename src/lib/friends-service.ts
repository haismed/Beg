
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";

/**
 * وظيفة للتحقق من إمكانية إرسال طلب صداقة جديد بناءً على قاعدة الـ 7 أيام
 */
export async function canSendFriendRequest(uid: string) {
  try {
    // 1. اجلب كل الطلبات المعلقة pending اللي أرسلها المستخدم
    const q = query(
      collection(db, "friendRequests"),
      where("fromUid", "==", uid),
      where("status", "==", "pending")
    );
    
    const sentRequests = await getDocs(q);
    const totalPending = sentRequests.size;

    if (totalPending === 0) return { allowed: true };

    // 2. احسب كم طلب عمره > 7 أيام
    const now = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - sevenDaysInMs;

    const oldRequestsDocs = sentRequests.docs.filter(doc => {
      const createdAt = doc.data().createdAt;
      if (!createdAt) return false;
      
      const millis = createdAt instanceof Timestamp 
        ? createdAt.toMillis() 
        : (createdAt.seconds ? createdAt.seconds * 1000 : 0);
        
      return millis < sevenDaysAgo;
    });

    const oldRequestsCount = oldRequestsDocs.length;

    // 3. لو الطلبات القديمة >= 51% من كل المعلقة
    const oldPercentage = (oldRequestsCount / totalPending) * 100;
    
    if (oldPercentage >= 51) {
      return {
        allowed: false,
        reason: "blocked_old_requests",
        message: `لديك ${oldRequestsCount} طلب معلق من أكثر من 7 أيام. يجب إلغاؤها لفتح إرسال طلبات جديدة.`,
        oldRequests: oldRequestsCount,
        totalPending: totalPending,
        percentage: oldPercentage.toFixed(1)
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking friend request quota:", error);
    return { allowed: true }; // Allow by default on error to not block UI
  }
}
