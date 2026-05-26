import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiLock,
  FiMessageSquare,
  FiShield,
  FiUsers,
} from "react-icons/fi";

import { ROUTES } from "../../../shared/routing";

const roadmapItems = [
  {
    title: "Usuarios",
    label: "Roadmap",
    description: "Cuentas, actividad y estado de acceso.",
    Icon: FiUsers,
  },
  {
    title: "Roles",
    label: "Roadmap",
    description: "Asignaciones y permisos del equipo interno.",
    Icon: FiShield,
  },
] as const;

const AdminHome = () => (
  <div className="space-y-5 p-4 sm:p-6">
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
      <Link
        to={ROUTES.ADMIN_COMMENT_REPORTS}
        className="group overflow-hidden rounded-[6px] border border-violet-200/80 bg-[#17151d] text-white shadow-[0_18px_50px_rgba(23,21,29,0.22)] transition hover:-translate-y-0.5 hover:border-violet-300"
      >
        <div className="flex min-h-56 flex-col justify-between gap-6 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-200">
                Activo
              </p>
              <h1 className="mt-3 max-w-xl text-3xl font-black uppercase leading-none text-white sm:text-4xl">
                Reportes de comentarios
              </h1>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[4px] border border-violet-200/30 bg-violet-200 text-violet-950">
              <FiMessageSquare className="size-5" aria-hidden="true" />
            </span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <p className="max-w-lg text-sm leading-relaxed text-violet-50/72">
              Cola de reportes abiertos sobre comentarios de noticias.
            </p>
            <span className="inline-flex items-center gap-2 rounded-[4px] border border-white/12 bg-white/8 px-3 py-2 text-sm font-bold text-white">
              Abrir
              <FiArrowRight
                className="size-4 transition group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {roadmapItems.map(({ title, label, description, Icon }) => (
          <article
            key={title}
            className="min-h-40 rounded-[6px] border border-[#ded7ef] bg-white p-4 text-[#17151d]"
            aria-disabled="true"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[4px] border border-violet-100 bg-violet-50 text-violet-800">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-neutral-500">
                <FiLock className="size-3" aria-hidden="true" />
                {label}
              </span>
            </div>
            <h2 className="mt-5 text-xl font-black uppercase leading-none">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {description}
            </p>
          </article>
        ))}
      </div>
    </section>
  </div>
);

export default AdminHome;
