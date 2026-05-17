import { Link, NavLink, Outlet } from "react-router-dom";

import { ROUTES } from "../../constants/routes.constants";

const DashboardLayout = () => {
  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(109,40,217,0.22),_transparent_28%),linear-gradient(180deg,_#17121d_0%,_#0e0d12_100%)] px-4 py-6 text-white sm:px-6 md:px-8 md:py-10">
      <div className="mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/25 backdrop-blur">
          <div className="relative overflow-hidden border-b border-white/10 p-5">
            <div className="absolute inset-y-0 right-0 w-28 bg-[radial-gradient(circle,_rgba(167,139,250,0.16),_transparent_70%)]" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.28em] text-violet-200">
              Panel interno
            </p>
            <p className="relative mt-3 text-xl font-black uppercase leading-none text-white">
              Dashboard
            </p>
            <p className="relative mt-3 text-sm text-violet-100/70">
              Gestión del club
            </p>
          </div>

          <nav className="p-3">
            <NavLink
              to={ROUTES.DASHBOARD_NEWS}
              className={({ isActive }) =>
                `block rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-violet-300/25 bg-violet-500/16 text-white shadow-lg shadow-violet-950/30"
                    : "border-transparent text-violet-100 hover:border-white/10 hover:bg-white/[0.045]"
                }`
              }
            >
              Noticias
            </NavLink>
          </nav>

          <div className="border-t border-violet-200/15 p-3">
            <Link
              to={ROUTES.HOME}
              className="block rounded-2xl px-4 py-3 text-sm text-violet-100 transition hover:bg-white/[0.045]"
            >
              Volver al sitio
            </Link>
          </div>
        </aside>

        <div className="min-w-0 overflow-hidden rounded-[1.35rem] border border-white/10 bg-neutral-950/70 shadow-2xl shadow-black/25 backdrop-blur">
          <Outlet />
        </div>
      </div>
    </section>
  );
};

export default DashboardLayout;
