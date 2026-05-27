import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiTrash2,
} from "react-icons/fi";

import {
  publishDashboardTable,
  publishDashboardTableById,
  saveDashboardTableDraft,
} from "../../../data/dashboardTable";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import type {
  DashboardTableInput,
  DashboardTableItem,
  DashboardTableMutationInput,
  DashboardTableTeamOption,
} from "../../../types/dashboard";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import { formatDateTime } from "../../utils/date.utils";
import { Field, SelectField } from "./DashboardTableFields";
import type { DashboardTableErrors } from "./dashboardTable.utils";
import {
  buildDashboardTableDraftInput,
  buildDashboardTableMutationInput,
  createDashboardTableRow,
  fromDatetimeLocalValue,
  getActiveTournamentParticipants,
  getTournamentLabel,
  toDatetimeLocalValue,
  validateDashboardTableInput,
} from "./dashboardTable.utils";
import {
  cacheDashboardTable,
  dashboardTableDetailQueryOptions,
  dashboardTableOptionsQueryOptions,
  invalidateDashboardTablesList,
  invalidateDashboardTablePublishDependencies,
} from "./dashboardTable.queries";

type SavedTableSnapshot = {
  valuesJson: string;
};

const dirtyFieldLabels = {
  tournamentId: "Torneo",
  matchdayNumber: "Fecha",
  label: "Etiqueta",
  snapshotDate: "Fecha visible",
  gamesThroughDate: "Corte de partidos",
  rows: "Filas",
} as const;

type DirtyFieldKey = keyof typeof dirtyFieldLabels;

const saveToastOptions = {
  style: {
    minWidth: "17rem",
  },
} as const;

const tableStatFields = [
  ["wins", "G", "Ganados"],
  ["draws", "E", "Empatados"],
  ["losses", "P", "Perdidos"],
  ["goalsFor", "GF", "Goles a favor"],
  ["goalsAgainst", "GC", "Goles en contra"],
] as const satisfies ReadonlyArray<
  readonly [keyof DashboardTableInput["rows"][number], string, string]
>;

const createRowKey = (): string => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

type TableStatInputProps = {
  rowKey: string;
  field: (typeof tableStatFields)[number][0];
  label: string;
  description: string;
  value: string;
  onChange: (
    rowKey: string,
    field: keyof DashboardTableInput["rows"][number],
    nextValue: string
  ) => void;
};

const TableStatInput = ({
  rowKey,
  field,
  label,
  description,
  value,
  onChange,
}: TableStatInputProps) => (
  <label className="block min-w-0">
    <span className="mb-1 block h-3 truncate text-center text-[0.56rem] font-black uppercase leading-3 tracking-[0.08em] text-violet-100/50 sm:text-[0.62rem] xl:hidden">
      {label}
    </span>
    <span className="mb-1 hidden h-3 truncate text-center text-[0.6rem] font-black uppercase leading-3 tracking-[0.06em] text-violet-100/50 xl:block">
      {description}
    </span>
    <input
      type="number"
      min={0}
      value={value}
      onChange={(event) => onChange(rowKey, field, event.target.value)}
      className="h-9 w-full min-w-0 rounded-[3px] border border-white/10 bg-[#0b0b0f] px-1 text-center text-sm font-black tabular-nums text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20 sm:h-10 sm:text-base lg:h-11"
      aria-label={description}
    />
  </label>
);

const createInitialValues = (): DashboardTableInput => {
  const now = new Date().toISOString();

  return {
    tournamentId: "",
    matchdayNumber: "1",
    label: "Fecha 1",
    snapshotDate: now,
    gamesThroughDate: now,
    rows: [],
  };
};

const serializeValues = (values: DashboardTableInput): string =>
  JSON.stringify(values);

const createSavedSnapshot = (
  values: DashboardTableInput
): SavedTableSnapshot => ({
  valuesJson: serializeValues(values),
});

