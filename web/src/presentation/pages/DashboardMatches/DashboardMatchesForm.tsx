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
import { FiArrowLeft, FiPlus, FiSave, FiTrash2 } from "react-icons/fi";

import {
  publishDashboardMatch,
  publishDashboardMatchById,
  saveDashboardMatchDraft,
} from "../../../data/dashboardMatches";
import { reportError } from "../../../lib/errors/errorLogger";
import type {
  DashboardMatchCompetition,
  DashboardMatchInput,
  DashboardMatchItem,
  DashboardMatchMutationInput,
  DashboardMatchState,
} from "../../../types/dashboard";
import { ROUTES } from "../../../shared/routing";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import { formatDateTime } from "../../utils/date.utils";
import { Field, SelectField } from "./DashboardMatchesFields";
import type { DashboardMatchErrors } from "./dashboardMatches.utils";
import {
  countMentiraGoalsRecorded,
  parseOpponentOwnGoalCount,
} from "../../../domain/games";
import {
  MATCH_COMPETITION_OPTIONS,
  MATCH_STATE_OPTIONS,
  buildDashboardMatchDraftInput,
  buildDashboardMatchMutationInput,
  fromDatetimeLocalValue,
  getDashboardMatchCompetitionLabel,
  getDashboardMatchStateLabel,
  toDatetimeLocalValue,
  validateDashboardMatchInput,
} from "./dashboardMatches.utils";
import {
  cacheDashboardMatch,
  dashboardMatchDetailQueryOptions,
  dashboardMatchOptionsQueryOptions,
  invalidateDashboardMatchesList,
  invalidateDashboardMatchPublishDependencies,
} from "./dashboardMatches.queries";

const createInitialValues = (): DashboardMatchInput => ({
  rivalId: "",
  date: new Date().toISOString(),
  location: "",
  competition: "Torneo",
  tournamentId: "",
  state: "por_jugar",
  goalsFor: "0",
  goalsAgainst: "0",
  playedPlayerIds: [],
  goalScorers: [],
  guestGoalScorers: [],
  opponentOwnGoals: "0",
});

const saveToastOptions = {
  style: {
    minWidth: "17rem",
  },
} as const;

const GUEST_GOAL_SCORER_VALUE = "__guest_goal_scorer__";
const OPPONENT_OWN_GOAL_VALUE = "__opponent_own_goal__";

type SavedMatchSnapshot = {
  valuesJson: string;
};

const dirtyFieldLabels = {
  rivalId: "Rival",
  date: "Fecha",
  location: "Ubicacion",
  competition: "Competencia",
  tournamentId: "Torneo",
  state: "Estado",
  goalsFor: "Goles Mentira FC",
  goalsAgainst: "Goles rival",
  playedPlayerIds: "Jugadores",
  goalScorers: "Goles de Mentira FC",
  guestGoalScorers: "Goles de Mentira FC",
  opponentOwnGoals: "Goles de Mentira FC",
} as const;

type DirtyFieldKey = keyof typeof dirtyFieldLabels;

const dashboardMatchCompetitions = MATCH_COMPETITION_OPTIONS.map(
  (option) => option.value
);
const dashboardMatchStates = MATCH_STATE_OPTIONS.map((option) => option.value);

const isDashboardMatchCompetition = (
  value?: string | null
): value is DashboardMatchCompetition =>
  dashboardMatchCompetitions.includes(value as DashboardMatchCompetition);

const isDashboardMatchState = (
  value?: string | null
): value is DashboardMatchState =>
  dashboardMatchStates.includes(value as DashboardMatchState);

const isPositiveGoalCount = (value: string): boolean => {
  const goals = Number(value);

  return value.trim() !== "" && Number.isInteger(goals) && goals >= 1;
};

const serializeValues = (values: DashboardMatchInput): string =>
  JSON.stringify({
    ...values,
    playedPlayerIds: [...values.playedPlayerIds].sort(),
    goalScorers: [...values.goalScorers].sort((left, right) =>
      left.playerId.localeCompare(right.playerId)
    ),
    guestGoalScorers: [...values.guestGoalScorers].sort((left, right) =>
      left.name.localeCompare(right.name)
    ),
  });

