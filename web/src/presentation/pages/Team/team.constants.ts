import { FaUserTie } from "react-icons/fa";
import { POSITION_ICONS } from "../../constants/positionIcons";

export const TEAM_SECTION_CONFIG = {
  arq: {
    label: "Arqueros",
    icon: POSITION_ICONS.arq,
    singularLabel: "jugador",
    pluralLabel: "jugadores",
  },
  def: {
    label: "Defensores",
    icon: POSITION_ICONS.def,
    singularLabel: "jugador",
    pluralLabel: "jugadores",
  },
  med: {
    label: "Mediocampistas",
    icon: POSITION_ICONS.med,
    singularLabel: "jugador",
    pluralLabel: "jugadores",
  },
  del: {
    label: "Delanteros",
    icon: POSITION_ICONS.del,
    singularLabel: "jugador",
    pluralLabel: "jugadores",
  },
  staff: {
    label: "Staff",
    icon: FaUserTie,
    singularLabel: "integrante",
    pluralLabel: "integrantes",
  },
} as const;

export type TeamSectionId = keyof typeof TEAM_SECTION_CONFIG;
export type PositionId = Exclude<TeamSectionId, "staff">;
export type TeamFilter = TeamSectionId | "all";

export const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "arq", label: "Arqueros" },
  { id: "def", label: "Defensores" },
  { id: "med", label: "Mediocampistas" },
  { id: "del", label: "Delanteros" },
  { id: "staff", label: "Staff" },
] satisfies Array<{ id: TeamFilter; label: string }>;
