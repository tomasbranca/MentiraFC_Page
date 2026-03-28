import { useEffect, useState } from "react";

export const useCountdown = (targetDate, active) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    if (!targetDate || !active) return;

    const calculate = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0 };
      }

      return {
        hours: Math.floor(diff / 1000 / 60 / 60),
        minutes: Math.floor((diff / 1000 / 60) % 60),
      };
    };

    setTimeLeft(calculate());

    const interval = setInterval(() => {
      setTimeLeft(calculate());
    }, 60000); // 🔥 cada 1 minuto, no 1 segundo

    return () => clearInterval(interval);
  }, [targetDate, active]);

  return timeLeft;
};