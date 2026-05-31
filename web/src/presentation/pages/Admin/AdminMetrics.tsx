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
    ["Usuarios", metrics.users],
    ["Activos", metrics.activeUsers],
    ["Comentarios", metrics.comments],
    ["Reportes abiertos", metrics.openReports],
    ["Feature flags", metrics.featureFlags],
    ["Eventos auditados", metrics.auditEvents],
  ] as const;

  return (
    <AdminPageShell
      eyebrow="Observabilidad"
      title="Metricas"
      description="Resumen interno del sitio. Trafico y Core Web Vitals se consultan en Vercel."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <article
            key={label}
            className="rounded-md border border-[#ded7ef] bg-white p-4"
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
          className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white transition hover:border-violet-300"
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
          className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white transition hover:border-violet-300"
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
