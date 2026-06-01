import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiArrowRight,
  FiAtSign,
  FiCheckCircle,
  FiFlag,
  FiMessageSquare,
  FiSettings,
  FiShield,
  FiTool,
  FiUsers,
} from "react-icons/fi";

import { ROUTES } from "../../../shared/routing";
import {
  fetchAdminAuditLog,
  fetchAdminAuthControls,
  fetchAdminFooterSettings,
  fetchAdminMetrics,
  fetchAdminRoles,
  fetchAdminUsers,
  fetchFeatureFlags,
  fetchMaintenanceSettings,
} from "../../../data/admin";
import { fetchCommentModerationPage } from "../../../data/comments";
import { queryKeys } from "../../../data/queryKeys";
import type {
  AdminAuditLogItem,
  AdminFeatureFlag,
  AdminUser,
} from "../../../types/admin";
import type { CommentModerationItem } from "../../../types/comments";
import { formatCommentRelativeDate, formatDateTime } from "../../utils/date.utils";

const ADMIN_HOME_STALE_TIME = 30_000;

type PreviewTone = "default" | "good" | "warn" | "danger" | "dark";

type AdminPreviewCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  route: string;
  Icon: IconType;
  children: ReactNode;
  className?: string;
  tone?: PreviewTone;
};

type SignalPillProps = {
  label: string;
  value: string | number;
  tone?: Exclude<PreviewTone, "dark">;
};

const pillToneClasses = {
  default: "border-violet-100 bg-violet-50 text-violet-950",
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800",
} as const;

const cardToneClasses = {
  default: {
    card: "border-[#ded7ef] bg-white text-[#17151d]",
    icon: "border-violet-100 bg-violet-50 text-violet-800",
    eyebrow: "text-violet-700",
    description: "text-neutral-600",
    action: "border-violet-200 bg-violet-50 text-violet-950 hover:bg-violet-100",
  },
  good: {
    card: "border-emerald-200 bg-white text-[#17151d]",
    icon: "border-emerald-200 bg-emerald-50 text-emerald-700",
    eyebrow: "text-emerald-700",
    description: "text-neutral-600",
    action:
      "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  },
  warn: {
    card: "border-amber-200 bg-white text-[#17151d]",
    icon: "border-amber-200 bg-amber-50 text-amber-700",
    eyebrow: "text-amber-700",
    description: "text-neutral-600",
    action: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  },
  danger: {
    card: "border-red-200 bg-white text-[#17151d]",
    icon: "border-red-200 bg-red-50 text-red-700",
    eyebrow: "text-red-700",
    description: "text-neutral-600",
    action: "border-red-200 bg-red-50 text-red-900 hover:bg-red-100",
  },
  dark: {
    card: "border-white/10 bg-[#17151d] text-white",
    icon: "border-violet-200/30 bg-violet-200 text-violet-950",
    eyebrow: "text-emerald-200",
    description: "text-violet-50/70",
    action: "border-white/20 bg-white/10 text-white hover:bg-white/20",
  },
} as const;

const getAuthorName = (item: CommentModerationItem): string => {
  const authorName =
    `${item.comment.author.firstName} ${item.comment.author.lastName}`
      .replace(/\s+/g, " ")
      .trim();

  return authorName || "Usuario";
};

const getActiveUsersCount = (users: readonly AdminUser[]): number =>
  users.filter((user) => user.isActive).length;

const getEnabledFlagsCount = (flags: readonly AdminFeatureFlag[]): number =>
  flags.filter((flag) => flag.enabled).length;

const getRecentAuditItems = (
  items: readonly AdminAuditLogItem[]
): readonly AdminAuditLogItem[] => items.slice(0, 2);

const PreviewLoading = () => (
  <div className="grid gap-2" aria-hidden="true">
    <span className="block h-9 rounded-sm bg-violet-100" />
    <span className="block h-9 rounded-sm bg-violet-100/80" />
  </div>
);

const PreviewError = ({ message }: { message: string }) => (
  <div className="flex min-h-24 items-center justify-center rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold leading-relaxed text-amber-900">
    {message}
  </div>
);

const PreviewEmpty = ({
  icon: Icon,
  title,
  tone = "good",
}: {
  icon: IconType;
  title: string;
  tone?: Exclude<PreviewTone, "dark">;
}) => (
  <div
    className={`flex min-h-28 flex-col items-center justify-center rounded-sm border px-3 py-4 text-center ${pillToneClasses[tone]}`}
  >
    <Icon className="size-6" aria-hidden="true" />
    <p className="mt-2 text-xs font-black uppercase tracking-[0.08em]">
      {title}
    </p>
  </div>
);

const SignalPill = ({
  label,
  value,
  tone = "default",
}: SignalPillProps) => (
  <div className={`min-w-0 rounded-sm border px-3 py-2 ${pillToneClasses[tone]}`}>
    <p className="text-xl font-black leading-none">{value}</p>
    <p className="mt-1 text-[0.6rem] font-bold uppercase leading-tight tracking-[0.06em]">
      {label}
    </p>
  </div>
);

const CompactLine = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: Exclude<PreviewTone, "dark">;
}) => (
  <div className="flex min-w-0 items-center justify-between gap-3 rounded-sm border border-[#ede8f5] bg-[#fbfaff] px-3 py-2">
    <span className="min-w-0 truncate text-sm font-bold text-[#17151d]">
      {label}
    </span>
    <span
      className={`shrink-0 rounded-sm border px-2 py-1 text-[0.64rem] font-black uppercase ${pillToneClasses[tone]}`}
    >
      {value}
    </span>
  </div>
);