const createSavedSnapshot = (
  values: DashboardMatchInput
): SavedMatchSnapshot => ({
  valuesJson: serializeValues(values),
});

const getValuesFromMatch = (match: DashboardMatchItem): DashboardMatchInput => ({
  rivalId: match.rivalId ?? "",
  date: match.date ?? "",
  location: match.location ?? "",
  competition: isDashboardMatchCompetition(match.competition)
    ? match.competition
    : "Torneo",
  tournamentId: match.tournamentId ?? "",
  state: isDashboardMatchState(match.state) ? match.state : "por_jugar",
  goalsFor: String(match.result?.goalsFor ?? 0),
  goalsAgainst: String(match.result?.goalsAgainst ?? 0),
  playedPlayerIds: match.playedPlayers.map((player) => player.id),
  goalScorers: match.goalScorers.map((scorer) => ({
    playerId: scorer.id,
    goals: String(scorer.goals),
  })),
  guestGoalScorers: match.guestGoalScorers.map((scorer) => ({
    name: scorer.name,
    goals: String(scorer.goals),
  })),
  opponentOwnGoals: String(match.opponentOwnGoals ?? 0),
});

const DashboardMatchesForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [initialValues] = useState(createInitialValues);
  const [values, setValues] = useState<DashboardMatchInput>(initialValues);
  const [savedSnapshot, setSavedSnapshot] = useState<SavedMatchSnapshot>(
    createSavedSnapshot(initialValues)
  );
  const [errors, setErrors] = useState<DashboardMatchErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [selectedScorerPlayerId, setSelectedScorerPlayerId] = useState("");
  const [selectedScorerGoals, setSelectedScorerGoals] = useState("1");
  const [selectedGuestName, setSelectedGuestName] = useState("");
  const [selectedGuestGoals, setSelectedGuestGoals] = useState("1");

  const optionsQuery = useQuery(dashboardMatchOptionsQueryOptions());

  const matchQuery = useQuery({
    ...dashboardMatchDetailQueryOptions(id ?? "new"),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!matchQuery.data) {
      return;
    }

    const nextValues = getValuesFromMatch(matchQuery.data);

    setValues(nextValues);
    setErrors({});
    setStatus(null);
    setSavedSnapshot(createSavedSnapshot(nextValues));
  }, [matchQuery.data]);

  useEffect(() => {
    if (isEditing || !optionsQuery.data || values.tournamentId) {
      return;
    }

    const defaultTournament =
      optionsQuery.data.tournaments.find((tournament) => tournament.active) ??
      optionsQuery.data.tournaments[0];

    if (defaultTournament) {
      setValues((currentValues) => ({
        ...currentValues,
        tournamentId: defaultTournament.id,
      }));
      setSavedSnapshot((currentSnapshot) => {
        const nextValues = {
          ...initialValues,
          tournamentId: defaultTournament.id,
        };

        return currentSnapshot.valuesJson === serializeValues(initialValues)
          ? createSavedSnapshot(nextValues)
          : currentSnapshot;
      });
    }
  }, [
    initialValues,
    isEditing,
    optionsQuery.data,
    values.tournamentId,
  ]);

  const saveDraftMutation = useMutation({
    mutationFn: async (input: ReturnType<typeof buildDashboardMatchDraftInput>) =>
      saveDashboardMatchDraft(input, id),
    onSuccess: async (savedMatch) => {
      await invalidateDashboardMatchesList(queryClient);
      cacheDashboardMatch(queryClient, savedMatch);

      const nextValues = getValuesFromMatch(savedMatch);
      setValues(nextValues);
      setSavedSnapshot(createSavedSnapshot(nextValues));

      if (!isEditing) {
        navigate(ROUTES.DASHBOARD_MATCHES_EDIT(savedMatch.id), {
          replace: true,
        });
      }
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (input: DashboardMatchMutationInput) =>
      isEditing && id
        ? publishDashboardMatchById(id, input)
        : publishDashboardMatch(input),
    onSuccess: async (savedMatch) => {
      await invalidateDashboardMatchPublishDependencies(queryClient);
      cacheDashboardMatch(queryClient, savedMatch);
      navigate(ROUTES.DASHBOARD_MATCHES);
    },
  });

  const currentValuesJson = useMemo(() => serializeValues(values), [values]);
  const dirtyFields = useMemo<DirtyFieldKey[]>(() => {
    if (currentValuesJson === savedSnapshot.valuesJson) {
      return [];
    }

    const savedValues = JSON.parse(savedSnapshot.valuesJson) as DashboardMatchInput;

    return (Object.keys(dirtyFieldLabels) as DirtyFieldKey[]).filter((field) => {
      if (field === "playedPlayerIds") {
        return (
          [...values.playedPlayerIds].sort().join("|") !==
          [...savedValues.playedPlayerIds].sort().join("|")
        );
      }

      if (field === "goalScorers") {
        return (
          JSON.stringify([...values.goalScorers].sort((left, right) =>
            left.playerId.localeCompare(right.playerId)
          )) !==
          JSON.stringify([...savedValues.goalScorers].sort((left, right) =>
            left.playerId.localeCompare(right.playerId)
          ))
        );
      }

      if (field === "guestGoalScorers") {
        return (
          JSON.stringify([...values.guestGoalScorers].sort((left, right) =>
            left.name.localeCompare(right.name)
          )) !==
          JSON.stringify([...savedValues.guestGoalScorers].sort((left, right) =>
            left.name.localeCompare(right.name)
          ))
        );
      }

      return values[field] !== savedValues[field];
    });
  }, [currentValuesJson, savedSnapshot.valuesJson, values]);
  const dirtyLabels = [
    ...new Set(dirtyFields.map((field) => dirtyFieldLabels[field])),
  ];
  const isDirty = (field: DirtyFieldKey): boolean =>
    dirtyFields.includes(field);
  const isSaving = saveDraftMutation.isPending || publishMutation.isPending;

  if (optionsQuery.isLoading || matchQuery.isLoading) {
    return <DashboardContentLoader />;
  }

  if (optionsQuery.isError || matchQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar el partido"
        message="Intenta nuevamente en unos minutos."
        onRetry={() => {
          void optionsQuery.refetch();
          void matchQuery.refetch();
        }}
      />
    );
  }

  const options = optionsQuery.data;
  const teams = options?.teams.filter((team) => !team.isMain) ?? [];
  const tournaments = options?.tournaments ?? [];
  const players = options?.players ?? [];
  const selectedRival = teams.find((team) => team.id === values.rivalId);
  const selectedTournament = tournaments.find(
    (tournament) => tournament.id === values.tournamentId
  );
  const selectedPlayersCount = values.playedPlayerIds.length;
  const selectedGoalScorersCount = countMentiraGoalsRecorded(
    values.goalScorers,
    values.guestGoalScorers,
    parseOpponentOwnGoalCount(values.opponentOwnGoals)
  );
  const availableScorerPlayers = players.filter(
    (player) =>
      !values.goalScorers.some((scorer) => scorer.playerId === player.id)
  );
  const isGuestGoalScorerSelected =
    selectedScorerPlayerId === GUEST_GOAL_SCORER_VALUE;
  const isOpponentOwnGoalSelected =
    selectedScorerPlayerId === OPPONENT_OWN_GOAL_VALUE;
  const selectedScorerGoalsValid = isPositiveGoalCount(selectedScorerGoals);
  const selectedGuestGoalsValid = isPositiveGoalCount(selectedGuestGoals);
  const canAddGoalEvent = isGuestGoalScorerSelected
    ? selectedGuestName.trim().length > 0 && selectedGuestGoalsValid
    : isOpponentOwnGoalSelected
      ? selectedScorerGoalsValid
      : selectedScorerPlayerId.length > 0 && selectedScorerGoalsValid;
  const opponentOwnGoalsCount = parseOpponentOwnGoalCount(
    values.opponentOwnGoals
  );
  const hasGoalEvents =
    values.goalScorers.length > 0 ||
    values.guestGoalScorers.length > 0 ||
    opponentOwnGoalsCount > 0;
  const goalEventsDirty =
    isDirty("goalScorers") ||
    isDirty("guestGoalScorers") ||
    isDirty("opponentOwnGoals");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setValues((currentValues) => {
      if (name === "date") {
        return {
          ...currentValues,
          date: fromDatetimeLocalValue(value),
        };
      }

      if (name === "competition") {
        const competition = value as DashboardMatchCompetition;

        return {
          ...currentValues,
          competition,
          tournamentId:
            competition === "Torneo" ? currentValues.tournamentId : "",
        };
      }

      if (name === "state") {
        return {
          ...currentValues,
          state: value as DashboardMatchState,
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

  const handlePlayerToggle = (playerId: string) => {
    setValues((currentValues) => {
      const nextPlayerIds = currentValues.playedPlayerIds.includes(playerId)
        ? currentValues.playedPlayerIds.filter((id) => id !== playerId)
        : [...currentValues.playedPlayerIds, playerId];

      return {
        ...currentValues,
        playedPlayerIds: nextPlayerIds,
      };
    });
    setErrors((currentErrors) => ({
      ...currentErrors,
      playedPlayerIds: undefined,
    }));
    setStatus(null);
  };

  const handleSelectAllPlayers = () => {
    setValues((currentValues) => ({
      ...currentValues,
      playedPlayerIds:
        currentValues.playedPlayerIds.length === players.length
          ? []
          : players.map((player) => player.id),
    }));
    setStatus(null);
  };

  function clearGoalValidationErrors() {
    setErrors((currentErrors) => ({
      ...currentErrors,
      goalScorers: undefined,
    }));
    setStatus(null);
  }

  const handleAddGoalScorer = () => {
    if (isGuestGoalScorerSelected) {
      handleAddGuestGoalScorer();
      return;
    }

    if (isOpponentOwnGoalSelected) {
      const goals = Number(selectedScorerGoals);

      if (!Number.isInteger(goals) || goals < 1) {
        return;
      }

      setValues((currentValues) => ({
        ...currentValues,
        opponentOwnGoals: String(
          parseOpponentOwnGoalCount(currentValues.opponentOwnGoals) + goals
        ),
      }));
      setSelectedScorerPlayerId("");
      setSelectedScorerGoals("1");
      clearGoalValidationErrors();
      return;
    }

    const goals = Number(selectedScorerGoals);

    if (
      !selectedScorerPlayerId ||
      !Number.isInteger(goals) ||
      goals < 1
    ) {
      return;
    }

    setValues((currentValues) => ({
      ...currentValues,
      goalScorers: [
        ...currentValues.goalScorers,
        {
          playerId: selectedScorerPlayerId,
          goals: String(goals),
        },
      ],
    }));
    setSelectedScorerPlayerId("");
    setSelectedScorerGoals("1");
    clearGoalValidationErrors();
  };

  const handleGoalScorerGoalsChange = (
    playerId: string,
    nextGoals: string
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      goalScorers: currentValues.goalScorers.map((scorer) =>
        scorer.playerId === playerId
          ? {
              ...scorer,
              goals: nextGoals,
            }
          : scorer
      ),
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      goalScorers: undefined,
    }));
    setStatus(null);
  };

  const handleRemoveGoalScorer = (playerId: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      goalScorers: currentValues.goalScorers.filter(
        (scorer) => scorer.playerId !== playerId
      ),
    }));
    clearGoalValidationErrors();
  };

  const handleAddGuestGoalScorer = () => {
    const name = selectedGuestName.trim();
    const goals = Number(selectedGuestGoals);

    if (!name || !Number.isInteger(goals) || goals < 1) {
      return;
    }

    setValues((currentValues) => ({
      ...currentValues,
      guestGoalScorers: [
        ...currentValues.guestGoalScorers,
        {
          name,
          goals: String(goals),
        },
      ],
    }));
    setSelectedScorerPlayerId("");
    setSelectedGuestName("");
    setSelectedGuestGoals("1");
    clearGoalValidationErrors();
  };

  const handleGuestGoalScorerGoalsChange = (name: string, nextGoals: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      guestGoalScorers: currentValues.guestGoalScorers.map((scorer) =>
        scorer.name === name
          ? {
              ...scorer,
              goals: nextGoals,
            }
          : scorer
      ),
    }));
    clearGoalValidationErrors();
  };

  const handleOpponentOwnGoalsChange = (nextGoals: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      opponentOwnGoals: nextGoals,
    }));
    clearGoalValidationErrors();
  };

  const handleRemoveOpponentOwnGoals = () => {
    setValues((currentValues) => ({
      ...currentValues,
      opponentOwnGoals: "0",
    }));
    clearGoalValidationErrors();
  };

  const handleRemoveGuestGoalScorer = (name: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      guestGoalScorers: currentValues.guestGoalScorers.filter(
        (scorer) => scorer.name !== name
      ),
    }));
    clearGoalValidationErrors();
  };

  const handleSaveDraft = async () => {
    setStatus(null);
    setErrors({});

    try {
      await toast.promise(
        saveDraftMutation.mutateAsync(buildDashboardMatchDraftInput(values)),
        {
          loading: "Guardando borrador en Sanity...",
          success: "Borrador guardado correctamente.",
          error: "No pudimos guardar el borrador.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardMatchesForm",
        action: "save_match_draft",
      });
      setStatus("No pudimos guardar el borrador. Intenta de nuevo.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValues: DashboardMatchInput = {
      ...values,
      rivalId: values.rivalId.trim(),
      date: values.date.trim(),
      location: values.location.trim(),
      tournamentId: values.tournamentId.trim(),
      goalsFor: values.goalsFor.trim(),
      goalsAgainst: values.goalsAgainst.trim(),
    };
    const nextErrors = validateDashboardMatchInput(normalizedValues);
    setErrors(nextErrors);
    setStatus(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const confirmed = await confirmDashboardAction({
      title: isEditing ? "Publicar cambios" : "Publicar partido",
      text: isEditing
        ? "El borrador se va a publicar en Sanity y actualizara el partido visible en el sitio."
        : "El partido se va a publicar en Sanity y quedara visible en el sitio.",
      confirmText: isEditing ? "Publicar cambios" : "Publicar",
      icon: isEditing ? "question" : "info",
    });

    if (!confirmed) {
      return;
    }

    try {
      await toast.promise(
        publishMutation.mutateAsync(
          buildDashboardMatchMutationInput(normalizedValues)
        ),
        {
          loading: isEditing
            ? "Publicando cambios en Sanity..."
            : "Publicando partido en Sanity...",
          success: isEditing
            ? "Cambios publicados correctamente."
            : "Partido publicado correctamente.",
          error: "No pudimos publicar el partido.",
        },
        saveToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardMatchesForm",
        action: isEditing ? "publish_match_changes" : "publish_match",
      });
      setStatus("No pudimos publicar el partido. Intenta de nuevo.");
    }
  };

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Partidos
            </p>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              {isEditing ? "Editar partido" : "Nuevo partido"}
            </h2>
            <p className="mt-2 text-sm text-violet-100/65">
              Carga fixture, resultado y jugadores que participaron.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_MATCHES}
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
              id="dashboard-match-rival"
              name="rivalId"
              label="Rival"
              value={values.rivalId}
              error={errors.rivalId}
              dirty={isDirty("rivalId")}
              onChange={handleChange}
            >
              <option value="">Elegir rival</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </SelectField>

            <Field
              id="dashboard-match-date"
              name="date"
              type="datetime-local"
              label="Fecha y hora"
              value={toDatetimeLocalValue(values.date)}
              error={errors.date}
              dirty={isDirty("date")}
              onChange={handleChange}
            />
          </div>

          <Field
            id="dashboard-match-location"
            name="location"
            label="Ubicacion"
            value={values.location}
            error={errors.location}
            dirty={isDirty("location")}
            onChange={handleChange}
          />

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <SelectField
              id="dashboard-match-competition"
              name="competition"
              label="Competencia"
              value={values.competition}
              error={errors.competition}
              dirty={isDirty("competition")}
              onChange={handleChange}
            >
              {MATCH_COMPETITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>

            <SelectField
              id="dashboard-match-state"
              name="state"
              label="Estado"
              value={values.state}
              error={errors.state}
              dirty={isDirty("state")}
              onChange={handleChange}
            >
              {MATCH_STATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          </div>

          {values.competition === "Torneo" && (
            <SelectField
              id="dashboard-match-tournament"
              name="tournamentId"
              label="Torneo"
              value={values.tournamentId}
              error={errors.tournamentId}
              dirty={isDirty("tournamentId")}
              onChange={handleChange}
            >
              <option value="">Elegir torneo</option>
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {[
                    tournament.organizationName,
                    tournament.name,
                    tournament.active ? "Activo" : null,
                  ]
                    .filter(Boolean)
                    .join(" - ")}
                </option>
              ))}
            </SelectField>
          )}

          {values.state === "finalizado" && (
            <section className="space-y-4 rounded-sm border border-white/10 bg-[#0f0f13] p-3 sm:p-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-violet-100">
                  Resultado
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-violet-100/55">
                  Registra solo goles a favor de Mentira FC. Los goles del rival
                  van en el marcador, sin eventos.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                <Field
                  id="dashboard-match-goals-for"
                  name="goalsFor"
                  type="number"
                  min={0}
                  label="Goles Mentira FC"
                  value={values.goalsFor}
                  error={errors.goalsFor}
                  dirty={isDirty("goalsFor")}
                  onChange={handleChange}
                />
                <Field
                  id="dashboard-match-goals-against"
                  name="goalsAgainst"
                  type="number"
                  min={0}
                  label="Goles rival"
                  value={values.goalsAgainst}
                  error={errors.goalsAgainst}
                  dirty={isDirty("goalsAgainst")}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-3 rounded-[3px] border border-white/10 bg-[#151518] p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-violet-100">
                      <span>Goles de Mentira FC</span>
                      {goalEventsDirty && (
                        <span className="rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
                          Editado
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-violet-100/45">
                      Elegí jugadores del plantel, invitados o goles en propia.
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-[3px] border px-2.5 py-1 text-xs font-medium ${
                      errors.goalScorers
                        ? "border-red-300/25 bg-red-400/10 text-red-100"
                        : "border-violet-300/15 bg-violet-300/10 text-violet-100"
                    }`}
                  >
                    {selectedGoalScorersCount} goles
                  </span>
                </div>

                {errors.goalScorers && (
                  <p
                    id="dashboard-match-goal-scorers-error"
                    className="rounded-[3px] border border-red-300/20 bg-red-400/8 px-3 py-2 text-sm text-red-100"
                    role="alert"
                  >
                    {errors.goalScorers}
                  </p>
                )}

                <div
                  className={`grid gap-2 rounded-[3px] border border-white/10 bg-[#0f0f13] p-2 sm:border-0 sm:bg-transparent sm:p-0 ${
                    isGuestGoalScorerSelected
                      ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem_2.75rem]"
                      : "sm:grid-cols-[minmax(0,1fr)_7rem_2.75rem]"
                  }`}
                >
                  <select
                    value={selectedScorerPlayerId}
                    onChange={(event) =>
                      setSelectedScorerPlayerId(event.target.value)
                    }
                    className="min-h-11 w-full min-w-0 rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20"
                    aria-label="Goleador"
                  >
                    <option value="">Elegir goleador</option>
                    <option value={GUEST_GOAL_SCORER_VALUE}>Invitado</option>
                    <option value={OPPONENT_OWN_GOAL_VALUE}>
                      Gol en propia
                    </option>
                    {availableScorerPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.number != null ? `#${player.number} ` : ""}
                        {player.fullName}
                      </option>
                    ))}
                  </select>
                  {isGuestGoalScorerSelected && (
                    <input
                      type="text"
                      value={selectedGuestName}
                      onChange={(event) =>
                        setSelectedGuestName(event.target.value)
                      }
                      placeholder="Nombre del invitado"
                      className="min-h-11 w-full min-w-0 rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20"
                      aria-label="Nombre del invitado"
                    />
                  )}
                  <input
                    type="number"
                    min={1}
                    value={
                      isGuestGoalScorerSelected
                        ? selectedGuestGoals
                        : selectedScorerGoals
                    }
                    onChange={(event) =>
                      isGuestGoalScorerSelected
                        ? setSelectedGuestGoals(event.target.value)
                        : setSelectedScorerGoals(event.target.value)
                    }
                    className="min-h-11 w-full min-w-0 rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20"
                    aria-label={
                      isOpponentOwnGoalSelected
                        ? "Cantidad de goles en propia"
                        : "Cantidad de goles"
                    }
                  />
                  <button
                    type="button"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[3px] border border-violet-200/25 bg-violet-100 px-3 text-sm font-semibold text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:w-11 sm:px-0"
                    disabled={!canAddGoalEvent}
                    aria-label="Agregar gol"
                    title="Agregar gol"
                    onClick={handleAddGoalScorer}
                  >
                    <FiPlus className="size-4" aria-hidden="true" />
                    <span className="sm:sr-only">Agregar</span>
                  </button>
                </div>

                {hasGoalEvents ? (
                  <div className="space-y-2">
                    {values.goalScorers.map((scorer) => {
                      const player = players.find(
                        (item) => item.id === scorer.playerId
                      );

                      return (
                        <div
                          key={scorer.playerId}
                          className="relative grid gap-3 rounded-[3px] border border-white/10 bg-[#0f0f13] p-3 sm:grid-cols-[minmax(0,1fr)_6rem_2.75rem] sm:items-center sm:p-2"
                        >
                          <div className="min-w-0 pr-12 sm:pr-0">
                            <p className="truncate text-sm font-medium text-white">
                              {player?.number != null
                                ? `#${player.number} `
                                : ""}
                              {player?.fullName ?? "Jugador"}
                            </p>
                            <p className="text-xs text-violet-100/45">
                              Plantel
                            </p>
                          </div>
                          <input
                            type="number"
                            min={1}
                            value={scorer.goals}
                            onChange={(event) =>
                              handleGoalScorerGoalsChange(
                                scorer.playerId,
                                event.target.value
                              )
                            }
                            className="min-h-11 w-full min-w-0 rounded-[3px] border border-white/10 bg-[#151518] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20"
                            aria-label={`Goles de ${
                              player?.fullName ?? "jugador"
                            }`}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-[3px] border border-red-300/20 text-red-100 transition hover:border-red-200/45 hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-violet-500/40 sm:static sm:size-11"
                            aria-label="Quitar goleador"
                            title="Quitar goleador"
                            onClick={() =>
                              handleRemoveGoalScorer(scorer.playerId)
                            }
                          >
                            <FiTrash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      );
                    })}
                    {values.guestGoalScorers.map((scorer) => (
                      <div
                        key={`guest-${scorer.name}`}
                        className="relative grid gap-3 rounded-[3px] border border-white/10 bg-[#0f0f13] p-3 sm:grid-cols-[minmax(0,1fr)_6rem_2.75rem] sm:items-center sm:p-2"
                      >
                        <div className="min-w-0 pr-12 sm:pr-0">
                          <p className="truncate text-sm font-medium text-white">
                            {scorer.name}
                          </p>
                          <p className="text-xs text-violet-100/45">
                            Invitado
                          </p>
                        </div>
                        <input
                          type="number"
                          min={1}
                          value={scorer.goals}
                          onChange={(event) =>
                            handleGuestGoalScorerGoalsChange(
                              scorer.name,
                              event.target.value
                            )
                          }
                          className="min-h-11 w-full min-w-0 rounded-[3px] border border-white/10 bg-[#151518] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20"
                          aria-label={`Goles de ${scorer.name}`}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-[3px] border border-red-300/20 text-red-100 transition hover:border-red-200/45 hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-violet-500/40 sm:static sm:size-11"
                          aria-label={`Quitar goles de ${scorer.name}`}
                          title={`Quitar goles de ${scorer.name}`}
                          onClick={() =>
                            handleRemoveGuestGoalScorer(scorer.name)
                          }
                        >
                          <FiTrash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    {opponentOwnGoalsCount > 0 && (
                      <div className="relative grid gap-3 rounded-[3px] border border-white/10 bg-[#0f0f13] p-3 sm:grid-cols-[minmax(0,1fr)_6rem_2.75rem] sm:items-center sm:p-2">
                        <div className="min-w-0 pr-12 sm:pr-0">
                          <p className="truncate text-sm font-medium text-white">
                            Gol en propia
                          </p>
                          <p className="text-xs text-violet-100/45">
                            Rival a favor de Mentira FC
                          </p>
                        </div>
                        <input
                          type="number"
                          min={1}
                          value={values.opponentOwnGoals}
                          onChange={(event) =>
                            handleOpponentOwnGoalsChange(event.target.value)
                          }
                          className="min-h-11 w-full min-w-0 rounded-[3px] border border-white/10 bg-[#151518] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20"
                          aria-label="Goles en propia del rival"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-[3px] border border-red-300/20 text-red-100 transition hover:border-red-200/45 hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-violet-500/40 sm:static sm:size-11"
                          aria-label="Quitar goles en propia"
                          title="Quitar goles en propia"
                          onClick={handleRemoveOpponentOwnGoals}
                        >
                          <FiTrash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="rounded-[3px] border border-dashed border-white/10 px-3 py-3 text-sm text-violet-100/55">
                    Sin eventos de gol cargados.
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-violet-100">
                    <span>Jugadores que jugaron</span>
                    {isDirty("playedPlayerIds") && (
                      <span className="rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
                        Editado
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="min-h-9 w-full rounded-[3px] border border-white/10 px-3 py-1.5 text-xs font-medium text-violet-100/75 transition hover:border-violet-200/35 hover:bg-white/4.5 hover:text-white sm:w-auto"
                    onClick={handleSelectAllPlayers}
                  >
                    {selectedPlayersCount === players.length
                      ? "Limpiar"
                      : "Seleccionar todos"}
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto rounded-[3px] border border-white/10 bg-[#151518]">
                  {players.length === 0 ? (
                    <p className="p-3 text-sm text-violet-100/60">
                      No hay jugadores disponibles.
                    </p>
                  ) : (
                    <div className="grid gap-1 p-2 sm:grid-cols-2">
                      {players.map((player) => (
                        <label
                          key={player.id}
                          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[3px] px-3 py-2 text-sm text-violet-50 transition hover:bg-white/4.5"
                        >
                          <input
                            type="checkbox"
                            checked={values.playedPlayerIds.includes(player.id)}
                            onChange={() => handlePlayerToggle(player.id)}
                            className="size-4 accent-violet-300"
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {player.number != null ? `#${player.number} ` : ""}
                              {player.fullName}
                            </span>
                            {player.position && (
                              <span className="block text-xs text-violet-100/45">
                                {player.position}
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

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
                {getDashboardMatchCompetitionLabel(values.competition)}
              </p>
              <p className="mt-2 text-xl font-black uppercase leading-tight text-white">
                Mentira FC vs {selectedRival?.name || "Rival"}
              </p>
              <p className="mt-2 text-sm text-violet-100/65">
                {values.date ? formatDateTime(values.date) : "Sin fecha"}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="rounded-[3px] border border-violet-300/15 bg-violet-300/10 px-2.5 py-1 text-xs font-medium text-violet-100">
                  {getDashboardMatchStateLabel(values.state)}
                </span>
                <span className="text-2xl font-black text-white">
                  {values.state === "finalizado"
                    ? `${values.goalsFor || 0} - ${values.goalsAgainst || 0}`
                    : "VS"}
                </span>
              </div>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-violet-100/45">Torneo</dt>
                <dd className="mt-1 text-white">
                  {values.competition === "Torneo"
                    ? [
                        selectedTournament?.organizationName,
                        selectedTournament?.name,
                      ]
                        .filter(Boolean)
                        .join(" - ") || "Sin torneo"
                    : values.competition}
                </dd>
              </div>
              <div>
                <dt className="text-violet-100/45">Ubicacion</dt>
                <dd className="mt-1 text-white">
                  {values.location || "Sin ubicacion"}
                </dd>
              </div>
              <div>
                <dt className="text-violet-100/45">Jugadores</dt>
                <dd className="mt-1 text-white">
                  {values.state === "finalizado"
                    ? `${selectedPlayersCount} seleccionados`
                    : "Se cargan al finalizar"}
                </dd>
              </div>
              <div>
                <dt className="text-violet-100/45">Goles cargados</dt>
                <dd className="mt-1 text-white">
                  {values.state === "finalizado"
                    ? `${selectedGoalScorersCount} de ${values.goalsFor || 0} a favor`
                    : "Se cargan al finalizar"}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DashboardMatchesForm;
