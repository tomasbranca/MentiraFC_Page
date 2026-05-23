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
  FiMessageSquare,
  FiPlus,
  FiSave,
  FiTrash2,
} from "react-icons/fi";

import {
  fetchDashboardTournamentById,
  fetchDashboardTournamentOptions,
  publishDashboardTournament,
  publishDashboardTournamentById,
  saveDashboardTournamentDraft,
} from "../../../data/dashboardTournaments";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import type {
  DashboardTournamentInput,
  DashboardTournamentItem,
  DashboardTournamentMutationInput,
  DashboardTournamentParticipantStatus,
  DashboardTournamentTeamOption,
} from "../../../types/dashboard";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import Loader from "../../components/Loader/Loader";
import { Field, SelectField } from "./DashboardTournamentsFields";
import type { DashboardTournamentErrors } from "./dashboardTournaments.utils";
import {
  TOURNAMENT_PARTICIPANT_STATUS_OPTIONS,
  buildDashboardTournamentDraftInput,
  buildDashboardTournamentMutationInput,
  createDashboardTournamentParticipant,
  getTournamentReferenceCount,
  validateDashboardTournamentInput,
} from "./dashboardTournaments.utils";

type SavedTournamentSnapshot = {
  valuesJson: string;
};

const dirtyFieldLabels = {
  name: "Nombre",
  organizationId: "Organizador",
  active: "Activo",
  primaryPrizeSlots: "Primer premio",
  secondaryPrizeSlots: "Segundo premio",
  participants: "Participantes",
} as const;

type DirtyFieldKey = keyof typeof dirtyFieldLabels;
type TournamentTextField =
  | "name"
  | "organizationId"
  | "primaryPrizeSlots"
  | "secondaryPrizeSlots";

const saveToastOptions = {
  style: {
    minWidth: "17rem",
  },
} as const;

