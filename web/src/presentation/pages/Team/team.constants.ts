// @ts-nocheck
import { FaChessRook } from "react-icons/fa";
import { FaGears } from "react-icons/fa6";
import { GiGloves, GiCannon } from "react-icons/gi";

export const POSITION_CONFIG = {
  arq: {
    label: "Arqueros",
    icon: GiGloves,
  },
  def: {
    label: "Defensores",
    icon: FaChessRook,
  },
  med: {
    label: "Mediocampistas",
    icon: FaGears,
  },
  del: {
    label: "Delanteros",
    icon: GiCannon,
  },
};

export const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "arq", label: "Arqueros" },
  { id: "def", label: "Defensores" },
  { id: "med", label: "Mediocampistas" },
  { id: "del", label: "Delanteros" },
];
