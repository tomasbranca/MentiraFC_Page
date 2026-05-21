import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { FiArrowLeft, FiCalendar, FiFileText } from "react-icons/fi";

import { lazyWithReload } from "../../../lib/lazyWithReload";
import { ROUTES } from "../../../shared/routing";

const AppToaster = lazyWithReload(() => import("../../app/AppToaster"));

const DashboardLayout = () => {
  return (
    <section className="min-h-screen bg-[#101012] px-2 py-3 text-white sm:px-5 md:px-8 md:py-8">
      <Suspense fallback={null}>
        <AppToaster />
      </Suspense>

      <div className="mx-auto grid w-full max-w-[96rem] gap-3 sm:gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-[4px] border border-white/10 bg-[#151518]">
          <div className="border-b border-white/10 p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Panel interno
            </p>
            <p className="mt-3 text-2xl font-black uppercase leading-none text-white">
              Dashboard
            </p>
            <p className="mt-3 text-sm text-violet-100/65">
              Gestión del club
            </p>
          </div>

          <nav className="p-2">
            <div className="space-y-1">
              <NavLink
                to={ROUTES.DASHBOARD_NEWS}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-[3px] border px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "border-violet-300/35 bg-violet-500/15 text-white"
                      : "border-transparent text-violet-100/75 hover:border-white/10 hover:bg-white/[0.045] hover:text-white"
                  }`
                }
              >
                <FiFileText className="size-4" aria-hidden="true" />
                <span>Noticias</span>
              </NavLink>

              <NavLink
                to={ROUTES.DASHBOARD_MATCHES}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-[3px] border px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "border-violet-300/35 bg-violet-500/15 text-white"
                      : "border-transparent text-violet-100/75 hover:border-white/10 hover:bg-white/[0.045] hover:text-white"
                  }`
                }
              >
                <FiCalendar className="size-4" aria-hidden="true" />
                <span>Partidos</span>
              </NavLink>
            </div>
          </nav>

          <div className="border-t border-white/10 p-2">
            <Link
              to={ROUTES.HOME}
              className="flex min-h-11 items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm text-violet-100/75 transition hover:bg-white/[0.045] hover:text-white"
            >
              <FiArrowLeft className="size-4" aria-hidden="true" />
              <span>Volver al sitio</span>
            </Link>
          </div>
        </aside>

        <div className="min-w-0 overflow-hidden rounded-[4px] border border-white/10 bg-[#121216]">
          <Outlet />
        </div>
      </div>
    </section>
  );
};

export default DashboardLayout;
