import { Suspense } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiChevronRight,
  FiFileText,
  FiFlag,
  FiHome,
  FiImage,
  FiShield,
  FiUsers,
} from "react-icons/fi";

import { lazyWithReload } from "../../../lib/lazyWithReload";
import type { DashboardPermissionResource } from "../../../domain/auth/permissions";
import { ROUTES } from "../../../shared/routing";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import { getDashboardNavigationContext } from "../../dashboard/dashboardNavigation";
import { getAllowedDashboardSections } from "../../dashboard/dashboardSections";
import { useAuth } from "../../context/useAuth";

const AppToaster = lazyWithReload(() => import("../../app/AppToaster"));

const sectionIcons = {
  news: FiFileText,
  matches: FiCalendar,
  galleries: FiImage,
  players: FiUsers,
  organizations: FiFlag,
  teams: FiShield,
  tournaments: FiAward,
  table: FiBarChart2,
  staff: FiUsers,
} satisfies Record<DashboardPermissionResource, IconType>;

const getNavLinkClassName = (isActive: boolean) =>
  `flex min-h-11 shrink-0 items-center gap-2 rounded-[3px] border px-3 py-2.5 text-sm font-semibold transition xl:w-full xl:gap-3 ${
    isActive
      ? "border-violet-300/40 bg-violet-500/18 text-white shadow-[inset_0_-2px_0_rgba(196,181,253,0.55)] xl:shadow-none"
      : "border-white/8 text-violet-100/75 hover:border-white/14 hover:bg-white/4.5 hover:text-white xl:border-transparent"
  }`;

const DashboardLayout = () => {
  const { account } = useAuth();
  const location = useLocation();
  const allowedSections = getAllowedDashboardSections(account?.role);
  const navigationContext = getDashboardNavigationContext(location.pathname);

  return (
    <section className="min-h-screen bg-[#101012] px-2 py-3 text-white sm:px-5 md:px-8 md:py-8">
      <Suspense fallback={null}>
        <AppToaster />
      </Suspense>

      <div className="mx-auto grid w-full max-w-384 gap-3 sm:gap-4 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-[4px] border border-white/10 bg-[#151518] xl:sticky xl:top-28 xl:self-start">
          <div className="border-b border-white/10 p-3 sm:p-4 xl:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
                  Panel interno
                </p>
                <p className="mt-2 truncate text-xl font-black uppercase leading-none text-white xl:mt-3 xl:text-2xl">
                  <span className="xl:hidden">{navigationContext.title}</span>
                  <span className="hidden xl:inline">Dashboard</span>
                </p>
                <p className="mt-1 truncate text-xs text-violet-100/65 xl:mt-3 xl:text-sm">
                  <span className="xl:hidden">
                    {navigationContext.actionLabel}
                  </span>
                  <span className="hidden xl:inline">Gestión del club</span>
                </p>
              </div>

              <Link
                to={ROUTES.HOME}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[3px] border border-white/10 px-3 py-2 text-xs font-semibold text-violet-50 transition hover:border-violet-200/35 hover:bg-white/4.5 xl:hidden"
                aria-label="Ir al sitio público"
                title="Ir al sitio público"
              >
                <FiHome className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sitio</span>
              </Link>
            </div>
          </div>

          <nav className="p-2" aria-label="Secciones del dashboard">
            <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0 xl:block xl:space-y-1">
              {allowedSections.length === 0 ? (
                <p className="w-full rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-3 py-2.5 text-sm text-amber-100">
                  No tenés secciones habilitadas.
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
                      <span className="whitespace-nowrap">{section.label}</span>
                    </NavLink>
                  );
                })
              )}
            </div>
          </nav>

          <div className="hidden border-t border-white/10 p-2 xl:block">
            <Link
              to={ROUTES.HOME}
              className="flex min-h-11 items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm text-violet-100/75 transition hover:bg-white/4.5 hover:text-white"
            >
              <FiHome className="size-4" aria-hidden="true" />
              <span>Ir al sitio público</span>
            </Link>
          </div>
        </aside>

        <div className="min-w-0 overflow-hidden rounded-[4px] border border-white/10 bg-[#121216]">
          <div className="flex flex-col gap-3 border-b border-white/10 bg-[#151518]/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <nav
              className="flex min-w-0 items-center gap-1 text-xs text-violet-100/60"
              aria-label="Ubicación actual"
            >
              {navigationContext.breadcrumbs.map((item, index) => {
                const isLast =
                  index === navigationContext.breadcrumbs.length - 1;

                return (
                  <span
                    key={`${item.label}-${index}`}
                    className="flex min-w-0 items-center gap-1"
                  >
                    {item.route && !isLast ? (
                      <Link
                        to={item.route}
                        className="shrink-0 transition hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        className={`truncate ${
                          isLast ? "font-semibold text-white" : ""
                        }`}
                        aria-current={isLast ? "page" : undefined}
                      >
                        {item.label}
                      </span>
                    )}
                    {!isLast && (
                      <FiChevronRight
                        className="size-3 shrink-0 text-violet-100/35"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                );
              })}
            </nav>
          </div>
          <Suspense fallback={<DashboardContentLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </section>
  );
};

export default DashboardLayout;
