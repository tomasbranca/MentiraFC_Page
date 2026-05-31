import { Link } from "react-router-dom";
import {
  FiActivity,
  FiArrowRight,
  FiAtSign,
  FiFlag,
  FiMessageSquare,
  FiSettings,
  FiShield,
  FiTool,
  FiUsers,
} from "react-icons/fi";

import { ROUTES } from "../../../shared/routing";

const adminCards = [
  {
    title: "Usuarios",
    description: "Perfiles, roles y suspension de acceso.",
    route: ROUTES.ADMIN_USERS,
    Icon: FiUsers,
  },
  {
    title: "Roles y permisos",
    description: "Defaults tipados y overrides operativos.",
    route: ROUTES.ADMIN_ROLES,
    Icon: FiShield,
  },
  {
    title: "Reportes",
    description: "Cola de denuncias y moderacion de comentarios.",
    route: ROUTES.ADMIN_COMMENT_REPORTS,
    Icon: FiMessageSquare,
  },
  {
    title: "Footer y sponsors",
    description: "Contacto, redes, links y sponsors desde Sanity.",
    route: ROUTES.ADMIN_FOOTER_SETTINGS,
    Icon: FiSettings,
  },
  {
    title: "Audit log",
    description: "Trazabilidad de acciones sensibles.",
    route: ROUTES.ADMIN_AUDIT_LOG,
    Icon: FiActivity,
  },
  {
    title: "Metricas",
    description: "Resumen interno y accesos a Vercel.",
    route: ROUTES.ADMIN_METRICS,
    Icon: FiActivity,
  },
  {
    title: "Auth",
    description: "Estado operativo de Supabase Auth.",
    route: ROUTES.ADMIN_AUTH_CONTROLS,
    Icon: FiAtSign,
  },
  {
    title: "Feature flags",
    description: "Flags operativas guardadas en Supabase.",
    route: ROUTES.ADMIN_FEATURE_FLAGS,
    Icon: FiFlag,
  },
  {
    title: "Mantenimiento",
    description: "Bloqueo app-level del sitio publico.",
    route: ROUTES.ADMIN_MAINTENANCE,
    Icon: FiTool,
  },
] as const;

const AdminHome = () => (
  <div className="space-y-5 p-4 sm:p-6">
    <section className="rounded-md border border-violet-200/80 bg-[#17151d] p-5 text-white shadow-[0_18px_50px_rgba(23,21,29,0.22)] sm:p-6">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-200">
        Operaciones
      </p>
      <h1 className="mt-3 max-w-3xl text-3xl font-black uppercase leading-none text-white sm:text-4xl">
        Panel de administrador
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-violet-50/72">
        Seguridad, comunidad, configuracion publica del footer y controles
        operativos sin mezclar el dashboard editorial.
      </p>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {adminCards.map(({ title, description, route, Icon }) => (
        <Link
          key={route}
          to={route}
          className="group min-h-44 rounded-md border border-[#ded7ef] bg-white p-4 text-[#17151d] transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_18px_45px_rgba(23,21,29,0.12)]"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-violet-100 bg-violet-50 text-violet-800">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <FiArrowRight
              className="size-4 text-violet-700 transition group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </div>
          <h2 className="mt-5 text-xl font-black uppercase leading-none">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {description}
          </p>
        </Link>
      ))}
    </section>
  </div>
);

export default AdminHome;
