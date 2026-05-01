import { POSITION_ICONS } from "../../constants/positionIcons";

export const POSITION_MAP = {
  arq: {
    label: "ARQUERO",
    icon: POSITION_ICONS.arq,
  },
  def: {
    label: "DEFENSOR",
    icon: POSITION_ICONS.def,
  },
  med: {
    label: "MEDIOCAMPISTA",
    icon: POSITION_ICONS.med,
  },
  del: {
    label: "DELANTERO",
    icon: POSITION_ICONS.del,
  },
} as const;

export type PlayerPositionId = keyof typeof POSITION_MAP;
