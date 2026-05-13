
'use client';

import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, getDoc, collection, query, where, getDocs, limit, Timestamp } from "firebase/firestore";

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.NEXT_PUBLIC_ADMIN_CHAT_ID;

/**
 * إرسال تنبيه فوري لتيليجرام
 */
export async function sendAlert(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.warn("Telegram configuration missing. Alert not sent:", message);
    return;
  }
  
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: `🚨 <b>NokTek Alert</b>\n\n${message}`,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {
    console.error("Failed to send Telegram alert", e);
  }
}

/**
 * جلب إحصائيات الإطلاق الحية ومراقبتها
 */
export function subscribeToLaunchStats(callback: (stats: any) => void) {
  let lastInflationAlert = 0;
  let lastFraudAlert = 0;

  return onSnapshot(doc(db, "platform", "stats"), (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      // حساب التضخم اللحظي
      const mint = data.mintRateHour || 0;
      const burn = data.burnRateHour || 0;
      const total = data.totalSupply || 22000000;
      const inflation = ((mint - burn) / total) * 100;
      const inflationRate = inflation.toFixed(4);

      // 1. مراقبة التضخم (> 10%)
      if (Number(inflationRate) > 10 && (Date.now() - lastInflationAlert > 3600000)) {
        sendAlert(`<b>خطر تضخم مرتفع!</b>\nالنسبة: ${inflationRate}%\nيرجى مراجعة مسبح المكافآت.`);
        lastInflationAlert = Date.now();
      }

      // 2. مراقبة محاولات الاحتيال
      if (data.fraudAttemptsToday > 100 && (Date.now() - lastFraudAlert > 600000)) {
        sendAlert(`<b>هجوم محتمل!</b>\nتم رصد أكثر من ${data.fraudAttemptsToday} محاولة احتيال أو اختراق لقيد 49% اليوم.`);
        lastFraudAlert = Date.now();
      }

      callback({
        ...data,
        inflation: inflationRate,
        isHealthy: Number(inflationRate) >= -2 && Number(inflationRate) <= 2,
        serverStatus: data.latency < 500 ? 'healthy' : data.latency < 800 ? 'warning' : 'danger'
      });
    }
  });
}

/**
 * تفعيل/إلغاء وضع الطوارئ مع إشعار تيليجرام
 */
export async function toggleEmergencyMode(status: boolean) {
  const ref = doc(db, "platform", "config");
  await updateDoc(ref, {
    emergencyMode: status,
    updatedAt: Timestamp.now()
  });

  if (status) {
    await sendAlert(`<b>تم تفعيل وضع الطوارئ (KILL SWITCH)!</b>\nقام المدير بإيقاف كافة العمليات المالية والجوائز يدوياً.`);
  } else {
    await sendAlert(`<b>تم استئناف العمليات.</b>\nتم إغلاق وضع الطوارئ وعودة النظام للعمل الطبيعي.`);
  }
}

/**
 * التحقق من وضع الطوارئ
 */
export async function isEmergencyMode() {
  const ref = doc(db, "platform", "config");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().emergencyMode : false;
}
