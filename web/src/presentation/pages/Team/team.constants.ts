// @ts-nocheck
import { POSITION_ICONS } from "../../constants/positionIcons";

export const POSITION_CONFIG = {
  arq: {
    label: "Arqueros",
    icon: POSITION_ICONS.arq,
  },
  def: {
    label: "Defensores",
    icon: POSITION_ICONS.def,
  },
  med: {
    label: "Mediocampistas",
    icon: POSITION_ICONS.med,
  },
  del: {
    label: "Delanteros",
    icon: POSITION_ICONS.del,
  },
};

export const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "arq", label: "Arqueros" },
  { id: "def", label: "Defensores" },
  { id: "med", label: "Mediocampistas" },
  { id: "del", label: "Delanteros" },
];
