// @ts-nocheck
import { useEffect, useState } from "react";

export const useAutoplay = () => {
  const [autoplay, setAutoplay] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");

    const update = (e) => {
      setAutoplay(e.matches);
      setManual(!e.matches);
    };

    update(mq);

    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return { autoplay, manual };
};