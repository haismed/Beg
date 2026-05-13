'use client';

import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, serverTimestamp, collection, addDoc, Timestamp, runTransaction } from "firebase/firestore";
import { trackPlatformActivity } from "./platform-service";

/**
 * دالة تحويل النقاط من المحافظ (القابلة للسحب أو المجمدة) إلى محفظة المتجر الموحدة
 */
export async function transferToStoreWallet(userId: string, amount: number, type: 'withdrawable' | 'locked') {
  const userRef = doc(db, "users", userId);
  
  return await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw new Error("المستخدم غير موجود");
    
    const user = userSnap.data();
    
    let commissionRate = 0;
    let availableBalance = 0;
    let transferCount = 0;
    let countField = '';
    let balanceField = '';

    // تحديد العمولات والعدادات بناءً على نوع المحفظة
    if (type === 'withdrawable') {
      commissionRate = 0.07; // 7% عمولة
      availableBalance = user.withdrawablePoints || 0;
      transferCount = user.transferCountWithdrawable || 0;
      countField = 'transferCountWithdrawable';
      balanceField = 'withdrawablePoints';
    } else if (type === 'locked') {
      commissionRate = 0.20; // 20% عمولة (لأنها نقاط مقيدة أصلاً)
      availableBalance = user.lockedPoints || 0;
      transferCount = user.transferCountLocked || 0;
      countField = 'transferCountLocked';
      balanceField = 'lockedPoints';
    } else {
      throw new Error("نوع التحويل غير صالح");
    }

    // التحقق من القيود
    if (transferCount >= 3) {
      throw new Error("وصلت للحد الأقصى (3 تحويلات) لهذه المحفظة في هذه المرحلة.");
    }
    if (amount > availableBalance) {
      throw new Error("رصيدك الحالي غير كافي لإتمام هذه العملية.");
    }

    // حساب العمولة والمبلغ الصافي
    const commission = Math.ceil(amount * commissionRate);
    const netAmount = amount - commission;

    // تحديث المحافظ والعدادات
    const updates: any = {
      storeWallet: increment(netAmount),
      advertisingBalance: increment(netAmount), // مزامنة مع النظام القديم للتعزيز
      adBalance: increment(netAmount),
      [balanceField]: increment(-amount),
      [countField]: increment(1),
      totalPoints: increment(-commission) // النقاط المقتطعة "تُحرق" من إجمالي ثروة المستخدم
    };

    transaction.update(userRef, updates);

    // تسجيل العملية كربح للمنصة (حرق)
    const earningRef = doc(collection(db, 'platform_earnings'));
    transaction.set(earningRef, {
      userId,
      type: `transfer_${type}`,
      amountOriginal: amount,
      commissionBurned: commission,
      netToStore: netAmount,
      createdAt: serverTimestamp()
    });

    return { success: true, netAmount, commission };
  });
}

/**
 * دالة صرف نقاط من محفظة المتجر مع تطبيق قيود 49/51
 */
export async function spendFromStoreWallet(userId: string, amount: number, purpose: 'ads' | 'boost' | 'products', details?: any) {
  const userRef = doc(db, "users", userId);

  return await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw new Error("User not found");
    
    const user = userSnap.data();
    const storeWallet = user.storeWallet || 0;

    if (amount > storeWallet) {
      throw new Error("رصيد محفظة المتجر غير كافي.");
    }

    // تطبيق منطق NokTek للحفاظ على توازن السيولة
    let maxAllowed = storeWallet;
    if (purpose === 'boost') {
      maxAllowed = Math.floor(storeWallet * 0.49); // 49% حد أقصى للتعزيز
    } else if (purpose === 'products') {
      maxAllowed = Math.floor(storeWallet * 0.51); // 51% حد أقصى للمشتريات
    }

    if (amount > maxAllowed && purpose !== 'ads') {
      throw new Error(`الحد الأقصى المسموح لصرفه في (${purpose}) هو ${maxAllowed} نقطة من رصيدك الحالي.`);
    }

    // 1. خصم من محفظة المتجر
    transaction.update(userRef, {
      storeWallet: increment(-amount)
    });

    // 2. تنفيذ منطق الصرف حسب الغرض
    if (purpose === 'ads') {
      transaction.update(userRef, {
        purchasedAdBalance: increment(amount),
        advertisingBalance: increment(amount)
      });
    } else if (purpose === 'products') {
      const orderRef = doc(collection(db, "orders"));
      transaction.set(orderRef, {
        userId,
        productId: details?.productId || 'general_store_item',
        amount,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } else if (purpose === 'boost') {
      // رصيد التعزيز يضاف مؤقتاً لحقل التعزيز النشط أو يُعالج عبر boost-service
      transaction.update(userRef, {
        advertisingBalance: increment(amount)
      });
    }

    // 3. سجل عملية الصرف
    const logRef = doc(collection(db, "store_spending_logs"));
    transaction.set(logRef, {
      userId,
      amount,
      purpose,
      details: details || {},
      createdAt: serverTimestamp()
    });

    return { success: true, newBalance: storeWallet - amount };
  });
}

