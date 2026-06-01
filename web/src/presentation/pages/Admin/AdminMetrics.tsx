import { useQuery } from "@tanstack/react-query";
import { FiExternalLink } from "react-icons/fi";

import { fetchAdminMetrics } from "../../../data/admin";
import { queryKeys } from "../../../data/queryKeys";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import AdminPageShell from "./AdminPageShell";

const AdminMetrics = () => {
  const metricsQuery = useQuery({
    queryKey: queryKeys.admin.metrics,
    queryFn: fetchAdminMetrics,
  });

  if (metricsQuery.isLoading) return <DashboardContentLoader />;

  if (metricsQuery.isError || !metricsQuery.data) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorFallback
          title="No pudimos cargar metricas"
          message="Las metricas internas dependen de Supabase; trafico y performance viven en Vercel."
          onRetry={() => void metricsQuery.refetch()}
        />
      </div>
    );
  }

  const metrics = metricsQuery.data;
  const cards = [
    ["Usuarios", metrics.users, "default"],
    ["Activos", metrics.activeUsers, "success"],
    ["Comentarios", metrics.comments, "default"],
    ["Reportes abiertos", metrics.openReports, metrics.openReports > 0 ? "warning" : "success"],
    ["Feature flags", metrics.featureFlags, "default"],
    ["Eventos auditados", metrics.auditEvents, "default"],
  ] as const;

  return (
    <AdminPageShell
      eyebrow="Observabilidad"
      title="Metricas"
      description="Resumen interno del sitio. Trafico y Core Web Vitals se consultan en Vercel."
      aside={
        <div className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white">
          <p className="text-3xl font-black leading-none">
            {metrics.openReports}
          </p>
          <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-100/70">
            Reportes abiertos
          </p>
          <p className="mt-4 rounded-sm border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-violet-50/80">
            {metrics.openReports > 0
              ? "Hay moderacion pendiente."
              : "La cola esta al dia."}
          </p>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value, tone]) => (
          <article
            key={label}
            className={`rounded-md border bg-white p-4 shadow-[0_10px_28px_rgba(23,21,29,0.05)] ${
              tone === "success"
                ? "border-emerald-200"
                : tone === "warning"
                  ? "border-amber-200"
                  : "border-[#ded7ef]"
            }`}
          >
            <p className="text-3xl font-black text-[#17151d]">{value}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
              {label}
            </p>
          </article>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={metrics.external.vercelAnalyticsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white shadow-[0_14px_36px_rgba(23,21,29,0.12)] transition hover:border-violet-300"
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold">
            Vercel Analytics <FiExternalLink aria-hidden="true" />
          </span>
          <p className="mt-2 text-sm text-violet-50/70">
            Fuente externa para visitas, paginas y referers.
          </p>
        </a>
        <a
          href={metrics.external.vercelSpeedInsightsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white shadow-[0_14px_36px_rgba(23,21,29,0.12)] transition hover:border-violet-300"
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold">
            Speed Insights <FiExternalLink aria-hidden="true" />
          </span>
          <p className="mt-2 text-sm text-violet-50/70">
            Fuente externa para performance real y Core Web Vitals.
          </p>
        </a>
      </div>
    </AdminPageShell>
  );
};

export default AdminMetrics;
