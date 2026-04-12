import { Outlet } from "react-router-dom";

import { GameProvider } from "../context/GameProvider";
import Footer from "../layout/Footer/Footer";
import NavBar from "../layout/NavBar/NavBar";

const AppLayout = () => {
  return (
    <GameProvider>
      <NavBar />
      <div className="border-t-96 border-t-violet-900 min-h-screen ">
        <div className="absolute inset-0 bg-pattern-only pointer-events-none" />
        <Outlet />
      </div>
      <Footer />
    </GameProvider>
  );
};

export default AppLayout;
