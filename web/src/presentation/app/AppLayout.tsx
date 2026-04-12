import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { GameProvider } from "../context/GameProvider";
import Footer from "../layout/Footer/Footer";
import NavBar from "../layout/NavBar/NavBar";

const AppLayout = () => {
  const [showPatternImage, setShowPatternImage] = useState(false);

  useEffect(() => {
    const enablePattern = () => setShowPatternImage(true);

    const browserWindow = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (browserWindow.requestIdleCallback && browserWindow.cancelIdleCallback) {
      const idleId = browserWindow.requestIdleCallback(enablePattern, { timeout: 1500 });
      return () => browserWindow.cancelIdleCallback?.(idleId);
    }

    const timer = window.setTimeout(enablePattern, 250);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <GameProvider>
      <NavBar />
      <div className="border-t-96 border-t-violet-900 min-h-screen ">
        <div
          className={`absolute inset-0 bg-pattern-only pointer-events-none ${
            showPatternImage ? "bg-pattern-ready" : ""
          }`}
        />
        <Outlet />
      </div>
      <Footer />
    </GameProvider>
  );
};

export default AppLayout;