const getValuesFromTable = (table: DashboardTableItem): DashboardTableInput => ({
  tournamentId: table.tournamentId ?? "",
  matchdayNumber: table.matchdayNumber ? String(table.matchdayNumber) : "",
  label: table.label ?? "",
  snapshotDate: table.snapshotDate ?? "",
  gamesThroughDate: table.gamesThroughDate ?? "",
  rows: table.rows.map((row) => ({
    key: row.key ?? createRowKey(),
    teamId: row.teamId ?? "",
    wins: row.wins == null ? "" : String(row.wins),
    draws: row.draws == null ? "" : String(row.draws),
    losses: row.losses == null ? "" : String(row.losses),
    goalsFor: row.goalsFor == null ? "" : String(row.goalsFor),
    goalsAgainst: row.goalsAgainst == null ? "" : String(row.goalsAgainst),
  })),
});

const TeamLogo = ({ team }: { team?: DashboardTableTeamOption }) => {
  const imageUrl = getImageUrl(team?.imageUrl, {
    width: 80,
    height: 80,
    fit: "max",
    quality: 72,
  });
  const imageSrcSet = getImageSrcSet(team?.imageUrl, [48, 80, 120], {
    height: (width) => width,
    fit: "max",
    quality: 72,
  });

  if (!imageUrl) {
    return (
      <div
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-violet-400/10 text-[0.62rem] font-black uppercase tracking-[0.14em] text-violet-100/55"
      >
        MFC
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      srcSet={imageSrcSet || undefined}
      sizes="44px"
      alt={team?.name ?? "Escudo"}
      loading="lazy"
      decoding="async"
      className="size-11 shrink-0 rounded-[3px] border border-white/10 object-contain"
    />
  );
};

const DashboardTableForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [initialValues] = useState(createInitialValues);
  const [values, setValues] = useState<DashboardTableInput>(initialValues);
  const [savedSnapshot, setSavedSnapshot] = useState<SavedTableSnapshot>(
    createSavedSnapshot(initialValues)
  );
  const [errors, setErrors] = useState<DashboardTableErrors>({});
  const [status, setStatus] = useState<string | null>(null);

  const optionsQuery = useQuery(dashboardTableOptionsQueryOptions());

  const tableQuery = useQuery({
    ...dashboardTableDetailQueryOptions(id ?? "new"),
    enabled: isEditing,
  });

  const selectedTournament = optionsQuery.data?.tournaments.find(
    (tournament) => tournament.id === values.tournamentId
  );
  const selectedParticipants = selectedTournament?.participants ?? [];
  const activeParticipants = getActiveTournamentParticipants(
    selectedTournament,
    values.matchdayNumber
  );

  useEffect(() => {
    if (!tableQuery.data) {
      return;
    }

    const nextValues = getValuesFromTable(tableQuery.data);

    setValues(nextValues);
    setErrors({});
    setStatus(null);
    setSavedSnapshot(createSavedSnapshot(nextValues));
  }, [tableQuery.data]);

  useEffect(() => {
    if (isEditing || !optionsQuery.data || values.tournamentId) {
      return;
    }

    const defaultTournament =
      optionsQuery.data.tournaments.find((tournament) => tournament.active) ??
      optionsQuery.data.tournaments[0];

    if (!defaultTournament) {
      return;
    }

    const nextValues: DashboardTableInput = {
      ...initialValues,
      tournamentId: defaultTournament.id,
      rows: getActiveTournamentParticipants(
        defaultTournament,
        initialValues.matchdayNumber
      ).map((participant) => createDashboardTableRow(createRowKey(), participant)),
    };

    setValues(nextValues);
    setSavedSnapshot(createSavedSnapshot(nextValues));
  }, [initialValues, isEditing, optionsQuery.data, values.tournamentId]);

  const saveDraftMutation = useMutation({
    mutationFn: async (input: ReturnType<typeof buildDashboardTableDraftInput>) =>
      saveDashboardTableDraft(input, id),
    onSuccess: async (savedTable) => {
      await invalidateDashboardTablesList(queryClient);
      cacheDashboardTable(queryClient, savedTable);

      const nextValues = getValuesFromTable(savedTable);
      setValues(nextValues);
      setSavedSnapshot(createSavedSnapshot(nextValues));

      if (!isEditing) {
        navigate(ROUTES.DASHBOARD_TABLE_EDIT(savedTable.id), {
          replace: true,
        });
      }
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (input: DashboardTableMutationInput) =>
      isEditing && id
        ? publishDashboardTableById(id, input)
        : publishDashboardTable(input),
    onSuccess: async (savedTable) => {
      await invalidateDashboardTablePublishDependencies(queryClient);
      cacheDashboardTable(queryClient, savedTable);
      navigate(ROUTES.DASHBOARD_TABLE);
    },
  });

  const currentValuesJson = useMemo(() => serializeValues(values), [values]);
  const dirtyFields = useMemo<DirtyFieldKey[]>(() => {
    if (currentValuesJson === savedSnapshot.valuesJson) {
      return [];
    }

    const savedValues = JSON.parse(savedSnapshot.valuesJson) as DashboardTableInput;

    return (Object.keys(dirtyFieldLabels) as DirtyFieldKey[]).filter((field) =>
      field === "rows"
        ? JSON.stringify(values.rows) !== JSON.stringify(savedValues.rows)
        : values[field] !== savedValues[field]
    );
  }, [currentValuesJson, savedSnapshot.valuesJson, values]);
  const dirtyLabels = dirtyFields.map((field) => dirtyFieldLabels[field]);
  const isDirty = (field: DirtyFieldKey): boolean =>
    dirtyFields.includes(field);
  const isSaving = saveDraftMutation.isPending || publishMutation.isPending;

  if (optionsQuery.isLoading || tableQuery.isLoading) {
    return <DashboardContentLoader />;
  }

  if (optionsQuery.isError || tableQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar la tabla"
        message="Intenta nuevamente en unos minutos."
        onRetry={() => {
          void optionsQuery.refetch();
          void tableQuery.refetch();
        }}
      />
    );
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setValues((currentValues) => {
      if (name === "snapshotDate" || name === "gamesThroughDate") {
        return {
          ...currentValues,
          [name]: fromDatetimeLocalValue(value),
        };
      }

      if (name === "tournamentId") {
        return {
          ...currentValues,
          tournamentId: value,
          rows: [],
        };
      }

      if (name === "matchdayNumber") {
        return {
          ...currentValues,
          matchdayNumber: value,
          label: currentValues.label || (value ? `Fecha ${value}` : ""),
        };
      }

      return {
        ...currentValues,
        [name]: value,
      };
    });

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }));
    setStatus(null);
  };

  const handleRowChange = (
    rowKey: string,
    field: keyof DashboardTableInput["rows"][number],
    nextValue: string
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      rows: currentValues.rows.map((row) =>
        row.key === rowKey
          ? {
              ...row,
              [field]: nextValue,
            }
          : row
      ),
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      rows: undefined,
      [`row-${rowKey}`]: undefined,
    }));
    setStatus(null);
  };

  const handleAddRow = () => {
    setValues((currentValues) => ({
      ...currentValues,
      rows: [...currentValues.rows, createDashboardTableRow(createRowKey())],
    }));
    setStatus(null);
  };

  const handleRemoveRow = (rowKey: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      rows: currentValues.rows.filter((row) => row.key !== rowKey),
    }));
    setStatus(null);
  };

  const handleUseActiveParticipants = () => {
    setValues((currentValues) => ({
      ...currentValues,
      rows: activeParticipants.map((participant) =>
        createDashboardTableRow(createRowKey(), participant)
      ),
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      rows: undefined,
    }));
    setStatus(null);
  };

  const getSelectedTeam = (teamId: string) =>
    selectedParticipants.find((participant) => participant.id === teamId);

  const getMissingActiveParticipantNames = (nextValues: DashboardTableInput) => {
    const selectedTeamIds = new Set(
      nextValues.rows.map((row) => row.teamId.trim()).filter(Boolean)
    );

    return activeParticipants
      .filter((participant) => !selectedTeamIds.has(participant.id))
      .map((participant) => participant.name);
  };

  const handleSaveDraft = async () => {
    setStatus(null);
    setErrors({});

    try {
      await toast.promise(
        saveDraftMutation.mutateAsync(buildDashboardTableDraftInput(values)),
        {
          loading: "Guardando borrador en Sanity...",
          success: "Borrador guardado correctamente.",
          error: "No pudimos guardar el borrador.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardTableForm",
        action: "save_table_draft",
      });
      setStatus("No pudimos guardar el borrador. Intenta de nuevo.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValues: DashboardTableInput = {
      ...values,
      tournamentId: values.tournamentId.trim(),
      matchdayNumber: values.matchdayNumber.trim(),
      label: values.label.trim(),
      snapshotDate: values.snapshotDate.trim(),
      gamesThroughDate: values.gamesThroughDate.trim(),
      rows: values.rows.map((row) => ({
        ...row,
        teamId: row.teamId.trim(),
        wins: row.wins.trim(),
        draws: row.draws.trim(),
        losses: row.losses.trim(),
        goalsFor: row.goalsFor.trim(),
        goalsAgainst: row.goalsAgainst.trim(),
      })),
    };
    const nextErrors = validateDashboardTableInput(normalizedValues);
    const missingParticipants = getMissingActiveParticipantNames(normalizedValues);

    if (missingParticipants.length > 0) {
      nextErrors.rows = `Falta cargar: ${missingParticipants.join(", ")}.`;
    }

    setErrors(nextErrors);
    setStatus(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const confirmed = await confirmDashboardAction({
      title: isEditing ? "Publicar cambios" : "Publicar tabla",
      text: "La tabla actual se publicara en Sanity. El historial de tablas queda gestionado internamente.",
      confirmText: isEditing ? "Publicar cambios" : "Publicar",
      icon: isEditing ? "question" : "info",
    });

    if (!confirmed) {
      return;
    }

    try {
      await toast.promise(
        publishMutation.mutateAsync(
          buildDashboardTableMutationInput(normalizedValues)
        ),
        {
          loading: isEditing
            ? "Publicando cambios en Sanity..."
            : "Publicando tabla en Sanity...",
          success: isEditing
            ? "Cambios publicados correctamente."
            : "Tabla publicada correctamente.",
          error: "No pudimos publicar la tabla.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardTableForm",
        action: isEditing ? "publish_table_changes" : "publish_table",
      });
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos publicar la tabla. Intenta de nuevo."
      );
    }
  };

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Tabla
            </p>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              {isEditing ? "Editar tabla" : "Nueva tabla"}
            </h2>
            <p className="mt-2 text-sm text-violet-100/65">
              Modifica la tabla actual editable por torneo y fecha.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_TABLE}
            className="order-first inline-flex min-h-10 w-fit items-center justify-center gap-2 self-start rounded-[3px] border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-violet-200/35 hover:bg-white/4.5 sm:order-none sm:min-h-11 sm:self-auto sm:px-4 sm:py-3 sm:text-sm"
          >
            <FiArrowLeft className="size-4" aria-hidden="true" />
            Volver a la lista
          </Link>
        </div>
      </header>

      <div className="grid gap-4 p-3 sm:gap-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form
          className="space-y-4 rounded-sm border border-white/10 bg-[#16161a] p-3 sm:space-y-5 sm:p-6"
          onSubmit={handleSubmit}
          noValidate
        >
          {dirtyLabels.length > 0 && (
            <div className="rounded-sm border border-amber-200/20 bg-amber-200/6 p-3 text-sm text-amber-50">
              <p className="font-semibold">Cambios sin guardar</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-50/75">
                Campos editados: {dirtyLabels.join(", ")}.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 *:min-w-0">
            <SelectField
              id="dashboard-table-tournament"
              name="tournamentId"
              label="Torneo"
              value={values.tournamentId}
              error={errors.tournamentId}
              dirty={isDirty("tournamentId")}
              onChange={handleChange}
            >
              <option value="">Elegir torneo</option>
              {(optionsQuery.data?.tournaments ?? []).map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {getTournamentLabel(tournament)}
                </option>
              ))}
            </SelectField>

            <Field
              id="dashboard-table-matchday"
              name="matchdayNumber"
              type="number"
              min={1}
              label="Numero de fecha"
              value={values.matchdayNumber}
              error={errors.matchdayNumber}
              dirty={isDirty("matchdayNumber")}
              onChange={handleChange}
            />
          </div>

          <Field
            id="dashboard-table-label"
            name="label"
            label="Etiqueta"
            value={values.label}
            error={errors.label}
            dirty={isDirty("label")}
            onChange={handleChange}
          />

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 *:min-w-0">
            <Field
              id="dashboard-table-snapshot-date"
              name="snapshotDate"
              type="datetime-local"
              label="Fecha visible"
              value={toDatetimeLocalValue(values.snapshotDate)}
              error={errors.snapshotDate}
              dirty={isDirty("snapshotDate")}
              onChange={handleChange}
            />
            <Field
              id="dashboard-table-games-through-date"
              name="gamesThroughDate"
              type="datetime-local"
              label="Partidos de Mentira hasta"
              value={toDatetimeLocalValue(values.gamesThroughDate)}
              error={errors.gamesThroughDate}
              dirty={isDirty("gamesThroughDate")}
              onChange={handleChange}
            />
          </div>

          <section className="space-y-3 rounded-sm border border-white/10 bg-[#0f0f13] p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-violet-100">
                  <span>Filas de tabla</span>
                  {isDirty("rows") && (
                    <span className="rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
                      Editado
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-violet-100/55">
                  Carga solo rivales participantes; Mentira FC se calcula desde
                  partidos finalizados.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[3px] border border-white/10 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:border-violet-200/35 hover:bg-white/4.5 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!selectedTournament || activeParticipants.length === 0}
                  onClick={handleUseActiveParticipants}
                >
                  <FiRefreshCw className="size-4" aria-hidden="true" />
                  Participantes
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[3px] border border-violet-200/25 bg-violet-100 px-3 py-2 text-xs font-semibold text-violet-950 transition hover:bg-white"
                  onClick={handleAddRow}
                >
                  <FiPlus className="size-4" aria-hidden="true" />
                  Fila
                </button>
              </div>
            </div>

            {errors.rows && (
              <p className="rounded-[3px] border border-red-300/20 bg-red-400/8 px-3 py-2 text-sm text-red-200">
                {errors.rows}
              </p>
            )}

            {values.rows.length === 0 ? (
              <p className="rounded-[3px] border border-dashed border-white/10 px-3 py-3 text-sm text-violet-100/55">
                Sin filas cargadas.
              </p>
            ) : (
              <div className="space-y-2">
                {values.rows.map((row) => {
                  const selectedTeam = getSelectedTeam(row.teamId);
                  const rowError = errors[`row-${row.key}`];
                  const rowPlayed =
                    (Number(row.wins) || 0) +
                    (Number(row.draws) || 0) +
                    (Number(row.losses) || 0);
                  const rowGoalDiff =
                    (Number(row.goalsFor) || 0) -
                    (Number(row.goalsAgainst) || 0);

                  return (
                    <div
                      key={row.key}
                      className="overflow-hidden rounded-[3px] border border-white/10 bg-[#151518] shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                    >
                      <div className="grid gap-2 p-2 sm:p-3 lg:grid-cols-[minmax(15rem,1.1fr)_minmax(24rem,1.8fr)_3.25rem] lg:gap-0 lg:p-0">
                        <div className="grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 lg:grid-cols-[2.75rem_minmax(0,1fr)] lg:border-r lg:border-white/10 lg:bg-white/[0.025] lg:p-3">
                          <TeamLogo team={selectedTeam} />
                          <select
                            value={row.teamId}
                            onChange={(event) =>
                              handleRowChange(
                                row.key,
                                "teamId",
                                event.target.value
                              )
                            }
                            className="h-10 w-full min-w-0 rounded-[3px] border border-white/10 bg-[#0b0b0f] px-2 text-sm font-semibold text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20 sm:h-11 sm:px-3"
                            aria-label="Equipo"
                          >
                            <option value="">Elegir equipo</option>
                            {selectedParticipants.map((participant) => (
                              <option key={participant.id} value={participant.id}>
                                {participant.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="inline-flex h-10 w-11 items-center justify-center rounded-[3px] border border-red-300/15 text-red-100 transition hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500/40 sm:h-11 lg:hidden"
                            aria-label="Quitar fila"
                            title="Quitar fila"
                            onClick={() => handleRemoveRow(row.key)}
                          >
                            <FiTrash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="min-w-0 lg:p-3">
                          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                            {tableStatFields.map(([field, label, description]) => (
                              <TableStatInput
                                key={field}
                                rowKey={row.key}
                                field={field}
                                label={label}
                                description={description}
                                value={row[field]}
                                onChange={handleRowChange}
                              />
                            ))}
                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[0.65rem] sm:hidden">
                            <span className="rounded-[3px] border border-white/10 bg-black/20 px-2 py-1 font-semibold text-violet-100/65">
                              PJ{" "}
                              <strong className="ml-1 text-white tabular-nums">
                                {rowPlayed}
                              </strong>
                            </span>
                            <span className="rounded-[3px] border border-white/10 bg-black/20 px-2 py-1 font-semibold text-violet-100/65">
                              DG{" "}
                              <strong
                                className={`ml-1 tabular-nums ${
                                  rowGoalDiff > 0
                                    ? "text-emerald-200"
                                    : rowGoalDiff < 0
                                      ? "text-red-200"
                                      : "text-white"
                                }`}
                              >
                                {rowGoalDiff > 0 ? `+${rowGoalDiff}` : rowGoalDiff}
                              </strong>
                            </span>
                          </div>

                          <div className="mt-3 hidden border-t border-white/8 pt-2 text-xs sm:flex sm:flex-wrap sm:gap-2">
                            <span className="rounded-[3px] border border-white/10 bg-black/20 px-2.5 py-1.5 font-semibold text-violet-100/65">
                              PJ{" "}
                              <strong className="ml-1 text-white tabular-nums">
                                {rowPlayed}
                              </strong>
                            </span>
                            <span className="rounded-[3px] border border-white/10 bg-black/20 px-2.5 py-1.5 font-semibold text-violet-100/65">
                              DG{" "}
                              <strong
                                className={`ml-1 tabular-nums ${
                                  rowGoalDiff > 0
                                    ? "text-emerald-200"
                                    : rowGoalDiff < 0
                                      ? "text-red-200"
                                      : "text-white"
                                }`}
                              >
                                {rowGoalDiff > 0 ? `+${rowGoalDiff}` : rowGoalDiff}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="hidden border-l border-white/10 lg:flex">
                          <button
                            type="button"
                            className="inline-flex min-h-full w-full items-center justify-center text-red-100 transition hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500/40"
                            aria-label="Quitar fila"
                            title="Quitar fila"
                            onClick={() => handleRemoveRow(row.key)}
                          >
                            <FiTrash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {rowError && (
                        <p className="border-t border-red-300/20 bg-red-400/8 px-3 py-2 text-sm text-red-200">
                          {rowError}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-violet-200/35 hover:bg-white/4.5 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-55"
              onClick={() => void handleSaveDraft()}
            >
              <FiSave className="size-4" aria-hidden="true" />
              {saveDraftMutation.isPending ? "Guardando..." : "Guardar borrador"}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-violet-200/25 bg-violet-100 px-5 py-3 text-sm font-semibold text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <FiSave className="size-4" aria-hidden="true" />
              {publishMutation.isPending
                ? "Publicando..."
                : isEditing
                  ? "Publicar cambios"
                  : "Publicar"}
            </button>
          </div>

          <div
            className="min-h-6 text-sm text-red-300"
            aria-live="polite"
            role={status ? "alert" : undefined}
          >
            {status}
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-sm border border-white/10 bg-[#16161a] p-3 sm:p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
              Resumen
            </h3>
            <div className="mt-4 rounded-[3px] border border-white/10 bg-[#0f0f13] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-violet-100/45">
                {getTournamentLabel(selectedTournament)}
              </p>
              <p className="mt-2 text-xl font-black uppercase leading-tight text-white">
                {values.label || `Fecha ${values.matchdayNumber || "?"}`}
              </p>
              <p className="mt-2 text-sm text-violet-100/65">
                {values.snapshotDate
                  ? formatDateTime(values.snapshotDate)
                  : "Sin fecha visible"}
              </p>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-violet-100/45">Participantes activos</dt>
                <dd className="mt-1 text-white">{activeParticipants.length}</dd>
              </div>
              <div>
                <dt className="text-violet-100/45">Filas cargadas</dt>
                <dd className="mt-1 text-white">{values.rows.length}</dd>
              </div>
              <div>
                <dt className="text-violet-100/45">Corte de partidos</dt>
                <dd className="mt-1 text-white">
                  {values.gamesThroughDate
                    ? formatDateTime(values.gamesThroughDate)
                    : "Sin corte"}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DashboardTableForm;
