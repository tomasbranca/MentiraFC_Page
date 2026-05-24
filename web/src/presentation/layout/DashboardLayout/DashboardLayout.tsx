import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  FiArrowLeft,
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiFileText,
  FiFlag,
  FiUsers,
} from "react-icons/fi";

import { lazyWithReload } from "../../../lib/lazyWithReload";
import type { DashboardPermissionResource } from "../../../domain/auth/permissions";
import { ROUTES } from "../../../shared/routing";
import { getAllowedDashboardSections } from "../../dashboard/dashboardSections";
import { useAuth } from "../../context/useAuth";

const AppToaster = lazyWithReload(() => import("../../app/AppToaster"));

const sectionIcons = {
  news: FiFileText,
  matches: FiCalendar,
  players: FiUsers,
  organizations: FiFlag,
  tournaments: FiAward,
  table: FiBarChart2,
  staff: FiUsers,
} satisfies Record<DashboardPermissionResource, IconType>;

const getNavLinkClassName = (isActive: boolean) =>
  `flex min-h-11 items-center gap-3 rounded-[3px] border px-3 py-2.5 text-sm font-semibold transition ${
    isActive
      ? "border-violet-300/35 bg-violet-500/15 text-white"
      : "border-transparent text-violet-100/75 hover:border-white/10 hover:bg-white/4.5 hover:text-white"
  }`;

const DashboardLayout = () => {
  const { account } = useAuth();
  const allowedSections = getAllowedDashboardSections(account?.role);

  return (
    <section className="min-h-screen bg-[#101012] px-2 py-3 text-white sm:px-5 md:px-8 md:py-8">
      <Suspense fallback={null}>
        <AppToaster />
      </Suspense>

      <div className="mx-auto grid w-full max-w-384 gap-3 sm:gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
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
              {allowedSections.length === 0 ? (
                <p className="rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-3 py-2.5 text-sm text-amber-100">
                  No tenes secciones habilitadas.
                </p>
              ) : (
                allowedSections.map((section) => {
                  const Icon = sectionIcons[section.resource];

                  return (
                    <NavLink
                      key={section.resource}
                      to={section.route}
                      className={({ isActive }) =>
                        getNavLinkClassName(isActive)
                      }
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      <span>{section.label}</span>
                    </NavLink>
                  );
                })
              )}
            </div>
          </nav>

          <div className="border-t border-white/10 p-2">
            <Link
              to={ROUTES.HOME}
              className="flex min-h-11 items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm text-violet-100/75 transition hover:bg-white/4.5 hover:text-white"
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