const AdminPreviewCard = ({
  eyebrow,
  title,
  description,
  route,
  Icon,
  children,
  className = "",
  tone = "default",
}: AdminPreviewCardProps) => {
  const classes = cardToneClasses[tone];

  return (
    <article
      className={`flex min-h-[15rem] flex-col rounded-md border p-4 shadow-[0_14px_36px_rgba(23,21,29,0.08)] sm:p-5 ${classes.card} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-sm border ${classes.icon}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <Link
          to={route}
          className={`inline-flex size-10 shrink-0 items-center justify-center rounded-sm border transition ${classes.action}`}
          aria-label={`Abrir ${title}`}
          title={`Abrir ${title}`}
        >
          <FiArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-4 min-w-0">
        <p className={`text-[0.68rem] font-bold uppercase tracking-[0.18em] ${classes.eyebrow}`}>
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase leading-none">
          {title}
        </h2>
        <p className={`mt-2 line-clamp-2 text-sm leading-relaxed ${classes.description}`}>
          {description}
        </p>
      </div>
      <div className="mt-4 flex flex-1 flex-col justify-center gap-3">
        {children}
      </div>
    </article>
  );
};

const AdminHome = () => {
  const metricsQuery = useQuery({
    queryKey: queryKeys.admin.metrics,
    queryFn: fetchAdminMetrics,
    staleTime: ADMIN_HOME_STALE_TIME,
  });
  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: fetchAdminUsers,
    staleTime: ADMIN_HOME_STALE_TIME,
  });
  const rolesQuery = useQuery({
    queryKey: queryKeys.admin.roles,
    queryFn: fetchAdminRoles,
    staleTime: ADMIN_HOME_STALE_TIME,
  });
  const reportsQuery = useQuery({
    queryKey: ["admin", "home", "comment-reports-preview"] as const,
    queryFn: () => fetchCommentModerationPage({ limit: 2 }),
    staleTime: ADMIN_HOME_STALE_TIME,
  });
  const footerQuery = useQuery({
    queryKey: queryKeys.admin.footerSettings,
    queryFn: fetchAdminFooterSettings,
    staleTime: ADMIN_HOME_STALE_TIME,
  });
  const auditQuery = useQuery({
    queryKey: queryKeys.admin.auditLog,
    queryFn: fetchAdminAuditLog,
    staleTime: ADMIN_HOME_STALE_TIME,
  });
  const authQuery = useQuery({
    queryKey: queryKeys.admin.authControls,
    queryFn: fetchAdminAuthControls,
    staleTime: ADMIN_HOME_STALE_TIME,
  });
  const flagsQuery = useQuery({
    queryKey: queryKeys.admin.featureFlags,
    queryFn: fetchFeatureFlags,
    staleTime: ADMIN_HOME_STALE_TIME,
  });
  const maintenanceQuery = useQuery({
    queryKey: queryKeys.admin.maintenance,
    queryFn: fetchMaintenanceSettings,
    staleTime: ADMIN_HOME_STALE_TIME,
  });

  const metrics = metricsQuery.data;
  const users = usersQuery.data ?? [];
  const rolesPayload = rolesQuery.data;
  const reportItems = reportsQuery.data?.items ?? [];
  const footerSettings = footerQuery.data;
  const auditItems = getRecentAuditItems(auditQuery.data ?? []);
  const authControls = authQuery.data?.controls ?? [];
  const featureFlags = flagsQuery.data ?? [];
  const maintenance = maintenanceQuery.data;
  const activeUsers = getActiveUsersCount(users);
  const enabledFlags = getEnabledFlagsCount(featureFlags);
  const visibleOpenReports = reportItems.reduce(
    (total, item) => total + item.openReportCount,
    0
  );
  const openReports = metrics?.openReports ?? visibleOpenReports;
  const siteIsLocked = Boolean(maintenance?.enabled);
  const priorityTone: Exclude<PreviewTone, "dark"> =
    siteIsLocked || openReports > 0 ? "warn" : "good";

  return (
    <div className="space-y-4 p-3 sm:p-5 md:p-6">
      <section className="grid gap-3 lg:grid-cols-12">
        <article className="rounded-md border border-violet-200/70 bg-[#17151d] p-5 text-white shadow-[0_18px_50px_rgba(23,21,29,0.22)] sm:p-6 lg:col-span-8">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-200">
            Operaciones
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black uppercase leading-none text-white sm:text-4xl">
            Centro admin
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-violet-50/72">
            Inicio para decidir rapido: revisar pendientes, cuidar accesos y
            controlar configuracion publica sin mezclarlo con el dashboard
            editorial.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <SignalPill
              label="Pendientes"
              value={openReports}
              tone={openReports > 0 ? "warn" : "good"}
            />
            <SignalPill
              label="Usuarios"
              value={metrics?.activeUsers ?? activeUsers}
            />
            <SignalPill
              label="Sitio"
              value={siteIsLocked ? "Bloqueado" : "Online"}
              tone={siteIsLocked ? "danger" : "good"}
            />
          </div>
        </article>

        <article className="rounded-md border border-[#ded7ef] bg-white p-4 text-[#17151d] shadow-[0_14px_36px_rgba(23,21,29,0.08)] sm:p-5 lg:col-span-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-violet-700">
                Estado
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase leading-none">
                Prioridad
              </h2>
            </div>
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-sm border ${
                priorityTone === "good"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              <FiCheckCircle className="size-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-5 grid gap-2">
            <CompactLine
              label="Moderacion"
              value={openReports > 0 ? "Revisar" : "Al dia"}
              tone={openReports > 0 ? "warn" : "good"}
            />
            <CompactLine
              label="Mantenimiento"
              value={siteIsLocked ? "Activo" : "Inactivo"}
              tone={siteIsLocked ? "danger" : "good"}
            />
            <CompactLine
              label="Flags activas"
              value={String(enabledFlags)}
            />
          </div>
        </article>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
        <AdminPreviewCard
          eyebrow="Comunidad"
          title="Reportes"
          description="Cola moderable y proximo comentario a revisar."
          route={ROUTES.ADMIN_COMMENT_REPORTS}
          Icon={FiMessageSquare}
          className="md:col-span-2 xl:col-span-6"
          tone={openReports > 0 ? "dark" : "good"}
        >
          {reportsQuery.isLoading ? (
            <PreviewLoading />
          ) : reportsQuery.isError ? (
            <PreviewError message="La cola no cargo. Podes entrar igual a la seccion." />
          ) : reportItems.length === 0 ? (
            <PreviewEmpty icon={FiCheckCircle} title="Sin reportes" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                <SignalPill
                  label="Comentarios"
                  value={reportItems.length}
                  tone="warn"
                />
                <SignalPill label="Reportes" value={visibleOpenReports} tone="warn" />
              </div>
              <div className="min-w-0 rounded-sm border border-white/10 bg-white/10 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-100/70">
                  Siguiente
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white">
                  {reportItems[0].comment.body}
                </p>
                <p className="mt-2 truncate text-xs text-violet-100/60">
                  {getAuthorName(reportItems[0])} -{" "}
                  {formatCommentRelativeDate(reportItems[0].comment.createdAt)}
                </p>
              </div>
            </div>
          )}
        </AdminPreviewCard>

        <AdminPreviewCard
          eyebrow="Seguridad"
          title="Usuarios"
          description="Accesos activos y roles asignados."
          route={ROUTES.ADMIN_USERS}
          Icon={FiUsers}
          className="xl:col-span-3"
        >
          {usersQuery.isLoading ? (
            <PreviewLoading />
          ) : usersQuery.isError ? (
            <PreviewError message="No pudimos cargar usuarios." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <SignalPill label="Total" value={users.length} />
                <SignalPill label="Activos" value={activeUsers} tone="good" />
              </div>
              {users[0] ? (
                <CompactLine
                  label={`${users[0].firstName} ${users[0].lastName}`.trim() || "Usuario"}
                  value={users[0].role}
                />
              ) : null}
            </>
          )}
        </AdminPreviewCard>

        <AdminPreviewCard
          eyebrow="Autorizacion"
          title="Roles"
          description="Permisos por rol y overrides operativos."
          route={ROUTES.ADMIN_ROLES}
          Icon={FiShield}
          className="xl:col-span-3"
        >
          {rolesQuery.isLoading ? (
            <PreviewLoading />
          ) : rolesQuery.isError || !rolesPayload ? (
            <PreviewError message="No pudimos cargar permisos." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <SignalPill label="Roles" value={rolesPayload.roles.length} />
                <SignalPill label="Overrides" value={rolesPayload.overrides.length} />
              </div>
              <CompactLine
                label="Admin"
                value={`${rolesPayload.defaults.admin.length} permisos`}
              />
            </>
          )}
        </AdminPreviewCard>

        <AdminPreviewCard
          eyebrow="Publico"
          title="Footer"
          description="Contacto, redes, links y sponsors visibles."
          route={ROUTES.ADMIN_FOOTER_SETTINGS}
          Icon={FiSettings}
          className="xl:col-span-4"
        >
          {footerQuery.isLoading ? (
            <PreviewLoading />
          ) : footerQuery.isError || !footerSettings ? (
            <PreviewError message="No pudimos cargar Sanity." />
          ) : (
            <>
              <p className="truncate text-sm font-bold text-[#17151d]">
                {footerSettings.contactEmail}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <SignalPill label="Redes" value={footerSettings.socials.length} />
                <SignalPill
                  label="Sponsors"
                  value={footerSettings.sponsors.length}
                />
              </div>
            </>
          )}
        </AdminPreviewCard>

        <AdminPreviewCard
          eyebrow="Operaciones"
          title="Mantenimiento"
          description="Bloqueo app-level del sitio publico."
          route={ROUTES.ADMIN_MAINTENANCE}
          Icon={FiTool}
          className="xl:col-span-4"
          tone={siteIsLocked ? "danger" : "good"}
        >
          {maintenanceQuery.isLoading ? (
            <PreviewLoading />
          ) : maintenanceQuery.isError ? (
            <PreviewError message="No pudimos cargar el estado." />
          ) : (
            <>
              <CompactLine
                label="Sitio publico"
                value={siteIsLocked ? "Bloqueado" : "Online"}
                tone={siteIsLocked ? "danger" : "good"}
              />
              <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600">
                {maintenance?.message || "Sin mensaje activo."}
              </p>
            </>
          )}
        </AdminPreviewCard>

        <AdminPreviewCard
          eyebrow="Operaciones"
          title="Flags"
          description="Activadores de producto guardados en Supabase."
          route={ROUTES.ADMIN_FEATURE_FLAGS}
          Icon={FiFlag}
          className="xl:col-span-4"
        >
          {flagsQuery.isLoading ? (
            <PreviewLoading />
          ) : flagsQuery.isError ? (
            <PreviewError message="No pudimos cargar flags." />
          ) : featureFlags.length === 0 ? (
            <PreviewEmpty icon={FiFlag} title="Sin flags" tone="default" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <SignalPill label="Activas" value={enabledFlags} tone="good" />
                <SignalPill
                  label="Inactivas"
                  value={featureFlags.length - enabledFlags}
                />
              </div>
              <CompactLine
                label={featureFlags[0].label}
                value={featureFlags[0].enabled ? "Activa" : "Off"}
                tone={featureFlags[0].enabled ? "good" : "default"}
              />
            </>
          )}
        </AdminPreviewCard>

        <AdminPreviewCard
          eyebrow="Trazabilidad"
          title="Audit log"
          description="Ultimas acciones sensibles del panel."
          route={ROUTES.ADMIN_AUDIT_LOG}
          Icon={FiActivity}
          className="xl:col-span-4"
        >
          {auditQuery.isLoading ? (
            <PreviewLoading />
          ) : auditQuery.isError ? (
            <PreviewError message="No pudimos cargar eventos." />
          ) : auditItems.length === 0 ? (
            <PreviewEmpty icon={FiActivity} title="Sin eventos" tone="default" />
          ) : (
            <div className="grid gap-2">
              {auditItems.map((item) => (
                <CompactLine
                  key={item.id}
                  label={`${item.resource} - ${item.action}`}
                  value={formatDateTime(item.createdAt)}
                />
              ))}
            </div>
          )}
        </AdminPreviewCard>

        <AdminPreviewCard
          eyebrow="Metricas"
          title="Resumen"
          description="Conteos internos y accesos a Vercel."
          route={ROUTES.ADMIN_METRICS}
          Icon={FiActivity}
          className="xl:col-span-4"
        >
          {metricsQuery.isLoading ? (
            <PreviewLoading />
          ) : metricsQuery.isError || !metrics ? (
            <PreviewError message="No pudimos cargar metricas." />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <SignalPill label="Usuarios" value={metrics.users} />
              <SignalPill label="Comentarios" value={metrics.comments} />
              <SignalPill
                label="Reportes"
                value={metrics.openReports}
                tone={metrics.openReports > 0 ? "warn" : "good"}
              />
              <SignalPill label="Audit" value={metrics.auditEvents} />
            </div>
          )}
        </AdminPreviewCard>

        <AdminPreviewCard
          eyebrow="Supabase"
          title="Auth"
          description="Estado operativo de identidad y sesiones."
          route={ROUTES.ADMIN_AUTH_CONTROLS}
          Icon={FiAtSign}
          className="xl:col-span-4"
        >
          {authQuery.isLoading ? (
            <PreviewLoading />
          ) : authQuery.isError ? (
            <PreviewError message="No pudimos cargar auth." />
          ) : (
            <>
              <CompactLine
                label="Proveedor"
                value={authQuery.data?.provider ?? "Supabase"}
              />
              {authControls[0] ? (
                <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600">
                  {authControls[0].label}: {authControls[0].description}
                </p>
              ) : null}
            </>
          )}
        </AdminPreviewCard>
      </section>
    </div>
  );
};

export default AdminHome;
