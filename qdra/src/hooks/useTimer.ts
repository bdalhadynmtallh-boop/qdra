import { useEffect, useRef, useState } from "react";

/**
 * Hook عد تنازلي بسيط ومستقل.
 * - يبدأ العد فور تركيب المكون (mount).
 * - يستدعي onExpire مرة واحدة فقط عند وصول العداد للصفر.
 * - لإعادة تشغيله من جديد (بمدة جديدة أو نفس المدة)، يكفي إعادة تركيب
 *   المكون الذي يستخدمه عبر تغيير الـ key الخاص به.
 */
export function useTimer(durationInSeconds: number, onExpire: () => void): number {
  const [secondsLeft, setSecondsLeft] = useState(durationInSeconds);
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  // نحافظ دومًا على أحدث نسخة من onExpire دون الحاجة لإعادة إنشاء الـ interval
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current();
      }
      return;
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [secondsLeft]);

  return secondsLeft;
}