/**
 * دالة تحويل الرصيد المجمد إلى رصيد إعلاني (المراحل القديمة - ستبقى للتوافق)
 */
export async function convertLockedToAd(userId: string, points: number) {
  const userRef = doc(db, "users", userId);
  
  return await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw new Error("المستخدم غير موجود");
    
    const user = userSnap.data();
    const locked = user.lockedPoints || 0;
    
    let limits = user.conversionLimits || {
      currentStage: 1,
      stageStartBalance: locked,
      conversionsInStage: 0,
      lastConversionAt: null
    };

    if (locked < points) throw new Error("رصيدك المجمد غير كافي.");

    let currentStage = limits.currentStage || 1;
    let stageStartBalance = limits.stageStartBalance ?? locked;
    let conversionsInStage = limits.conversionsInStage || 0;

    if (conversionsInStage >= 3) {
      currentStage += 1;
      stageStartBalance = locked;
      conversionsInStage = 0;
    }

    const maxAllowed = Math.floor(stageStartBalance * 0.49);
    if (points > maxAllowed) {
      throw new Error(`الحد الأقصى للتحويل في هذه المرحلة هو 49% (= ${maxAllowed} نقطة).`);
    }

    if (limits.lastConversionAt) {
      const lastDate = limits.lastConversionAt instanceof Timestamp ? limits.lastConversionAt.toMillis() : 0;
      const hoursSince = (Date.now() - lastDate) / (1000 * 60 * 60);
      if (hoursSince < 24) throw new Error("مسموح بعملية تحويل واحدة فقط كل 24 ساعة.");
    }

    const bonus = Math.floor(points * 0.10);
    const totalAdPoints = points + bonus;

    transaction.update(userRef, {
      lockedPoints: increment(-points),
      storeWallet: increment(totalAdPoints),
      advertisingBalance: increment(totalAdPoints),
      adBalance: increment(totalAdPoints),
      "conversionLimits.currentStage": currentStage,
      "conversionLimits.stageStartBalance": stageStartBalance,
      "conversionLimits.conversionsInStage": conversionsInStage + 1,
      "conversionLimits.lastConversionAt": serverTimestamp()
    });

    return { success: true, net: totalAdPoints, bonus };
  });
}

/**
 * دالة السحب النقدي
 */
export async function withdrawPoints(userId: string, points: number) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("المستخدم غير موجود");
  const user = userSnap.data();

  if (points > (user.withdrawablePoints ?? 0)) {
    throw new Error("الرصيد القابل للسحب غير كافي.");
  }

  if (points < 100) throw new Error("الحد الأدنى للسحب هو 100 نقطة.");

  const fee = Math.floor(points * 0.07); 
  const net = points - fee;

  await updateDoc(userRef, {
    withdrawablePoints: increment(-points),
    totalPoints: increment(-points)
  });

  await trackPlatformActivity('fee', fee, userId, `رسوم خدمات سحب نقدي (-${fee})`);

  return { success: true, netPoints: net };
}

export async function buyPoints(userId: string, amountMAD: number) {
  throw new Error("المتجر مغلق حالياً للصيانة والتحديث.");
}

export function checkShopEligibility(userData: any) {
  return false; 
}
