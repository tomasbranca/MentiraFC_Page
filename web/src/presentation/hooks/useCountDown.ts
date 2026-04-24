// @ts-nocheck
import { useEffect, useState } from "react";

type Countdown = { hours: number; minutes: number };

export const useCountdown = (
  targetDate?: string | Date | null,
  active = true
): Countdown => {
  const [timeLeft, setTimeLeft] = useState<Countdown>({ hours: 0, minutes: 0 });

  useEffect(() => {
    if (!targetDate || !active) return;

    const calculate = (): Countdown => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target.getTime() - now.getTime();

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
    }, 60000);

    return () => clearInterval(interval);
  }, [targetDate, active]);

  return timeLeft;
};
