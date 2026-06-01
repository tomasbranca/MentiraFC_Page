import { Suspense } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiArrowLeft,
  FiAtSign,
  FiChevronRight,
  FiExternalLink,
  FiFlag,
  FiGrid,
  FiHome,
  FiMessageSquare,
  FiSettings,
  FiShield,
  FiTool,
  FiUsers,
} from "react-icons/fi";

import { lazyWithReload } from "../../../lib/lazyWithReload";
import { ROUTES } from "../../../shared/routing";
import {
  ADMIN_SECTIONS,
  getAdminNavigationContext,
} from "../../admin/adminNavigation";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import { useAuth } from "../../context/useAuth";

const AppToaster = lazyWithReload(() => import("../../app/AppToaster"));

const sectionIcons = {
  home: FiGrid,
  users: FiUsers,
  roles: FiShield,
  commentReports: FiMessageSquare,
  footerSettings: FiSettings,
  auditLog: FiActivity,
  metrics: FiGrid,
  authControls: FiAtSign,
  featureFlags: FiFlag,
  maintenance: FiTool,
} satisfies Record<(typeof ADMIN_SECTIONS)[number]["id"], IconType>;

const getInitials = (firstName?: string, lastName?: string): string => {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();

  return initials || "A";
};

const getNavLinkClassName = (isActive: boolean) =>
  `flex min-h-11 shrink-0 items-center gap-2 rounded-[4px] border px-3 py-2.5 text-sm font-semibold transition xl:w-full xl:gap-3 ${
    isActive
      ? "border-violet-200/45 bg-violet-100 text-violet-950 shadow-[0_12px_30px_rgba(139,92,246,0.2)]"
      : "border-white/8 text-violet-100/75 hover:border-violet-200/28 hover:bg-white/6 hover:text-white xl:border-transparent"
  }`;

const AdminLayout = () => {
  const { account } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationContext = getAdminNavigationContext(location.pathname);
  const isAdminHome = navigationContext.currentSection.id === "home";

  return (
    <section className="min-h-screen bg-[#0d0d10] px-2 py-3 text-white sm:px-5 md:px-8 md:py-8">
      <Suspense fallback={null}>
        <AppToaster />
      </Suspense>

      <div className="mx-auto grid w-full max-w-384 gap-3 sm:gap-4 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-md border border-white/10 bg-[#141418] xl:sticky xl:top-8 xl:self-start">
          <div className="border-b border-white/10 p-4 xl:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-violet-200/35 bg-violet-200 text-lg font-black text-violet-950">
                  {getInitials(account?.firstName, account?.lastName)}
                </div>
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-semibold uppercase text-violet-200/80">
                    Administracion
                  </p>
                  <p className="mt-1 truncate text-lg font-black uppercase leading-none text-white">
                    Mentira FC
                  </p>
                </div>
              </div>

              <Link
                to={ROUTES.HOME}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-xs font-semibold text-violet-50 transition hover:border-violet-200/35 hover:bg-white/6 xl:hidden"
                aria-label="Ir al sitio publico"
                title="Ir al sitio publico"
              >
                <FiHome className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sitio</span>
              </Link>
            </div>
          </div>

          <nav className="p-2" aria-label="Secciones del panel admin">
            <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0 xl:block xl:space-y-1">
              {ADMIN_SECTIONS.map((section) => {
                const Icon = sectionIcons[section.id];

                return (
                  <NavLink
                    key={section.id}
                    to={section.route}
                    end={section.id === "home"}
                    className={({ isActive }) => getNavLinkClassName(isActive)}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span className="whitespace-nowrap">{section.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>

          <div className="hidden border-t border-white/10 p-2 xl:block">
            <Link
              to={ROUTES.DASHBOARD}
              className="flex min-h-11 items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-violet-100/75 transition hover:bg-white/6 hover:text-white"
            >
              <FiShield className="size-4" aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
            <Link
              to={ROUTES.HOME}
              className="flex min-h-11 items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-violet-100/75 transition hover:bg-white/6 hover:text-white"
            >
              <FiHome className="size-4" aria-hidden="true" />
              <span>Sitio publico</span>
              <FiExternalLink
                className="ml-auto size-3 text-violet-100/40"
                aria-hidden="true"
              />
            </Link>
          </div>
        </aside>

        <div className="min-w-0 overflow-hidden rounded-md border border-white/10 bg-[#f6f4fb] text-[#17151d] shadow-[0_20px_80px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-3 border-b border-[#dad5e8] bg-white px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              {!isAdminHome ? (
                <div className="flex flex-wrap gap-2 xl:hidden">
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-violet-950 transition hover:bg-violet-100"
                    onClick={() => navigate(-1)}
                  >
                    <FiArrowLeft className="size-4" aria-hidden="true" />
                    Atras
                  </button>
                </div>
              ) : null}

              <div className="min-w-0">
                <nav
                  className="flex min-w-0 items-center gap-1 text-xs text-violet-950/55"
                  aria-label="Ubicacion actual"
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
                            className="shrink-0 transition hover:text-violet-800"
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <span
                            className={`truncate ${
                              isLast ? "font-semibold text-violet-950" : ""
                            }`}
                            aria-current={isLast ? "page" : undefined}
                          >
                            {item.label}
                          </span>
                        )}
                        {!isLast && (
                          <FiChevronRight
                            className="size-3 shrink-0 text-violet-950/25"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    );
                  })}
                </nav>
                <p className="mt-1 text-xl font-black uppercase leading-none text-[#17151d] sm:text-2xl">
                  {navigationContext.title}
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center rounded-sm border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-violet-900">
              {navigationContext.actionLabel}
            </span>
          </div>

          <Suspense fallback={<DashboardContentLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </section>
  );
};

export default AdminLayout;