const createRowKey = (): string => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `participant-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const createInitialValues = (): DashboardTournamentInput => ({
  name: "",
  organizationId: "",
  active: false,
  primaryPrizeSlots: "1",
  secondaryPrizeSlots: "4",
  participants: [],
});

const serializeValues = (values: DashboardTournamentInput): string =>
  JSON.stringify(values);

const createSavedSnapshot = (
  values: DashboardTournamentInput
): SavedTournamentSnapshot => ({
  valuesJson: serializeValues(values),
});

const getValuesFromTournament = (
  tournament: DashboardTournamentItem
): DashboardTournamentInput => ({
  name: tournament.name === "Torneo sin nombre" ? "" : tournament.name,
  organizationId: tournament.organizationId ?? "",
  active: Boolean(tournament.active),
  primaryPrizeSlots:
    tournament.primaryPrizeSlots == null
      ? ""
      : String(tournament.primaryPrizeSlots),
  secondaryPrizeSlots:
    tournament.secondaryPrizeSlots == null
      ? ""
      : String(tournament.secondaryPrizeSlots),
  participants: tournament.participants.map((participant) => ({
    key: participant.key ?? createRowKey(),
    teamId: participant.teamId ?? "",
    status:
      participant.status === "replaced" || participant.status === "withdrawn"
        ? participant.status
        : "active",
    activeFromMatchday:
      participant.activeFromMatchday == null
        ? ""
        : String(participant.activeFromMatchday),
    activeUntilMatchday:
      participant.activeUntilMatchday == null
        ? ""
        : String(participant.activeUntilMatchday),
    notes: participant.notes ?? "",
  })),
});

const TeamLogo = ({
  team,
  compact = false,
}: {
  team?: DashboardTournamentTeamOption;
  compact?: boolean;
}) => {
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
        className={`flex shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-violet-400/10 text-[0.58rem] font-black uppercase tracking-[0.14em] text-violet-100/55 ${
          compact ? "size-9" : "size-10 sm:size-11"
        }`}
      >
        EQ
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
      className={`shrink-0 rounded-[3px] border border-white/10 object-contain ${
        compact ? "size-9" : "size-10 sm:size-11"
      }`}
    />
  );
};

const participantControlClassName =
  "h-10 w-full min-w-0 rounded-[3px] border border-white/10 bg-[#0b0b0f] px-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20";

const participantCompactControlClassName =
  "h-9 w-full min-w-0 rounded-[3px] border border-white/10 bg-[#0b0b0f] px-2 text-xs text-white outline-none transition placeholder:text-violet-100/35 focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20";

const participantCommentButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-[3px] border border-violet-200/18 text-violet-100 transition hover:border-violet-200/40 hover:bg-violet-300/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500/40";

const DashboardTournamentsForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [initialValues] = useState(createInitialValues);
  const [values, setValues] = useState<DashboardTournamentInput>(initialValues);
  const [savedSnapshot, setSavedSnapshot] = useState<SavedTournamentSnapshot>(
    createSavedSnapshot(initialValues)
  );
  const [errors, setErrors] = useState<DashboardTournamentErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [expandedNoteKeys, setExpandedNoteKeys] = useState<Set<string>>(
    () => new Set()
  );

  const optionsQuery = useQuery({
    queryKey: queryKeys.dashboard.tournaments.options,
    queryFn: async () => {
      try {
        return await fetchDashboardTournamentOptions();
      } catch (error) {
        reportError(error, {
          page: "DashboardTournamentsForm",
          action: "load_tournament_options",
        });
        throw error;
      }
    },
  });

  const tournamentQuery = useQuery({
    queryKey: queryKeys.dashboard.tournaments.byId(id ?? "new"),
    enabled: isEditing,
    queryFn: async () => {
      try {
        return await fetchDashboardTournamentById(id ?? "");
      } catch (error) {
        reportError(error, {
          page: "DashboardTournamentsForm",
          action: "load_tournament",
          id,
        });
        throw error;
      }
    },
  });

  useEffect(() => {
    if (!tournamentQuery.data) {
      return;
    }

    const nextValues = getValuesFromTournament(tournamentQuery.data);

    setValues(nextValues);
    setErrors({});
    setStatus(null);
    setSavedSnapshot(createSavedSnapshot(nextValues));
  }, [tournamentQuery.data]);

  useEffect(() => {
    if (isEditing || !optionsQuery.data || values.organizationId) {
      return;
    }

    const [firstOrganization] = optionsQuery.data.organizations;

    if (firstOrganization) {
      const nextValues = {
        ...initialValues,
        organizationId: firstOrganization.id,
      };

      setValues(nextValues);
      setSavedSnapshot(createSavedSnapshot(nextValues));
    }
  }, [initialValues, isEditing, optionsQuery.data, values.organizationId]);

  const saveDraftMutation = useMutation({
    mutationFn: async (
      input: ReturnType<typeof buildDashboardTournamentDraftInput>
    ) => saveDashboardTournamentDraft(input, id),
    onSuccess: async (savedTournament) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.tournaments.all,
      });
      queryClient.setQueryData(
        queryKeys.dashboard.tournaments.byId(savedTournament.id),
        savedTournament
      );

      const nextValues = getValuesFromTournament(savedTournament);
      setValues(nextValues);
      setSavedSnapshot(createSavedSnapshot(nextValues));

      if (!isEditing) {
        navigate(ROUTES.DASHBOARD_TOURNAMENTS_EDIT(savedTournament.id), {
          replace: true,
        });
      }
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (input: DashboardTournamentMutationInput) =>
      isEditing && id
        ? publishDashboardTournamentById(id, input)
        : publishDashboardTournament(input),
    onSuccess: async (savedTournament) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.tournaments.all,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.tournaments.options,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.matches.options,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.table.options,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.tournaments.current,
        }),
      ]);
      queryClient.setQueryData(
        queryKeys.dashboard.tournaments.byId(savedTournament.id),
        savedTournament
      );
      navigate(ROUTES.DASHBOARD_TOURNAMENTS);
    },
  });

  const currentValuesJson = useMemo(() => serializeValues(values), [values]);
  const dirtyFields = useMemo<DirtyFieldKey[]>(() => {
    if (currentValuesJson === savedSnapshot.valuesJson) {
      return [];
    }

    const savedValues = JSON.parse(
      savedSnapshot.valuesJson
    ) as DashboardTournamentInput;

    return (Object.keys(dirtyFieldLabels) as DirtyFieldKey[]).filter((field) =>
      field === "participants"
        ? JSON.stringify(values.participants) !==
          JSON.stringify(savedValues.participants)
        : values[field] !== savedValues[field]
    );
  }, [currentValuesJson, savedSnapshot.valuesJson, values]);
  const dirtyLabels = dirtyFields.map((field) => dirtyFieldLabels[field]);
  const isDirty = (field: DirtyFieldKey): boolean =>
    dirtyFields.includes(field);
  const isSaving = saveDraftMutation.isPending || publishMutation.isPending;

  if (optionsQuery.isLoading || tournamentQuery.isLoading) {
    return <Loader />;
  }

  if (optionsQuery.isError || tournamentQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar el torneo"
        message="Intenta nuevamente en unos minutos."
        onRetry={() => {
          void optionsQuery.refetch();
          void tournamentQuery.refetch();
        }}
      />
    );
  }

  const organization = optionsQuery.data?.organizations.find(
    (item) => item.id === values.organizationId
  );
  const teams = optionsQuery.data?.teams ?? [];
  const referenceCount = tournamentQuery.data
    ? getTournamentReferenceCount(tournamentQuery.data.referenceCounts)
    : 0;

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const field = name as TournamentTextField;

    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setStatus(null);
  };

  const handleActiveChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValues((currentValues) => ({
      ...currentValues,
      active: event.target.checked,
    }));
    setStatus(null);
  };

  const handleParticipantChange = (
    participantKey: string,
    field: keyof DashboardTournamentInput["participants"][number],
    nextValue: string
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      participants: currentValues.participants.map((participant) =>
        participant.key === participantKey
          ? field === "status"
            ? {
                ...participant,
                status: nextValue as DashboardTournamentParticipantStatus,
              }
            : {
                ...participant,
                [field]: nextValue,
              }
          : participant
      ),
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      participants: undefined,
      [`participant-${participantKey}`]: undefined,
    }));
    setStatus(null);
  };

  const handleAddParticipant = () => {
    setValues((currentValues) => ({
      ...currentValues,
      participants: [
        ...currentValues.participants,
        createDashboardTournamentParticipant(createRowKey()),
      ],
    }));
    setStatus(null);
  };

  const handleRemoveParticipant = (participantKey: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      participants: currentValues.participants.filter(
        (participant) => participant.key !== participantKey
      ),
    }));
    setExpandedNoteKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      nextKeys.delete(participantKey);
      return nextKeys;
    });
    setStatus(null);
  };

  const getSelectedTeam = (teamId: string) =>
    teams.find((team) => team.id === teamId);

  const toggleParticipantNote = (participantKey: string) => {
    setExpandedNoteKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);

      if (nextKeys.has(participantKey)) {
        nextKeys.delete(participantKey);
      } else {
        nextKeys.add(participantKey);
      }

      return nextKeys;
    });
  };

  const handleSaveDraft = async () => {
    setStatus(null);
    setErrors({});

    try {
      await toast.promise(
        saveDraftMutation.mutateAsync(buildDashboardTournamentDraftInput(values)),
        {
          loading: "Guardando borrador en Sanity...",
          success: "Borrador guardado correctamente.",
          error: "No pudimos guardar el borrador.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardTournamentsForm",
        action: "save_tournament_draft",
      });
      setStatus("No pudimos guardar el borrador. Intenta de nuevo.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValues: DashboardTournamentInput = {
      ...values,
      name: values.name.trim(),
      organizationId: values.organizationId.trim(),
      primaryPrizeSlots: values.primaryPrizeSlots.trim(),
      secondaryPrizeSlots: values.secondaryPrizeSlots.trim(),
      participants: values.participants.map((participant) => ({
        ...participant,
        teamId: participant.teamId.trim(),
        activeFromMatchday: participant.activeFromMatchday.trim(),
        activeUntilMatchday: participant.activeUntilMatchday.trim(),
        notes: participant.notes.trim(),
      })),
    };
    const nextErrors = validateDashboardTournamentInput(normalizedValues);

    setErrors(nextErrors);
    setStatus(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const confirmed = await confirmDashboardAction({
      title: isEditing ? "Publicar cambios" : "Publicar torneo",
      text: normalizedValues.active
        ? "El torneo se publicara como activo en Sanity y los otros torneos activos se desactivaran."
        : "El torneo se publicara en Sanity sin marcarse como activo.",
      confirmText: isEditing ? "Publicar cambios" : "Publicar",
      icon: isEditing ? "question" : "info",
    });

    if (!confirmed) {
      return;
    }

    try {
      await toast.promise(
        publishMutation.mutateAsync(
          buildDashboardTournamentMutationInput(normalizedValues)
        ),
        {
          loading: isEditing
            ? "Publicando cambios en Sanity..."
            : "Publicando torneo en Sanity...",
          success: isEditing
            ? "Cambios publicados correctamente."
            : "Torneo publicado correctamente.",
          error: (error) =>
            error instanceof Error
              ? error.message
              : "No pudimos publicar el torneo.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardTournamentsForm",
        action: isEditing ? "publish_tournament_changes" : "publish_tournament",
      });
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos publicar el torneo. Intenta de nuevo."
      );
    }
  };

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Torneos
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              {isEditing ? "Editar torneo" : "Nuevo torneo"}
            </h2>
            <p className="mt-2 text-sm text-violet-100/65">
              Gestiona el torneo, sus plazas y la lista oficial de equipos.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_TOURNAMENTS}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-white/10 px-4 py-3 text-sm text-white transition hover:border-violet-200/35 hover:bg-white/4.5"
          >
            <FiArrowLeft className="size-4" aria-hidden="true" />
            Volver
          </Link>
        </div>
      </header>

      <div className="grid gap-4 p-3 sm:gap-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <form
          className="min-w-0 space-y-4 rounded-sm border border-white/10 bg-[#16161a] p-3 sm:space-y-5 sm:p-6"
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
            <Field
              id="dashboard-tournament-name"
              name="name"
              label="Nombre"
              value={values.name}
              error={errors.name}
              dirty={isDirty("name")}
              onChange={handleChange}
            />
            <SelectField
              id="dashboard-tournament-organization"
              name="organizationId"
              label="Organizador"
              value={values.organizationId}
              error={errors.organizationId}
              dirty={isDirty("organizationId")}
              onChange={handleChange}
            >
              <option value="">Elegir organizador</option>
              {(optionsQuery.data?.organizations ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 *:min-w-0">
            <Field
              id="dashboard-tournament-primary-prize"
              name="primaryPrizeSlots"
              type="number"
              min={0}
              label="Plazas primer premio"
              value={values.primaryPrizeSlots}
              error={errors.primaryPrizeSlots}
              dirty={isDirty("primaryPrizeSlots")}
              onChange={handleChange}
            />
            <Field
              id="dashboard-tournament-secondary-prize"
              name="secondaryPrizeSlots"
              type="number"
              min={0}
              label="Plazas segundo premio"
              value={values.secondaryPrizeSlots}
              error={errors.secondaryPrizeSlots}
              dirty={isDirty("secondaryPrizeSlots")}
              onChange={handleChange}
            />
          </div>

          <label className="flex min-h-13 items-center justify-between gap-4 rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-3 text-sm text-violet-100 sm:px-4">
            <span className="min-w-0">
              <span className="flex items-center gap-2 font-medium">
                Activo
                {isDirty("active") && (
                  <span className="rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
                    Editado
                  </span>
                )}
              </span>
              <span className="mt-1 block text-xs text-violet-100/55">
                El torneo activo alimenta la tabla publica actual.
              </span>
            </span>
            <input
              type="checkbox"
              checked={values.active}
              onChange={handleActiveChange}
              className="size-5 shrink-0 accent-violet-300"
            />
          </label>

          <section className="min-w-0 space-y-3 rounded-sm border border-white/10 bg-[#0f0f13] p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-violet-100">
                  <span>Participantes</span>
                  {isDirty("participants") && (
                    <span className="rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
                      Editado
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-violet-100/55">
                  Carga rivales del torneo. Mentira FC se calcula desde los
                  partidos y no debe figurar aca.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[3px] border border-violet-200/25 bg-violet-100 px-3 py-2 text-xs font-semibold text-violet-950 transition hover:bg-white"
                onClick={handleAddParticipant}
              >
                <FiPlus className="size-4" aria-hidden="true" />
                Equipo
              </button>
            </div>

            {errors.participants && (
              <p className="rounded-[3px] border border-red-300/20 bg-red-400/8 px-3 py-2 text-sm text-red-200">
                {errors.participants}
              </p>
            )}

            {values.participants.length === 0 ? (
              <p className="rounded-[3px] border border-dashed border-white/10 px-3 py-3 text-sm text-violet-100/55">
                Sin participantes cargados.
              </p>
            ) : (
              <div className="min-w-0 space-y-2">
                {values.participants.map((participant) => {
                  const selectedTeam = getSelectedTeam(participant.teamId);
                  const participantError =
                    errors[`participant-${participant.key}`];
                  const hasNote = participant.notes.trim().length > 0;
                  const isNoteExpanded = expandedNoteKeys.has(participant.key);
                  const noteButtonClassName = `${participantCommentButtonClassName} ${
                    hasNote || isNoteExpanded
                      ? "border-violet-200/45 bg-violet-300/12 text-white"
                      : ""
                  }`;
                  const noteButtonLabel = hasNote
                    ? "Editar comentario"
                    : "Agregar comentario";

                  return (
                    <div
                      key={participant.key}
                      className="overflow-hidden rounded-[3px] border border-white/10 bg-[#151518] text-sm text-violet-50 shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                    >
                      <div className="grid gap-2 p-2 sm:p-3 lg:grid-cols-[minmax(15rem,1.1fr)_minmax(18rem,1fr)_5.75rem] lg:gap-0 lg:p-0">
                        <div className="grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)_5rem] items-center gap-2 lg:grid-cols-[2.75rem_minmax(0,1fr)] lg:border-r lg:border-white/10 lg:bg-white/[0.025] lg:p-3">
                          <TeamLogo team={selectedTeam} />
                          <select
                            value={participant.teamId}
                            onChange={(event) =>
                              handleParticipantChange(
                                participant.key,
                                "teamId",
                                event.target.value
                              )
                            }
                            className={`${participantCompactControlClassName} font-semibold`}
                            aria-label="Equipo participante"
                          >
                            <option value="">Elegir equipo</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex justify-end gap-1 lg:hidden">
                            <button
                              type="button"
                              className={`${noteButtonClassName} h-9 w-9`}
                              aria-label={noteButtonLabel}
                              title={noteButtonLabel}
                              onClick={() =>
                                toggleParticipantNote(participant.key)
                              }
                            >
                              <FiMessageSquare
                                className="size-4"
                                aria-hidden="true"
                              />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border border-red-300/15 text-red-100 transition hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500/40"
                              aria-label="Quitar participante"
                              title="Quitar participante"
                              onClick={() =>
                                handleRemoveParticipant(participant.key)
                              }
                            >
                              <FiTrash2
                                className="size-4"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>

                        <div className="min-w-0 lg:p-3">
                          <div className="grid grid-cols-[minmax(6.75rem,1fr)_minmax(0,4.25rem)_minmax(0,4.25rem)] gap-1.5 sm:gap-2 lg:grid-cols-[minmax(9rem,1fr)_repeat(2,minmax(0,5rem))]">
                            <select
                              value={participant.status}
                              onChange={(event) =>
                                handleParticipantChange(
                                  participant.key,
                                  "status",
                                  event.target.value
                                )
                              }
                              className={participantCompactControlClassName}
                              aria-label="Estado del participante"
                            >
                              {TOURNAMENT_PARTICIPANT_STATUS_OPTIONS.map(
                                (option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                )
                              )}
                            </select>

                            <input
                              type="number"
                              min={1}
                              value={participant.activeFromMatchday}
                              onChange={(event) =>
                                handleParticipantChange(
                                  participant.key,
                                  "activeFromMatchday",
                                  event.target.value
                                )
                              }
                              placeholder="Desde"
                              aria-label="Activo desde fecha"
                              className={participantCompactControlClassName}
                            />
                            <input
                              type="number"
                              min={1}
                              value={participant.activeUntilMatchday}
                              onChange={(event) =>
                                handleParticipantChange(
                                  participant.key,
                                  "activeUntilMatchday",
                                  event.target.value
                                )
                              }
                              placeholder="Hasta"
                              aria-label="Activo hasta fecha"
                              className={participantCompactControlClassName}
                            />
                          </div>
                        </div>

                        <div className="hidden border-l border-white/10 lg:grid lg:grid-cols-2">
                          <button
                            type="button"
                            className={`${noteButtonClassName} min-h-full w-full rounded-none border-0`}
                            aria-label={noteButtonLabel}
                            title={noteButtonLabel}
                            onClick={() =>
                              toggleParticipantNote(participant.key)
                            }
                          >
                            <FiMessageSquare
                              className="size-4"
                              aria-hidden="true"
                            />
                          </button>
                          <button
                            type="button"
                            className="inline-flex min-h-full w-full items-center justify-center border-l border-white/10 text-red-100 transition hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500/40"
                            aria-label="Quitar participante"
                            title="Quitar participante"
                            onClick={() =>
                              handleRemoveParticipant(participant.key)
                            }
                          >
                            <FiTrash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {isNoteExpanded && (
                        <div className="border-t border-white/8 p-2.5 sm:p-3">
                          <input
                            type="text"
                            value={participant.notes}
                            onChange={(event) =>
                              handleParticipantChange(
                                participant.key,
                                "notes",
                                event.target.value
                              )
                            }
                            placeholder="Comentario"
                            aria-label="Comentario del participante"
                            className={participantControlClassName}
                          />
                        </div>
                      )}

                      {participantError && (
                        <p className="border-t border-red-300/20 bg-red-400/8 px-3 py-2 text-sm text-red-200">
                          {participantError}
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

        <aside className="min-w-0 space-y-4">
          <section className="rounded-sm border border-white/10 bg-[#16161a] p-3 sm:p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
              Resumen
            </h3>
            <div className="mt-4 rounded-[3px] border border-white/10 bg-[#0f0f13] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-violet-100/45">
                {organization?.name ?? "Sin organizador"}
              </p>
              <p className="mt-2 text-xl font-black uppercase leading-tight text-white">
                {values.name || "Torneo sin nombre"}
              </p>
              <p className="mt-2 text-sm text-violet-100/65">
                {values.active ? "Activo para el sitio" : "Sin activar"}
              </p>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-violet-100/45">Participantes</dt>
                <dd className="mt-1 text-white">{values.participants.length}</dd>
              </div>
              <div>
                <dt className="text-violet-100/45">Primer premio</dt>
                <dd className="mt-1 text-white">
                  {values.primaryPrizeSlots || "0"} plazas
                </dd>
              </div>
              <div>
                <dt className="text-violet-100/45">Segundo premio</dt>
                <dd className="mt-1 text-white">
                  {values.secondaryPrizeSlots || "0"} plazas
                </dd>
              </div>
              {isEditing && (
                <div>
                  <dt className="text-violet-100/45">Usos vinculados</dt>
                  <dd className="mt-1 text-white">{referenceCount}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-sm border border-white/10 bg-[#16161a] p-3 sm:p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
              Publicación
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-violet-100/60">
              Guardar borrador permite dejar datos incompletos. Publicar valida
              que el torneo quede listo para alimentar partidos y tablas.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DashboardTournamentsForm;
